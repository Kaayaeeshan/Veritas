from flask import Blueprint, jsonify, g, request
from datetime import datetime
from firebase_admin_setup import get_db
from auth_middleware import require_auth, require_role
from ai_models.waiting_time_model import get_waiting_time_model, clinic_local_now
from notifications import notify_patient_called

queue_bp = Blueprint("queue", __name__)


def _minutes_between(start_str, end_str):
    try:
        start = datetime.strptime(start_str, "%I:%M %p")
        end = datetime.strptime(end_str, "%I:%M %p")
        # Convert the timestamp difference from seconds to non negative minutes.
        return max(0.0, (end - start).total_seconds() / 60)
    except (TypeError, ValueError):
        return None


def _cumulative_duration_ahead(db, doctor_id, today_str, before_position, avg_interval):
   
    entries = (
        db.collection("queue")
        .where("doctorId", "==", doctor_id)
        .where("checkInDate", "==", today_str)
        .where("position", "<", before_position)
        .stream()
    )
    total = 0.0
    for e in entries:
        data = e.to_dict()
        steps = data.get("stepTimestamps", {})
        actual = _minutes_between(steps.get("calledIn"), steps.get("inConsultation"))
        # Add the recorded duration or use the average interval when it is missing.
        total += actual if actual is not None else avg_interval
    return total


def _predict_wait(db, doctor_id, patients_ahead, cumulative_duration_ahead=0):
    doctor = db.collection("doctors").document(doctor_id).get().to_dict() or {}
    now = clinic_local_now()
# Build the seven live inputs and request a waiting-time prediction.
# Age and sex currently use fixed defaults rather than patient details.
    return get_waiting_time_model().predict({
        "patients_ahead": patients_ahead,
        "hour_of_day": now.hour,
        "day_of_week": now.weekday(),
        "scheduling_interval": doctor.get("avgSchedulingInterval", 5),
        "age": 40,
        "sex": 0,
        "cumulative_duration_ahead": cumulative_duration_ahead,
    })


@queue_bp.post("/appointments/<appointment_id>/check-in")
@require_auth
@require_role("patient")
def check_in(appointment_id):
    """
    Turns a booked appointment into a live queue entry call this when the
    patient physically arrives.
    """
    db = get_db()
    appt_ref = db.collection("appointments").document(appointment_id)
    appt = appt_ref.get()
    if not appt.exists or appt.to_dict().get("patientUid") != g.uid:
        return jsonify({"message": "Appointment not found"}), 404

    appt_data = appt.to_dict()
    if appt_data.get("status") != "booked":
        return jsonify({"message": "This appointment isn't in a bookable state to check in"}), 409

    
    today_str = clinic_local_now().strftime("%Y-%m-%d")
    if appt_data.get("date") != today_str:
        return jsonify({
            "message": f"This appointment is scheduled for {appt_data.get('date')}. "
                       f"You can only check in on the day of your appointment."
        }), 409

    existing_today = list(
        db.collection("queue")
        .where("doctorId", "==", appt_data["doctorId"])
        .where("status", "in", ["waiting", "called", "in_consultation"])
        .stream()
    )
    position = len(existing_today) + 1

    queue_ref = db.collection("queue").document()
    queue_ref.set(
        {
            "doctorId": appt_data["doctorId"],
            "doctorName": appt_data.get("doctorName"),
            "patientUid": g.uid,
            "patientName": g.user.get("fullName"),
            "appointmentId": appointment_id,
            "position": position,
            "status": "waiting",
            "notifyBeforeTurn": True,
            "checkInDate": today_str,
            "checkInTime": clinic_local_now().strftime("%I:%M %p"),
            "stepTimestamps": {"checkedIn": clinic_local_now().strftime("%I:%M %p")},
            "createdAt": datetime.utcnow().isoformat(),
        }
    )
    appt_ref.update({"status": "checked_in"})
    return jsonify({"id": queue_ref.id, "position": position, "status": "waiting"}), 201


@queue_bp.get("/queue/me")
@require_auth
@require_role("patient")
def my_queue_status():
    db = get_db()
    entries = list(
        db.collection("queue").where("patientUid", "==", g.uid)
        .where("status", "in", ["waiting", "called", "in_consultation"])
        .limit(1).stream()
    )
    if not entries:
        return jsonify({"message": "No active queue entry"}), 404

    entry = entries[0].to_dict()
    doctor = db.collection("doctors").document(entry["doctorId"]).get().to_dict() or {}
    avg_interval = doctor.get("avgSchedulingInterval", 5)

# Count earlier position entries that are still waiting for this doctor.
    ahead = len(
        list(
            db.collection("queue").where("doctorId", "==", entry["doctorId"])
            .where("status", "==", "waiting").where("position", "<", entry["position"])
            .stream()
        )
    )
    cum_duration = _cumulative_duration_ahead(
        db, entry["doctorId"], entry.get("checkInDate", ""), entry["position"], avg_interval
    )

    return jsonify(
        {
            "clinicName": "Veritas Clinic",
            "doctorName": doctor.get("fullName"),
            "specialty": doctor.get("specialty"),
            "position": entry["position"],
            "status": entry.get("status"),
            "estimatedWaitMinutes": _predict_wait(db, entry["doctorId"], ahead, cum_duration),
            "stepTimestamps": entry.get("stepTimestamps", {}),
        }
    )


@queue_bp.post("/queue/me/notify-preference")
@require_auth
@require_role("patient")
def set_notify_preference():
    enabled = request.get_json().get("enabled", True)
    db = get_db()
    entries = list(
        db.collection("queue").where("patientUid", "==", g.uid)
        .where("status", "in", ["waiting", "called"]).limit(1).stream()
    )
    if entries:
        entries[0].reference.update({"notifyBeforeTurn": enabled})
    return jsonify({"notifyBeforeTurn": enabled})


@queue_bp.get("/queue/doctor/<doctor_id>")
@require_auth
@require_role("doctor", "admin")
def doctor_queue(doctor_id):
    db = get_db()
    entries = (
        db.collection("queue").where("doctorId", "==", doctor_id)
        .where("status", "in", ["waiting", "called", "in_consultation"])
        .order_by("position").stream()
    )
    return jsonify(
        [
            {
                "id": e.id,
                "patientName": e.to_dict().get("patientName"),
                "checkInTime": e.to_dict().get("checkInTime"),
                "status": e.to_dict().get("status"),
            }
            for e in entries
        ]
    )


@queue_bp.post("/queue/doctor/<doctor_id>/call-next")
@require_auth
@require_role("doctor", "admin")
def call_next(doctor_id):
    db = get_db()
    next_entries = list(
        db.collection("queue").where("doctorId", "==", doctor_id)
        .where("status", "==", "waiting").order_by("position").limit(1).stream()
    )
    if not next_entries:
        return jsonify({"message": "Queue is empty"}), 404

    entry = next_entries[0]
    entry.reference.update(
        {"status": "in_consultation", "stepTimestamps.calledIn": clinic_local_now().strftime("%I:%M %p")}
    )

    entry_data = entry.to_dict()
    doctor = db.collection("doctors").document(doctor_id).get().to_dict() or {}
    patient_profile = db.collection("users").document(entry_data.get("patientUid", "")).get()
    try:
        if patient_profile.exists and patient_profile.to_dict().get("phone"):
            notify_patient_called(patient_profile.to_dict()["phone"], doctor.get("fullName", "your doctor"))
    except Exception as e:
        import logging
        logging.getLogger("veritas.notifications").exception("Failed to send call-next SMS: %s", e)

    return jsonify({"id": entry.id, "status": "in_consultation"})


@queue_bp.post("/queue/<queue_entry_id>/complete")
@require_auth
@require_role("doctor", "admin")
def complete_visit(queue_entry_id):
    db = get_db()
    ref = db.collection("queue").document(queue_entry_id)
    entry = ref.get()
    if not entry.exists:
        return jsonify({"message": "Queue entry not found"}), 404
    ref.update({"status": "completed", "stepTimestamps.inConsultation": clinic_local_now().strftime("%I:%M %p")})

    appt_id = entry.to_dict().get("appointmentId")
    if appt_id:
        db.collection("appointments").document(appt_id).update({"status": "completed"})

    return jsonify({"id": queue_entry_id, "status": "completed"})
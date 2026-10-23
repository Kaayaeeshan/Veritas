from flask import Blueprint, request, jsonify, g
from datetime import datetime
from firebase_admin import firestore
from firebase_admin_setup import get_db
from auth_middleware import require_auth, require_role

appointments_bp = Blueprint("appointments", __name__)


def _slot_doc_id(doctor_id, date, time):
    """
    A deterministic ID (one doctor + one date + one time = exactly one
    possible document) turns "check if taken, then create" into a single
    atomic operation instead of two separate steps a race condition can
    slip between. Firestore transactions guarantee that if two requests
    read+write the same document concurrently, the second one is retried
    only after seeing the first's committed result -- so only one of two
    simultaneous bookings for the same slot can ever succeed.
    """
    safe_time = time.replace(" ", "").replace(":", "")
    return f"{doctor_id}_{date}_{safe_time}"


class SlotTakenError(Exception):
    pass


@firestore.transactional
def _book_in_transaction(transaction, ref, data):
    snapshot = ref.get(transaction=transaction)
    if snapshot.exists and snapshot.to_dict().get("status") == "booked":
        raise SlotTakenError()
    transaction.set(ref, data)


@appointments_bp.post("/appointments")
@require_auth
@require_role("patient")
def book_appointment():
    payload = request.get_json()
    doctor_id, date, time = payload.get("doctorId"), payload.get("date"), payload.get("time")
    if not all([doctor_id, date, time]):
        return jsonify({"message": "doctorId, date, and time are required"}), 400

    db = get_db()
    doctor_snap = db.collection("doctors").document(doctor_id).get()
    if not doctor_snap.exists:
        return jsonify({"message": "Doctor not found"}), 404

    doc_ref = db.collection("appointments").document(_slot_doc_id(doctor_id, date, time))
    data = {
        "patientUid": g.uid,
        "patientName": g.user.get("fullName"),
        "doctorId": doctor_id,
        "doctorName": doctor_snap.to_dict().get("fullName"),
        "date": date,
        "time": time,
        "status": "booked",
        "createdAt": datetime.utcnow().isoformat(),
    }

    try:
        transaction = db.transaction()
        _book_in_transaction(transaction, doc_ref, data)
    except SlotTakenError:
        return jsonify({"message": "That slot was just taken — pick another."}), 409

    return jsonify({"id": doc_ref.id, "status": "booked"}), 201


@appointments_bp.get("/appointments/me")
@require_auth
@require_role("patient")
def my_appointments():
    db = get_db()
    docs = (
        db.collection("appointments").where("patientUid", "==", g.uid)
        .order_by("date", direction="DESCENDING").stream()
    )
    return jsonify([{**d.to_dict(), "id": d.id} for d in docs])


@appointments_bp.put("/appointments/<appointment_id>")
@require_auth
@require_role("patient")
def reschedule_appointment(appointment_id):
    payload = request.get_json()
    db = get_db()
    ref = db.collection("appointments").document(appointment_id)
    snap = ref.get()
    if not snap.exists or snap.to_dict().get("patientUid") != g.uid:
        return jsonify({"message": "Appointment not found"}), 404

    ref.update({"date": payload.get("date"), "time": payload.get("time")})
    return jsonify({"id": appointment_id, "status": "rescheduled"})


@appointments_bp.delete("/appointments/<appointment_id>")
@require_auth
@require_role("patient")
def cancel_appointment(appointment_id):
    db = get_db()
    ref = db.collection("appointments").document(appointment_id)
    snap = ref.get()
    if not snap.exists or snap.to_dict().get("patientUid") != g.uid:
        return jsonify({"message": "Appointment not found"}), 404

    ref.update({"status": "cancelled"})
    return jsonify({"id": appointment_id, "status": "cancelled"})
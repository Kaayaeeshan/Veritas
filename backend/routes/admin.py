import os
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, g
from firebase_admin_setup import get_db, get_auth
from auth_middleware import require_auth, require_role
from ai_models.waiting_time_model import get_waiting_time_model, clinic_local_now, MODEL_PATH as WAIT_MODEL_PATH
from routes.queue import _cumulative_duration_ahead
from ai_models.credibility_model import get_credibility_model, MODEL_PATH as CRED_MODEL_PATH
from ai_models.fake_review_model import SKLEARN_MODEL_PATH as FAKE_MODEL_PATH

admin_bp = Blueprint("admin", __name__)


# Doctor account management — admin creates/edits, never the doctor themself


@admin_bp.post("/doctors")
@require_auth
@require_role("admin")
def create_doctor():
    payload = request.get_json()
    full_name, specialty, email = payload.get("fullName"), payload.get("specialty"), payload.get("email")
    if not all([full_name, specialty, email]):
        return jsonify({"message": "fullName, specialty, and email are required"}), 400

    db = get_db()
    import secrets
    temp_password = secrets.token_urlsafe(12)

    try:
        auth_user = get_auth().create_user(email=email, password=temp_password, display_name=full_name)
    except Exception as e:
        if "EMAIL_EXISTS" not in str(e) and "already exists" not in str(e).lower():
            return jsonify({"message": f"Couldn't create the doctor's account: {e}"}), 500

        auth_user = get_auth().get_user_by_email(email)
        existing_profile = db.collection("users").document(auth_user.uid).get()
        if existing_profile.exists and existing_profile.to_dict().get("doctorId"):
            return jsonify({"message": "A doctor account for this email already exists."}), 409

    doctor_ref = db.collection("doctors").document()
    doctor_ref.set(
        {
            "fullName": full_name,
            "specialty": specialty,
            "email": email,
            "credibilityScore": 70,
            "verifiedReviewCount": 0,
            "responseRate": 100,
            "flaggedFilteredCount": 0,
            "avgSchedulingInterval": 5,
            "active": True,
            "createdAt": datetime.utcnow().isoformat(),
        }
    )
    db.collection("users").document(auth_user.uid).set(
        {
            "fullName": full_name,
            "email": email,
            "role": "doctor",
            "doctorId": doctor_ref.id,
            "createdAt": datetime.utcnow().isoformat(),
        }
    )

    reset_link = None
    try:
        reset_link = get_auth().generate_password_reset_link(email)
    except Exception:
        pass

    return jsonify({"id": doctor_ref.id, "uid": auth_user.uid, "status": "invited", "resetLink": reset_link}), 201


@admin_bp.put("/doctors/<doctor_id>")
@require_auth
@require_role("admin")
def update_doctor(doctor_id):
    payload = request.get_json()
    allowed_fields = {"fullName", "specialty", "email"}
    updates = {k: v for k, v in payload.items() if k in allowed_fields}

    db = get_db()
    doctor_ref = db.collection("doctors").document(doctor_id)
    if not doctor_ref.get().exists:
        return jsonify({"message": "Doctor not found"}), 404
    doctor_ref.update(updates)

    user_docs = list(db.collection("users").where("doctorId", "==", doctor_id).limit(1).stream())
    if user_docs:
        user_docs[0].reference.update({k: v for k, v in updates.items() if k in {"fullName", "email"}})

    return jsonify({"id": doctor_id, **updates})


@admin_bp.post("/doctors/<doctor_id>/reset-password")
@require_auth
@require_role("admin")
def reset_doctor_password(doctor_id):
    db = get_db()
    doctor = db.collection("doctors").document(doctor_id).get().to_dict()
    if not doctor:
        return jsonify({"message": "Doctor not found"}), 404

    link = get_auth().generate_password_reset_link(doctor["email"])
    return jsonify({"message": "Password reset link generated", "resetLink": link})


@admin_bp.post("/doctors/<doctor_id>/deactivate")
@require_auth
@require_role("admin")
def deactivate_doctor(doctor_id):
    db = get_db()
    doctor_ref = db.collection("doctors").document(doctor_id)
    if not doctor_ref.get().exists:
        return jsonify({"message": "Doctor not found"}), 404
    doctor_ref.update({"active": False})

    user_docs = list(db.collection("users").where("doctorId", "==", doctor_id).limit(1).stream())
    if user_docs:
        get_auth().update_user(user_docs[0].id, disabled=True)

    return jsonify({"id": doctor_id, "active": False})


# Overview / queue / analytics


@admin_bp.get("/overview")
@require_auth
@require_role("admin")
def overview():
    db = get_db()
    queue_waiting = list(db.collection("queue").where("status", "in", ["waiting", "called"]).stream())
    today = datetime.utcnow().strftime("%Y-%m-%d")
    appts_today = list(db.collection("appointments").where("date", "==", today).stream())
    flagged = list(db.collection("reviews").where("status", "==", "flagged").stream())

    doctors = list(db.collection("doctors").where("active", "==", True).stream())
    snapshot = []
    for d in doctors:
        data = d.to_dict()
        doctor_queue = [q for q in queue_waiting if q.to_dict().get("doctorId") == d.id]
        today_str = clinic_local_now().strftime("%Y-%m-%d")
        avg_interval = data.get("avgSchedulingInterval", 5)
        # A hypothetical new patient joining right now would be behind
        # everyone currently in this doctor's queue today -- 999999 is a
        # sentinel position no real queue entry could ever reach, so this
        # captures all of them regardless of their actual position number.
        cum_duration = _cumulative_duration_ahead(db, d.id, today_str, 999999, avg_interval)
        snapshot.append(
            {
                "doctorId": d.id,
                "doctorName": data.get("fullName"),
                "initials": "".join(w[0] for w in data.get("fullName", "??").split()[:2]),
                "waiting": len(doctor_queue),
                "estimatedWaitMinutes": get_waiting_time_model().predict(
                    {
                        "patients_ahead": len(doctor_queue),
                        "hour_of_day": clinic_local_now().hour,
                        "day_of_week": clinic_local_now().weekday(),
                        "scheduling_interval": avg_interval,
                        "age": 40,
                        "sex": 0,
                        "cumulative_duration_ahead": cum_duration,
                    }
                ),
            }
        )

    trust_history = list(
        db.collection("clinic_stats").document("trust_trend").collection("daily")
        .order_by("date", direction="DESCENDING").limit(30).stream()
    )
    trend = sorted(
        [{"date": t.to_dict()["date"], "score": t.to_dict()["avgScore"]} for t in trust_history],
        key=lambda r: r["date"],
    )

    return jsonify(
        {
            "patientsInQueue": len(queue_waiting),
            "avgWaitMinutes": round(sum(s["estimatedWaitMinutes"] for s in snapshot) / max(len(snapshot), 1), 1),
            "appointmentsToday": len(appts_today),
            "flaggedReviews": len(flagged),
            "trustTrend": trend,
            "liveQueueSnapshot": snapshot,
        }
    )


@admin_bp.get("/queue")
@require_auth
@require_role("admin")
def all_queues():
    db = get_db()
    entries = db.collection("queue").where("status", "in", ["waiting", "called", "in_consultation"]).stream()
    result = []
    for e in entries:
        data = e.to_dict()
        result.append(
            {
                "id": e.id,
                "patientName": data.get("patientName"),
                "doctorName": data.get("doctorName"),
                "checkInTime": data.get("checkInTime"),
                "status": data.get("status"),
            }
        )
    return jsonify(result)


@admin_bp.post("/queue/<queue_entry_id>/notify")
@require_auth
@require_role("admin")
def notify_patient(queue_entry_id):
    from notifications import notify_patient_approaching

    db = get_db()
    entry_ref = db.collection("queue").document(queue_entry_id)
    entry = entry_ref.get()
    if not entry.exists:
        return jsonify({"message": "Queue entry not found"}), 404

    entry_data = entry.to_dict()
    doctor = db.collection("doctors").document(entry_data.get("doctorId", "")).get().to_dict() or {}
    patient_profile = db.collection("users").document(entry_data.get("patientUid", "")).get()

    result = {"sent": False, "simulated": False}
    if patient_profile.exists and patient_profile.to_dict().get("phone"):
        avg_interval = doctor.get("avgSchedulingInterval", 5)
        cum_duration = _cumulative_duration_ahead(
            db, entry_data.get("doctorId", ""), entry_data.get("checkInDate", ""),
            entry_data.get("position", 1), avg_interval,
        )
        estimated_wait = get_waiting_time_model().predict(
            {
                "patients_ahead": entry_data.get("position", 1) - 1,
                "hour_of_day": clinic_local_now().hour,
                "day_of_week": clinic_local_now().weekday(),
                "scheduling_interval": avg_interval,
                "age": 40,
                "sex": 0,
                "cumulative_duration_ahead": cum_duration,
            }
        )
        result = notify_patient_approaching(
            patient_profile.to_dict()["phone"], doctor.get("fullName", "your doctor"), int(estimated_wait)
        )

    return jsonify({"id": queue_entry_id, "notified": result["sent"], "simulated": result.get("simulated", False)})


@admin_bp.get("/analytics")
@require_auth
@require_role("admin")
def analytics():
    db = get_db()
    appointments = list(db.collection("appointments").stream())
    by_day = {}
    for a in appointments:
        d = a.to_dict().get("date")
        by_day[d] = by_day.get(d, 0) + 1
    appointments_per_day = [{"day": k, "count": v} for k, v in sorted(by_day.items())[-7:]]

    reviews = list(db.collection("reviews").stream())
    verified = sum(1 for r in reviews if r.to_dict().get("status") == "approved")
    flagged = sum(1 for r in reviews if r.to_dict().get("status") == "flagged")
    rejected = sum(1 for r in reviews if r.to_dict().get("status") == "rejected")

    return jsonify(
        {
            "appointmentsPerDay": appointments_per_day,
            "reviewBreakdown": [
                {"name": "Verified", "value": verified},
                {"name": "Flagged", "value": flagged},
                {"name": "Rejected", "value": rejected},
            ],
        }
    )


# ---------------------------------------------------------------------------
# Review moderation
# ---------------------------------------------------------------------------

@admin_bp.get("/reviews/flagged")
@require_auth
@require_role("admin")
def flagged_reviews():
    db = get_db()
    docs = db.collection("reviews").where("status", "==", "flagged").stream()
    result = []
    for r in docs:
        data = r.to_dict()
        doctor = db.collection("doctors").document(data["doctorId"]).get().to_dict() or {}
        result.append(
            {
                "id": r.id,
                "doctorName": doctor.get("fullName"),
                "text": data.get("text"),
                "reasonTag": data.get("reasonTag"),
                "reasonDetail": data.get("reasonDetail"),
            }
        )
    return jsonify(result)


@admin_bp.post("/reviews/<review_id>/resolve")
@require_auth
@require_role("admin")
def resolve_review(review_id):
    decision = request.get_json().get("decision")
    if decision not in ("reject", "keep"):
        return jsonify({"message": "decision must be 'reject' or 'keep'"}), 400

    db = get_db()
    ref = db.collection("reviews").document(review_id)
    snap = ref.get()
    if not snap.exists:
        return jsonify({"message": "Review not found"}), 404

    new_status = "rejected" if decision == "reject" else "approved"
    ref.update({"status": new_status})

    if new_status == "approved":
        from routes.reviews import recompute_doctor_credibility
        recompute_doctor_credibility(db, snap.to_dict()["doctorId"])

    return jsonify({"id": review_id, "status": new_status})


@admin_bp.get("/doctors/<doctor_id>/reviews")
@require_auth
@require_role("admin")
def list_doctor_reviews_admin(doctor_id):
    """
    Every review for this doctor regardless of status (approved, flagged,
    rejected) — unlike the public /doctors/<id>/reviews endpoint, which only
    ever returns approved ones. This is what lets an admin find and remove a
    review that was never automatically flagged in the first place (e.g. one
    the fake-review model scored as authentic, or a rating/text mismatch —
    neither of those is a "fake review" signal, so neither trips a flag on
    its own).
    """
    db = get_db()
    docs = (
        db.collection("reviews").where("doctorId", "==", doctor_id)
        .order_by("createdAt", direction="DESCENDING").stream()
    )
    return jsonify([{**d.to_dict(), "id": d.id} for d in docs])


@admin_bp.delete("/reviews/<review_id>")
@require_auth
@require_role("admin")
def delete_review(review_id):
    db = get_db()
    ref = db.collection("reviews").document(review_id)
    snap = ref.get()
    if not snap.exists:
        return jsonify({"message": "Review not found"}), 404

    data = snap.to_dict()
    doctor_id = data.get("doctorId")
    was_approved = data.get("status") == "approved"

    ref.delete()

    if was_approved and doctor_id:
        from routes.reviews import recompute_doctor_credibility
        recompute_doctor_credibility(db, doctor_id)

    return jsonify({"id": review_id, "deleted": True})



# AI model monitoring


def _model_last_retrained(path):
    if os.path.exists(path):
        dt = datetime.fromtimestamp(os.path.getmtime(path))
        return f"{dt.day} {dt.strftime('%b')}"
    return "Not yet trained"


@admin_bp.get("/ai-models/status")
@require_auth
@require_role("admin")
def ai_models_status():
    db = get_db()
    wt_model = get_waiting_time_model()
    cred_model = get_credibility_model()

    doctors = list(db.collection("doctors").where("active", "==", True).stream())
    reviews = list(db.collection("reviews").stream())
    flagged_this_week_cutoff = (datetime.utcnow() - timedelta(days=7)).isoformat()
    flagged_this_week = sum(
        1 for r in reviews
        if r.to_dict().get("status") == "flagged" and r.to_dict().get("createdAt", "") >= flagged_this_week_cutoff
    )
    needs_review = sum(1 for r in reviews if r.to_dict().get("status") == "flagged")

    return jsonify(
        {
            "waitingTime": {
                "status": "active" if wt_model.is_trained() else "not trained",
                "maeMinutes": wt_model.mae,
                "r2": wt_model.r2,
                "predictionsThisMonth": len(list(db.collection("queue").stream())),
                "lastRetrained": _model_last_retrained(WAIT_MODEL_PATH),
            },
            "credibility": {
                "status": "active" if cred_model.is_trained() else "heuristic mode",
                "doctorsScored": len(doctors),
                "lastRetrained": _model_last_retrained(CRED_MODEL_PATH),
            },
            "fakeReview": {
                "reviewsScanned": len(reviews),
                "flaggedThisWeek": flagged_this_week,
                "needsReviewCount": needs_review,
                "lastRetrained": _model_last_retrained(FAKE_MODEL_PATH),
            },
        }
    )
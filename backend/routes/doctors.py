from flask import Blueprint, request, jsonify
from datetime import datetime
from firebase_admin_setup import get_db
from ai_models.waiting_time_model import clinic_local_now

doctors_bp = Blueprint("doctors", __name__)


WORK_HOURS_24 = [9, 10, 11, 12, 13, 14, 15, 16]


def _format_slot(hour_24, minute):
    period = "AM" if hour_24 < 12 else "PM"
    hour_12 = hour_24 if hour_24 <= 12 else hour_24 - 12
    return f"{hour_12}:{minute:02d} {period}"


WORK_HOURS = [_format_slot(h, m) for h in WORK_HOURS_24 for m in (0, 30)]


@doctors_bp.get("/doctors")
def list_doctors():
    search = request.args.get("search", "").lower().strip()
    db = get_db()
    docs = db.collection("doctors").where("active", "==", True).stream()
    results = []
    for d in docs:
        data = d.to_dict()
        data["id"] = d.id
        if search and search not in data.get("fullName", "").lower() and search not in data.get("specialty", "").lower():
            continue
        results.append(data)
    return jsonify(results)


@doctors_bp.get("/doctors/<doctor_id>")
def get_doctor(doctor_id):
    db = get_db()
    snap = db.collection("doctors").document(doctor_id).get()
    if not snap.exists:
        return jsonify({"message": "Doctor not found"}), 404
    data = snap.to_dict()
    data["id"] = doctor_id
    return jsonify(data)


@doctors_bp.get("/doctors/<doctor_id>/slots")
def get_slots(doctor_id):
    date_str = request.args.get("date")
    if not date_str:
        return jsonify({"message": "date query param is required (YYYY-MM-DD)"}), 400

    db = get_db()
    booked = set(
        a.to_dict()["time"]
        for a in db.collection("appointments")
        .where("doctorId", "==", doctor_id)
        .where("date", "==", date_str)
        .where("status", "==", "booked")
        .stream()
    )

    now = clinic_local_now()
    is_today = date_str == now.strftime("%Y-%m-%d")

    def is_available(t):
        if t in booked:
            return False
        if is_today:
            slot_time = datetime.strptime(t, "%I:%M %p").time()
            if slot_time <= now.time():
                return False
        return True

    return jsonify([{"time": t, "available": is_available(t)} for t in WORK_HOURS])


@doctors_bp.get("/doctors/<doctor_id>/reviews")
def get_doctor_reviews(doctor_id):
    db = get_db()
    reviews = (
        db.collection("reviews")
        .where("doctorId", "==", doctor_id)
        .where("status", "==", "approved")
        .order_by("createdAt", direction="DESCENDING")
        .limit(20)
        .stream()
    )
    return jsonify([{**r.to_dict(), "id": r.id} for r in reviews])


@doctors_bp.get("/doctors/<doctor_id>/credibility")
def get_doctor_credibility(doctor_id):
    db = get_db()
    snap = db.collection("doctors").document(doctor_id).get()
    if not snap.exists:
        return jsonify({"message": "Doctor not found"}), 404
    data = snap.to_dict()

    history_docs = (
        db.collection("doctors").document(doctor_id).collection("credibility_history")
        .order_by("date", direction="DESCENDING").limit(30).stream()
    )
    trend = sorted(
        [{"date": h.to_dict()["date"], "score": h.to_dict()["score"]} for h in history_docs],
        key=lambda r: r["date"],
    )

    return jsonify(
        {
            "score": data.get("credibilityScore", 0),
            "verifiedReviewCount": data.get("verifiedReviewCount", 0),
            "responseRate": data.get("responseRate", 0),
            "flaggedFilteredCount": data.get("flaggedFilteredCount", 0),
            "trend": trend,
        }
    )
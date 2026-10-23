from flask import Blueprint, request, jsonify, g
from datetime import datetime
from firebase_admin import firestore
from firebase_admin_setup import get_db
from auth_middleware import require_auth, require_role
from ai_models.fake_review_model import get_fake_review_model
from ai_models.credibility_model import get_credibility_model
from ai_models.text_utils import detect_burst, lexicon_sentiment

reviews_bp = Blueprint("reviews", __name__)

FAKE_PROBABILITY_THRESHOLD = 0.85

RATING_STD_REFERENCE = 2.0  # a 1-5 rating scale rarely has a std much above this


def recompute_doctor_credibility(db, doctor_id):

    # Use only approved reviews when recalculating the doctor's credibility.
    approved = list(
        db.collection("reviews").where("doctorId", "==", doctor_id).where("status", "==", "approved").stream()
    )
    if not approved:
        return  # nothing to recompute from yet — leave the existing/default score alone

    ratings = [r.to_dict()["rating"] for r in approved]
    sentiments = [lexicon_sentiment(r.to_dict().get("text", "")) for r in approved]

    avg_sentiment = sum(sentiments) / len(sentiments)
    review_count = len(approved)
    # Calculate population standard deviation for the approved star ratings.
    # This differs from the sample standard deviation used during training.
    rating_std = (sum((r - sum(ratings) / len(ratings)) ** 2 for r in ratings) / len(ratings)) ** 0.5
    rating_consistency = max(0.0, 1 - (rating_std / RATING_STD_REFERENCE))

    score = get_credibility_model().score(
        {"avg_sentiment": avg_sentiment, "review_count": review_count, "rating_consistency": rating_consistency}
    )
    db.collection("doctors").document(doctor_id).update({"credibilityScore": score})


@reviews_bp.post("/reviews")
@require_auth
@require_role("patient")
def submit_review():
    payload = request.get_json()
    doctor_id = payload.get("doctorId")
    rating = payload.get("rating")
    text = (payload.get("text") or "").strip()
    language = payload.get("language", "en")

    if not doctor_id or not rating or not text:
        return jsonify({"message": "doctorId, rating, and text are required"}), 400

    db = get_db()

    # Require a completed appointment linking this patient to this doctor.
    completed_visit = list(
        db.collection("appointments")
        .where("patientUid", "==", g.uid).where("doctorId", "==", doctor_id)
        .where("status", "==", "completed").limit(1).stream()
    )
    if not completed_visit:
        return (
            jsonify({"message": "Only patients with a confirmed, completed visit can submit a review."}),
            403,
        )
# Allow only one review per patient for each doctor.
    already_reviewed = list(
        db.collection("reviews").where("patientUid", "==", g.uid).where("doctorId", "==", doctor_id).limit(1).stream()
    )
    if already_reviewed:
        return jsonify({"message": "You've already reviewed this doctor."}), 409

    fake_model = get_fake_review_model("sklearn")
    fake_proba = fake_model.predict_proba_fake(text)

    recent_times = [
        datetime.fromisoformat(r.to_dict()["createdAt"])
        for r in db.collection("reviews").where("patientUid", "==", g.uid).stream()
    ]
    recent_times.append(datetime.utcnow())
    is_burst = detect_burst(recent_times)

    # Flag the review if its suspiciousness score reaches 0.85 or a burst is detected.
    flagged = fake_proba >= FAKE_PROBABILITY_THRESHOLD or is_burst
    reason_tag, reason_detail = None, None
    if is_burst:
        reason_tag, reason_detail = "Suspicious pattern", "Multiple reviews submitted in a short window"
    elif flagged:
        reason_tag, reason_detail = "Flagged by AI model", f"Authenticity model confidence: {fake_proba:.0%}"

    doc_ref = db.collection("reviews").document()
    doc_ref.set(
        {
            "doctorId": doctor_id,
            "patientUid": g.uid,
            "patientDisplayName": (g.user.get("fullName") or "Patient").split(" ")[0] + " " + (g.user.get("fullName") or " ").split(" ")[-1][0] + ".",
            "rating": rating,
            "text": text,
            "language": language,
            "fakeProbability": fake_proba,
            "status": "flagged" if flagged else "approved",
            "reasonTag": reason_tag,
            "reasonDetail": reason_detail,
            "createdAt": datetime.utcnow().isoformat(),
        }
    )

    if not flagged:
        db.collection("doctors").document(doctor_id).update(
            {"verifiedReviewCount": firestore.Increment(1)}
        )
        recompute_doctor_credibility(db, doctor_id)

    return jsonify({"id": doc_ref.id, "status": "flagged" if flagged else "approved"}), 201


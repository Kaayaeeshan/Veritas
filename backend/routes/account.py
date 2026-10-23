from flask import Blueprint, request, jsonify, g
from firebase_admin_setup import get_db, get_auth
from auth_middleware import require_auth

account_bp = Blueprint("account", __name__)


@account_bp.get("/account/me")
@require_auth
def get_my_account():
    return jsonify(g.user)


@account_bp.put("/account/me")
@require_auth
def update_my_account():
    payload = request.get_json()
    allowed_fields = {"fullName", "email", "phone"}
    updates = {k: v for k, v in payload.items() if k in allowed_fields}

    if not updates:
        return jsonify({"message": "No valid fields to update"}), 400

    db = get_db()
    try:
        db.collection("users").document(g.uid).update(updates)
    except Exception as e:
        return jsonify({"message": f"Couldn't save your profile: {e}"}), 500

    try:
        if "fullName" in updates:
            get_auth().update_user(g.uid, display_name=updates["fullName"])
        if "email" in updates:
            get_auth().update_user(g.uid, email=updates["email"])
    except Exception as e:
        import logging
        logging.getLogger("veritas.account").warning(
            "Firestore profile saved OK, but Firebase Auth sync failed for %s: %s", g.uid, e
        )

    return jsonify({**g.user, **updates})


@account_bp.post("/account/change-password")
@require_auth
def change_password():
    payload = request.get_json()
    new_password = payload.get("newPassword")
    if not new_password or len(new_password) < 8:
        return jsonify({"message": "New password must be at least 8 characters"}), 400

    get_auth().update_user(g.uid, password=new_password)
    return jsonify({"message": "Password updated"})

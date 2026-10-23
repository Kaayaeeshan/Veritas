from functools import wraps
from flask import request, jsonify, g
from firebase_admin_setup import get_auth, get_db


def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"message": "Missing bearer token"}), 401

        id_token = header.split(" ", 1)[1]
        try:
            decoded = get_auth().verify_id_token(id_token)
        except Exception:
            return jsonify({"message": "Invalid or expired token"}), 401

        g.uid = decoded["uid"]
        snap = get_db().collection("users").document(g.uid).get()
        if not snap.exists:
            return jsonify({"message": "No profile found for this account"}), 403
        g.user = snap.to_dict()
        g.user["uid"] = g.uid
        return f(*args, **kwargs)

    return wrapper


def require_role(*roles):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if g.user.get("role") not in roles:
                return jsonify({"message": "You don't have permission to do that"}), 403
            return f(*args, **kwargs)

        return wrapper

    return decorator

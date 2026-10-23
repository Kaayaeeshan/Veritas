import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
from config import Config

_app = None


def init_firebase():
    global _app
    if _app is not None:
        return _app
    cred = credentials.Certificate(Config.FIREBASE_SERVICE_ACCOUNT_PATH)
    _app = firebase_admin.initialize_app(cred, {"projectId": Config.FIREBASE_PROJECT_ID})
    return _app


def get_db():
    init_firebase()
    return firestore.client()


def get_auth():
    init_firebase()
    return firebase_auth

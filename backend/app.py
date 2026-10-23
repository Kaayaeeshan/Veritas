from flask import Flask
from flask_cors import CORS
from config import Config

from routes.doctors import doctors_bp
from routes.appointments import appointments_bp
from routes.queue import queue_bp
from routes.reviews import reviews_bp
from routes.account import account_bp
from routes.admin import admin_bp


def create_app():
    app = Flask(__name__)
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)

    app.register_blueprint(doctors_bp, url_prefix="/api")
    app.register_blueprint(appointments_bp, url_prefix="/api")
    app.register_blueprint(queue_bp, url_prefix="/api")
    app.register_blueprint(reviews_bp, url_prefix="/api")
    app.register_blueprint(account_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(port=Config.PORT, debug=Config.DEBUG)

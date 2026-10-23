import os
import logging

logger = logging.getLogger("veritas.notifications")

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER")

_client = None


def _get_client():
    global _client
    if _client is None and TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
        from twilio.rest import Client
        _client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    return _client


def send_sms(to_phone: str, message: str) -> dict:
    if not to_phone:
        logger.warning("send_sms called with no phone number on file — skipped.")
        return {"sent": False, "sid": None, "simulated": False}

    client = _get_client()
    if client is None or not TWILIO_WHATSAPP_NUMBER:
        logger.info("[SIMULATED WHATSAPP] to=%s: %s", to_phone, message)
        return {"sent": True, "sid": None, "simulated": True}

    msg = client.messages.create(
        to=f"whatsapp:{to_phone}",
        from_=f"whatsapp:{TWILIO_WHATSAPP_NUMBER}",
        body=message,
    )
    return {"sent": True, "sid": msg.sid, "simulated": False}


def notify_patient_called(patient_phone: str, doctor_name: str):
    return send_sms(
        patient_phone,
        f"Veritas: It's your turn now with {doctor_name}. Please head to the consultation room.",
    )


def notify_patient_approaching(patient_phone: str, doctor_name: str, minutes: int):
    return send_sms(
        patient_phone,
        f"Veritas: You're approximately {minutes} min away from seeing {doctor_name}. "
        f"Please make your way to the clinic if you haven't already.",
    )
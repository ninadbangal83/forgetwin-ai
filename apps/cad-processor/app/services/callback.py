import requests
from app.config import config

def send_callback(payload: dict):
    headers = {
        "Authorization": f"Bearer {config.INTERNAL_WEBHOOK_SECRET}",
        "Content-Type": "application/json"
    }
    url = f"{config.API_GATEWAY_URL}/v1/internal/callbacks/cad-processing"
    try:
        requests.post(url, json=payload, headers=headers)
    except Exception as e:
        print(f"ERROR: Failed to send webhook callback: {str(e)}")

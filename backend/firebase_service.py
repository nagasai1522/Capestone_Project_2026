import firebase_admin
from firebase_admin import messaging
from datetime import datetime
import json
import os
import time

# Firebase Admin SDK initialization
try:
    firebase_config = {
        "type": "service_account",
        "project_id": "farmai-2f0f9",
        "private_key_id": "d9932aee09dc3c22daaa85de7a52e356b5270f90",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDc86ILSalkxHX5\nTNfm50sJfiW/qJ54dBEZ0CU1IN5VnmzH69GRKfDO6oav8EVXuauZoKaxB9DYnYPa\nau7NyYF6ibDFSyDqIE+VE72VrZ0PkdP7h7JRSiQ2Jqwm//n4j6Zn0McvFt3PDk3G\ncKqSDUh45U+PAtGD3kaYb2UTwQcHSWVioflpDKDCXBHxExH5EsR3eKgib/7TxBsX\naMVGuPQMETZx8m8YaZWZoClcUurf7PUD+hWo1EWgRHn7ccfczJ0ALOLvAVQT/TuU\n3x7jhm7AGT2chWQA4fOWJg0QrSvahkRFWEYBt6QFWPDZDJMYPllHIImpkp2i9Xdu\nzabHnfG9AgMBAAECggEABoognNMzT3B9t67yRhZtR47u1V/v96b+pN06QUQDflSr\nfCK/hW3QpDhOgDhNK/c83B7kRv0VqQ8QbyGpYp1LVujYX2eqIXGPYEsKI3H5dFzN\nb2Qf7P0mNcwXy7xHOpxoHLw2m0p5rr5TELFf1nfxCOVHc4mSrMg01PtQM2gMBX5H\nHOJogRO/QHISRrPj8S9UD8EEtsb4lF6HqUNth6LPyMiY96iHzRQT/r0JKHduShuN\nOz23ocyBY6IDRRy4EraxocrYq6LjSFT2zqIL2iCrkIuH1mhK5F7QGminNF30alGz\nzqlWKefPbqRm5tAVwFconAK0EHlTgbUkWZLfyVj+AQKBgQD2m6CezSfcTag6eSzU\nhqrX40Z0Kax/ip6IhPvyNF8kU5+pRoqP7R93SpnWjFqzO0GaCL4e1KQwF4uyVlHY\n0iiLCIU5hX2BS8cHJ49fzaqHxof+LwFo5/L/6mZ7Zpq/pg3afmQKgHMAzEX6eNKG\nxAE074yIQ+JwApS8IR7Fu9Gl/QKBgQDlXdzu6EHJmLCd3IUreBVBINr/eKxam4Fs\n5CVDVsiZSSeGkxgAhFWNlyzMoyuNJo6O6fOs/CPmAPBHtDWcO+/uTovsR7/FYrTx\nK9nOmSCST4xLk/Xp90LnJDN/NB52H619TLRSTiOxV2nJ8kDC2vZ2/qPe48n5HRF2\nNAfqtTFmwQKBgQCu77M/M1VlaAlAgZkVoforb2QZHz7ostLHEV8Qb6pWQKPwFsRQ\nWOuLWfZLRgFJR22/8Re9EybtnqZQef9RibOM/RxUs6dWQwUKxDtmwKSJ8IGkBIBB\nhNjSRdsxCpYYAZmuNx6MfJYYKNAzX+YoB367qHrOZymIP6x20B/eMOAFmQKBgGdc\n+1l2tV8CPmWFoUXLodht1ANZAGL8vUCzN8+25kOd4gAVfbWN7XgXborx5YiAnbHt\n4HBOWGcoeR/3KEm2ARQltYzPcK6lIuGkX01pWHJXAuR0U1gSo8XCXKqwdCHLeMWE\nsaZ9rDwZJoVpdKHbR0Ks0nB5uuVWoi3gmMi+yvqBAoGAJWeZ/OCvNIc7v22z2PLV\ndHPpHxG6wmUPIpSJzvq1/pd+OAuH7DKjoGkz3VGn/7R4Nar9+8jMoJA7GCOq9o6a\nj5bchEahwO3CSO1C5GdctEfVPSzJ02LbPSXqisrH47zq4fRk1PmbGdyyoEW8W7h4\nILw2UJCSv+lNS4n3uaLbch8=\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-fbsvc@farmai-2f0f9.iam.gserviceaccount.com",
        "client_id": "108173474767076684241",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40farmai-2f0f9.iam.gserviceaccount.com",
        "universe_domain": "googleapis.com"
    }
    cred = firebase_admin.credentials.Certificate(firebase_config)
    firebase_admin.initialize_app(cred)
    print("✅ Firebase initialized")
except Exception as e:
    print(f"❌ Firebase init error: {e}")
    firebase_admin = None

# ── Storage ────────────────────────────────────────────────────────────────────
fcm_tokens = set()
user_notifications = {}

NOTIFICATIONS_FILE = os.path.join(os.path.dirname(__file__), 'notifications_data.json')
TOKENS_FILE        = os.path.join(os.path.dirname(__file__), 'fcm_tokens.json')

last_send_result = {
    "success": False, "success_count": 0,
    "failure_count": 0, "failed_tokens": [], "error": None,
}

# ── Persistence ────────────────────────────────────────────────────────────────
def save_data():
    try:
        with open(NOTIFICATIONS_FILE, 'w') as f:
            json.dump(user_notifications, f, indent=2)
        with open(TOKENS_FILE, 'w') as f:
            json.dump(list(fcm_tokens), f, indent=2)
    except Exception as e:
        print(f"❌ Save error: {e}")

def load_data():
    global user_notifications, fcm_tokens
    try:
        if os.path.exists(NOTIFICATIONS_FILE):
            with open(NOTIFICATIONS_FILE, 'r') as f:
                user_notifications = json.load(f)
        if os.path.exists(TOKENS_FILE):
            with open(TOKENS_FILE, 'r') as f:
                fcm_tokens = set(json.load(f))
                print(f"📂 Loaded {len(fcm_tokens)} FCM tokens")
    except Exception as e:
        print(f"❌ Load error: {e}")

load_data()

# ── Per-user notification store ────────────────────────────────────────────────
def get_user_notifications(token):
    return user_notifications.get(token, [])

def add_user_notification(token, notification):
    if token not in user_notifications:
        user_notifications[token] = []
    user_notifications[token].append(notification)
    save_data()

def clear_user_notifications(token):
    if token in user_notifications:
        user_notifications[token].clear()
        save_data()
        return True
    return False

# ── Token management ───────────────────────────────────────────────────────────
def register_fcm_token(token):
    if token:
        fcm_tokens.add(token)
        save_data()
        print(f"✅ Token registered: {token[:20]}...")
        return True
    return False

def remove_fcm_token(token):
    fcm_tokens.discard(token)
    user_notifications.pop(token, None)
    save_data()

def get_registered_tokens():
    return list(fcm_tokens)

def get_last_send_result():
    return dict(last_send_result)

# ── Core send ──────────────────────────────────────────────────────────────────
def send_fcm_notification(title, body, data=None, tokens=None, priority="high"):
    global last_send_result

    if not tokens:
        tokens = list(fcm_tokens)
    if not tokens:
        print("❌ No FCM tokens registered")
        last_send_result = {"success": False, "success_count": 0,
                            "failure_count": 0, "failed_tokens": [], "error": "No tokens"}
        return False

    # Save to backend store for every token
    record = {
        "id": time.time(),
        "title": title,
        "message": body,
        "type":     (data or {}).get("type", "system"),
        "category": (data or {}).get("category", "info"),
        "severity": (data or {}).get("priority", "medium"),
        "priority": (data or {}).get("priority", "medium"),
        "time": "Just now",
        "read": False,
        "source": "firebase",
    }
    for t in tokens:
        add_user_notification(t, record.copy())

    if not firebase_admin:
        print("❌ Firebase Admin not available")
        last_send_result = {"success": False, "success_count": 0,
                            "failure_count": len(tokens), "failed_tokens": list(tokens),
                            "error": "Firebase Admin SDK not available"}
        return False

    # All data values must be strings for FCM
    clean_data = {k: str(v) for k, v in (data or {}).items()}

    success_count, failure_count, failed_tokens = 0, 0, []
    for token in tokens:
        try:
            msg = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                webpush=messaging.WebpushConfig(
                    headers={"Urgency": "high"},
                    notification=messaging.WebpushNotification(
                        title=title,
                        body=body,
                        icon="/logo192.png",
                    ),
                ),
                data=clean_data,
                token=token,
            )
            response = messaging.send(msg)
            print(f"✅ Sent to {token[:20]}... → {response}")
            success_count += 1
        except Exception as e:
            print(f"❌ Failed {token[:20]}...: {e}")
            failure_count += 1
            failed_tokens.append(token)

    if failed_tokens:
        fcm_tokens.difference_update(failed_tokens)
        for t in failed_tokens:
            user_notifications.pop(t, None)
        save_data()

    last_send_result = {
        "success": success_count > 0,
        "success_count": success_count,
        "failure_count": failure_count,
        "failed_tokens": failed_tokens,
        "error": None if success_count > 0 else "All sends failed",
    }
    return success_count > 0

# ── Typed alert helpers (used by scheduler & API) ─────────────────────────────
def send_weather_alert(weather_data):
    alerts = []
    temp       = weather_data.get('temperature', 0)
    humidity   = weather_data.get('humidity', 0)
    rainfall   = weather_data.get('rainfall', 0)
    wind_speed = weather_data.get('wind_speed', 0)

    if temp > 38:
        alerts.append({'title': '🔥 Extreme Heat Warning',
                       'body': f'Temperature is {temp}°C! Provide shade and increase irrigation.',
                       'data': {'type': 'weather', 'priority': 'high', 'category': 'temperature'}})
    elif temp < 8:
        alerts.append({'title': '❄️ Frost Warning',
                       'body': f'Temperature dropped to {temp}°C. Protect sensitive crops.',
                       'data': {'type': 'weather', 'priority': 'high', 'category': 'frost'}})
    if rainfall > 50:
        alerts.append({'title': '🌧️ Heavy Rainfall Alert',
                       'body': f'Heavy rainfall ({rainfall}mm). Ensure proper drainage.',
                       'data': {'type': 'weather', 'priority': 'high', 'category': 'rainfall'}})
    elif rainfall < 2 and temp > 30:
        alerts.append({'title': '🏜️ Drought Risk Alert',
                       'body': 'Low rainfall with high temperature. Increase irrigation.',
                       'data': {'type': 'weather', 'priority': 'medium', 'category': 'drought'}})
    if humidity > 85:
        alerts.append({'title': '💧 High Humidity Alert',
                       'body': f'High humidity ({humidity}%) increases fungal disease risk.',
                       'data': {'type': 'weather', 'priority': 'medium', 'category': 'humidity'}})
    if wind_speed > 40:
        alerts.append({'title': '💨 Strong Wind Alert',
                       'body': f'Strong winds ({wind_speed}km/h) may damage crops.',
                       'data': {'type': 'weather', 'priority': 'high', 'category': 'wind'}})

    for a in alerts:
        send_fcm_notification(a['title'], a['body'], a['data'])
    return alerts

def send_crop_alert(crop_data):
    alerts = []
    today      = datetime.now()
    crop_name  = crop_data.get('name', 'Unknown Crop')
    crop_type  = crop_data.get('type', 'unknown')

    planting_date = crop_data.get('planting_date')
    days_since = 0
    if planting_date:
        try:
            days_since = (today - datetime.strptime(planting_date, '%Y-%m-%d')).days
        except Exception:
            pass

    if crop_type == "rice" and days_since == 25:
        alerts.append({'title': '🌱 Rice Tillering Stage',
                       'body': f'{crop_name}: apply nitrogen fertilizer (50kg/ha).',
                       'data': {'type': 'crop', 'priority': 'medium', 'cropName': crop_name, 'category': 'growth'}})
    elif crop_type == "wheat" and days_since == 30:
        alerts.append({'title': '🌱 Wheat Tillering Stage',
                       'body': f'{crop_name}: apply first dose of nitrogen fertilizer.',
                       'data': {'type': 'crop', 'priority': 'medium', 'cropName': crop_name, 'category': 'growth'}})

    expected_harvest = crop_data.get('expected_harvest')
    if expected_harvest:
        try:
            days_left = (datetime.strptime(expected_harvest, '%Y-%m-%d') - today).days
            if days_left == 7:
                alerts.append({'title': '🚜 Harvest in 7 Days',
                               'body': f'{crop_name} ready in 7 days. Prepare equipment.',
                               'data': {'type': 'crop', 'priority': 'low', 'cropName': crop_name, 'category': 'harvest'}})
            elif days_left <= 1:
                alerts.append({'title': '🌾 Harvest Today!',
                               'body': f'{crop_name} is ready for harvest today.',
                               'data': {'type': 'crop', 'priority': 'high', 'cropName': crop_name, 'category': 'harvest'}})
        except Exception:
            pass

    if crop_data.get('health_status') == "stressed":
        alerts.append({'title': '⚠️ Crop Health Alert',
                       'body': f'{crop_name} shows stress signs. Check water, nutrients, pests.',
                       'data': {'type': 'crop', 'priority': 'high', 'cropName': crop_name, 'category': 'health'}})

    for a in alerts:
        send_fcm_notification(a['title'], a['body'], a['data'])
    return alerts

def send_disease_alert(disease_data):
    crop_name    = disease_data.get('crop_name', 'Unknown Crop')
    disease_name = disease_data.get('disease_name', 'Unknown Disease')
    confidence   = disease_data.get('confidence', 0)
    alert = {
        'title': '🦠 Disease Alert Detected',
        'body':  f'{disease_name} in {crop_name} ({confidence:.1f}% confidence). Take action.',
        'data':  {'type': 'disease', 'priority': 'high' if confidence > 70 else 'medium',
                  'cropName': crop_name, 'disease': disease_name,
                  'confidence': str(confidence), 'category': 'disease'}
    }
    send_fcm_notification(alert['title'], alert['body'], alert['data'])
    return [alert]

def send_system_alert(title, body, priority="medium"):
    alert = {'title': title, 'body': body,
             'data': {'type': 'system', 'priority': priority, 'category': 'system'}}
    send_fcm_notification(alert['title'], alert['body'], alert['data'])
    return [alert]

def remove_token(token):
    fcm_tokens.discard(token)

# ── Standalone test ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    token = "fH92QPSGMriFmToAPQ6NJ-:APA91bHpbCLV3hNu_4w4J4UQ3UgN_t0ZblLZf4SK5SpjcHqJsJWYvtBcKxSQ_6fWI66Vf2kC7gbwjeyptAXI7K3ccGaAvtUkIlw0L15q4GgBP4nX3OX4sB8"
    register_fcm_token(token)
    send_fcm_notification("🔥 Test Notification", "Push working!", {"type": "test", "priority": "high"})

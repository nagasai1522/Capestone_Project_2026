from flask import Flask, request, jsonify
from transformers import pipeline
import requests
import os
import json
from datetime import datetime
from flask_cors import CORS


# Local ML model for rainfall prediction
try:
    from rainfall_model import RainfallPredictor
except Exception:
    RainfallPredictor = None

# Enhanced rainfall prediction model
try:
    from enhanced_rainfall_model import get_enhanced_predictor
except Exception:
    get_enhanced_predictor = None

# Enhanced crop management system with Kaggle dataset
try:
    from enhanced_crop_management import get_crop_system
    print("✅ Enhanced Crop Management System with Kaggle dataset loaded successfully.")
except Exception as e:
    print(f"❌ Failed to load Enhanced Crop Management System: {e}")
    try:
        from crop_management import get_crop_system
        print("⚠️ Fallback to basic Crop Management System.")
    except Exception:
        get_crop_system = None

# Plant disease detection with Kaggle dataset
try:
    from disease_integration import (
        get_disease_info, 
        analyze_plant_disease, 
        get_supported_crops,
        get_disease_stats,
        disease_manager
    )
    from disease_image_analysis import validate_plant_image
    from disease_ml_model import analyze_image_ml, get_supported_crops_ml, get_disease_stats_ml
    analyze_image = analyze_image_ml
    get_supported_crops = get_supported_crops_ml
    get_disease_stats = get_disease_stats_ml
    # Only download Kaggle dataset if not already cached — avoids minute-long re-download on every reload
    from pathlib import Path as _DPath
    _classes_file = _DPath('data/disease/class_names.json')
    if not _classes_file.exists():
        KAGGLE_USERNAME = "chennamjahnavi"
        KAGGLE_KEY = "8dd1678ccc5ee3e7690543b4e9294b1d"
        disease_manager.setup_kaggle_credentials(KAGGLE_USERNAME, KAGGLE_KEY)
        download_success = disease_manager.download_dataset()
        if download_success:
            print("✅ Plant Disease Detection with REAL Kaggle dataset loaded successfully.")
        else:
            print("⚠️ Plant Disease Detection loaded with fallback simulated data.")
    else:
        print("✅ Plant Disease Detection ready (using cached dataset).")
except Exception as e:
    print(f"❌ Failed to load Plant Disease Detection: {e}")
    get_disease_info = None
    analyze_plant_disease = None
    get_supported_crops = None
    get_disease_stats = None
    analyze_image = None
    validate_plant_image = None

# Notification service
try:
    from notification_service import (
        get_current_weather,
        get_active_crops,
        generate_weather_alerts,
        generate_crop_alerts,
        get_weather_forecast,
        get_irrigation_recommendation
    )
    print("✅ Notification service loaded successfully.")
except Exception as e:
    print(f"❌ Failed to load notification service: {e}")
    get_current_weather = None
    get_active_crops = None
    generate_weather_alerts = None
    generate_crop_alerts = None
    get_weather_forecast = None
    get_irrigation_recommendation = None

# Firebase service
try:
    from firebase_service import (
        register_fcm_token,
        send_fcm_notification,
        send_weather_alert,
        send_crop_alert,
        send_disease_alert,
        send_system_alert,
        get_registered_tokens,
        remove_fcm_token,
        get_user_notifications,
        get_last_send_result
    )
    print("✅ Firebase service loaded successfully.")
except Exception as e:
    print(f"❌ Failed to load Firebase service: {e}")
    register_fcm_token = None
    send_fcm_notification = None
    send_weather_alert = None
    send_crop_alert = None
    send_disease_alert = None
    send_system_alert = None
    get_registered_tokens = None
    remove_fcm_token = None
    get_user_notifications = None
    get_last_send_result = None

# -----------------------------
# Load small agriculture model
# -----------------------------
print("Loading Agriculture QA model...")
try:
    qa_model = pipeline(
        "text2text-generation",
        model="mrSoul7766/AgriQBot",  # Small model for farming advice
        max_length=256,
        truncation=True
    )
    print("✅ AgriQBot model loaded successfully.")
except Exception as e:
    print(f"❌ Failed to load AgriQBot model: {e}")
    qa_model = None

# -----------------------------
# Flask app setup
# -----------------------------
app = Flask(__name__)
CORS(app)

# -----------------------------
# Background auto-notification scheduler
# -----------------------------
import threading
import time as _time

_last_weather_snapshot = {}   # track last pushed weather to avoid duplicates
_scheduler_started    = False

def _should_push_weather(current, last):
    """Return True if any significant weather change warrants a new push."""
    if not last:
        return True
    checks = [
        abs(current.get("temperature", 0) - last.get("temperature", 0)) >= 3,
        abs(current.get("humidity",    0) - last.get("humidity",    0)) >= 10,
        abs(current.get("rainfall",    0) - last.get("rainfall",    0)) >= 5,
        abs(current.get("wind_speed",  0) - last.get("wind_speed",  0)) >= 10,
    ]
    return any(checks)

def _auto_notify():
    """Background thread: pushes weather + crop alerts every 5 minutes."""
    global _last_weather_snapshot
    _time.sleep(15)   # small delay so Flask finishes starting up
    while True:
        try:
            tokens = get_registered_tokens() if get_registered_tokens else []
            if tokens:
                # ── Weather ──────────────────────────────────────────
                if get_current_weather and send_fcm_notification and generate_weather_alerts:
                    try:
                        weather = get_current_weather()
                        if _should_push_weather(weather, _last_weather_snapshot):
                            alerts = generate_weather_alerts(weather)
                            for a in alerts:
                                send_fcm_notification(
                                    a["title"], a["message"],
                                    {"type": a.get("type","weather"),
                                     "category": "weather",
                                     "priority": a.get("priority", a.get("severity","medium"))}
                                )
                                print(f"📢 Auto-pushed weather alert: {a['title']}")
                            if alerts:
                                _last_weather_snapshot = dict(weather)
                    except Exception as e:
                        print(f"Scheduler weather error: {e}")

                # ── Crops ─────────────────────────────────────────────
                if get_active_crops and send_fcm_notification and generate_crop_alerts:
                    try:
                        crops  = get_active_crops()
                        alerts = generate_crop_alerts(crops)
                        for a in alerts:
                            # Always push high-severity + harvest reminders
                            if a.get("severity") in ("high",) or a.get("type") == "success":
                                send_fcm_notification(
                                    a["title"], a["message"],
                                    {"type": a.get("type","crop"),
                                     "category": "crop",
                                     "priority": a.get("priority","high"),
                                     "cropName": a.get("crop_name","")}
                                )
                                print(f"📢 Auto-pushed crop alert: {a['title']}")
                    except Exception as e:
                        print(f"Scheduler crop error: {e}")
            else:
                print("⏳ Scheduler: no registered tokens yet, skipping push")
        except Exception as e:
            print(f"Scheduler error: {e}")

        _time.sleep(300)   # wait 5 minutes

def start_scheduler():
    global _scheduler_started
    if not _scheduler_started:
        t = threading.Thread(target=_auto_notify, daemon=True, name="NotifScheduler")
        t.start()
        _scheduler_started = True
        print("✅ Notification scheduler started (5-min interval)")

# Weather API key (get from https://openweathermap.org/api)
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "7d52870b8eebc2ec07266a58bb076186")

# Agriculture-related keywords
AGRICULTURE_KEYWORDS = [
    "crop", "fertilize", "fertilizer", "irrigation", "pesticide", "weed",
    "harvest", "soil", "plant", "seeds", "farm", "farming", "tractor",
    "vegetable", "fruit", "agriculture", "disease", "pest", "compost",
    "yield", "grain", "wheat", "rice", "tomato", "maize", "millet", "cotton",
    "sorghum", "climate", "monsoon", "nutrient", "manure", "watering",
    "weather", "rain", "temperature", "season"
]

# Weather trigger words
WEATHER_WORDS = ["weather", "rain", "temperature", "season", "climate"]


def get_weather(city):
    """Fetch real-time weather data for a given city."""
    try:
        if not OPENWEATHER_API_KEY:
            return None
        url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
        response = requests.get(url)
        data = response.json()

        if data.get("cod") != 200:
            return None

        temp = data["main"]["temp"]
        desc = data["weather"][0]["description"]
        humidity = data["main"]["humidity"]
        return f"The current temperature in {city} is {temp}°C with {desc}. Humidity is {humidity}%."
    except Exception as e:
        return None


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()

    if not data or "query" not in data:
        return jsonify({"error": "Please provide a query"}), 400

    if qa_model is None:
        return jsonify({"error": "Chat model not available. Please check backend logs."}), 503

    user_query = data["query"]
    city = data.get("city", "Delhi")  # Default city if not provided

    # Check if query is agriculture related
    if not any(keyword in user_query.lower() for keyword in AGRICULTURE_KEYWORDS):
        return jsonify({
            "answer": "Please ask a question related to farming, crops, soil, weather, or agriculture."
        })

    # If query contains weather-related words, get weather info
    weather_info = None
    if any(word in user_query.lower() for word in WEATHER_WORDS):
        weather_info = get_weather(city)

    try:
        # Combine weather info with user query for better answers
        if weather_info:
            final_query = f"{user_query}. Current weather: {weather_info}. Based on this, give farming advice."
        else:
            final_query = user_query

        # Generate model response
        result = qa_model(final_query)
        answer = result[0]['generated_text']

        return jsonify({
            "answer": answer,
            "weather": weather_info if weather_info else "Weather data not used"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/weather/current", methods=["GET"])
def weather_current():
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    city = request.args.get("city", "Delhi")
    try:
        if not OPENWEATHER_API_KEY:
            return jsonify({"error": "OPENWEATHER_API_KEY not set"}), 400
        if lat and lon:
            url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
        else:
            url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
        response = requests.get(url)
        data = response.json()
        if data.get("cod") != 200:
            return jsonify({"error": data.get("message", "weather error")}), 400
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/weather/forecast", methods=["GET"])
def weather_forecast():
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    city = request.args.get("city", "Delhi")
    try:
        if not OPENWEATHER_API_KEY:
            return jsonify({"error": "OPENWEATHER_API_KEY not set"}), 400
        # Use 5 day / 3 hour forecast API
        if lat and lon:
            url = f"http://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
        else:
            url = f"http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
        response = requests.get(url)
        data = response.json()
        if data.get("cod") not in ("200", 200):
            return jsonify({"error": data.get("message", "forecast error")}), 400
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/rainfall/predict", methods=["POST"])
def rainfall_predict():
    data = request.get_json(silent=True) or {}
    subdivision = data.get("subdivision")
    year_str    = data.get("year")

    if not subdivision or not year_str:
        return jsonify({"error": "subdivision and year required"}), 400

    try:
        year = int(year_str)
        
        # Use enhanced model if available, fallback to original
        if get_enhanced_predictor:
            try:
                predictor = get_enhanced_predictor()
                result = predictor.predict(subdivision, year)
                return jsonify(result)
            except Exception as e:
                print(f"Enhanced model failed: {e}, falling back to basic model")
        
        # Fallback to original model
        if RainfallPredictor is None:
            return jsonify({"error": "Cannot import RainfallPredictor — check rainfall_model.py"}), 500
        
        from rainfall_model import RainfallPredictor
        predictor = RainfallPredictor()           
        result = predictor.predict(subdivision, year)
        return jsonify(result)
        
    except ImportError:
        return jsonify({"error": "Cannot import RainfallPredictor — check rainfall_model.py"}), 500
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": f"Error: {str(e)}"}), 500


@app.route("/api/rainfall/enhanced/info", methods=["GET"])
def rainfall_enhanced_info():
    """Get information about enhanced rainfall model"""
    if not get_enhanced_predictor:
        return jsonify({"error": "Enhanced model not available"}), 503
    
    try:
        predictor = get_enhanced_predictor()
        info = predictor.get_model_info()
        subdivisions = predictor.get_subdivisions()
        return jsonify({
            "model_info": info,
            "available_subdivisions": subdivisions,
            "total_subdivisions": len(subdivisions)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/rainfall/enhanced/predict", methods=["POST"])
def rainfall_enhanced_predict():
    """Enhanced rainfall prediction with confidence scores"""
    if not get_enhanced_predictor:
        return jsonify({"error": "Enhanced model not available"}), 503
    
    data = request.get_json(silent=True) or {}
    subdivision = data.get("subdivision")
    year_str = data.get("year")
    
    if not subdivision or not year_str:
        return jsonify({"error": "subdivision and year required"}), 400
    
    try:
        year = int(year_str)
        predictor = get_enhanced_predictor()
        result = predictor.predict(subdivision, year)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------
# Crop Management APIs
# -----------------------------

@app.route("/api/crop/recommendations", methods=["POST"])
def crop_recommendations():
    """Get crop recommendations based on location and conditions using Kaggle dataset"""
    if not get_crop_system:
        return jsonify({"error": "Crop management system not available"}), 503
    
    data = request.get_json(silent=True) or {}
    subdivision = data.get("subdivision")
    year_str = data.get("year")
    
    if not subdivision:
        return jsonify({"error": "subdivision required"}), 400
    
    try:
        year = int(year_str) if year_str else datetime.now().year
        crop_system = get_crop_system()
        result = crop_system.get_crop_recommendations(subdivision, year)
        
        # Format response for frontend compatibility
        return jsonify({
            "success": True,
            "recommendations": result["recommendations"],
            "location": result["location"],
            "year": result["year"],
            "rainfall": result.get("rainfall"),
            "temperature": result.get("temperature"),
            "dataset_info": result.get("dataset_info", {})
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/crop/management-plan", methods=["POST"])
def crop_management_plan():
    """Get detailed management plan for specific crop using Kaggle dataset"""
    if not get_crop_system:
        return jsonify({"error": "Crop management system not available"}), 503
    
    data = request.get_json(silent=True) or {}
    crop_name = data.get("crop")
    subdivision = data.get("subdivision")
    year_str = data.get("year")
    
    if not crop_name or not subdivision:
        return jsonify({"error": "crop and subdivision required"}), 400
    
    try:
        year = int(year_str) if year_str else datetime.now().year
        crop_system = get_crop_system()
        plan = crop_system.get_management_plan(crop_name, subdivision, year)
        
        if not plan:
            return jsonify({"error": f"Crop '{crop_name}' not found"}), 404
        
        return jsonify({
            "success": True,
            "management_plan": plan,
            "crop": crop_name,
            "location": subdivision,
            "year": year
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/crop/info", methods=["GET"])
def crop_info():
    """Get comprehensive crop information from Kaggle dataset"""
    if not get_crop_system:
        return jsonify({"error": "Crop management system not available"}), 503
    
    try:
        crop_system = get_crop_system()
        info = crop_system.get_crop_info()
        
        return jsonify({
            "success": True,
            "available_crops": info["available_crops"],
            "total_crops": info["total_crops"],
            "crop_categories": info["crop_categories"],
            "system_features": info["system_features"],
            "crop_details": info["crop_details"],
            "dataset_metadata": info["dataset_metadata"]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/crop/seasonal-calendar", methods=["POST"])
def crop_seasonal_calendar():
    """Get seasonal planting calendar for location"""
    if not get_crop_system:
        return jsonify({"error": "Crop management system not available"}), 503
    
    data = request.get_json(silent=True) or {}
    subdivision = data.get("subdivision")
    year_str = data.get("year")
    
    if not subdivision or not year_str:
        return jsonify({"error": "subdivision and year required"}), 400
    
    try:
        year = int(year_str)
        crop_system = get_crop_system()
        
        # Get rainfall data for season planning
        rainfall_data = None
        if get_enhanced_predictor:
            try:
                predictor = get_enhanced_predictor()
                rainfall_data = predictor.predict(subdivision, year)
            except:
                pass
        
        # Create seasonal calendar
        calendar = {
            "kharif": {"months": [6, 7, 8, 9], "crops": []},
            "rabi": {"months": [10, 11, 12, 1, 2], "crops": []},
            "summer": {"months": [3, 4, 5], "crops": []}
        }
        
        for crop_name, crop_info in crop_system.crop_data.items():
            seasons = crop_info['growing_season']
            for season in seasons:
                if season == 'kharif':
                    calendar["kharif"]["crops"].append(crop_name)
                elif season == 'rabi':
                    calendar["rabi"]["crops"].append(crop_name)
                elif season == 'perennial':
                    calendar["kharif"]["crops"].append(crop_name)
                    calendar["rabi"]["crops"].append(crop_name)
                elif season == 'year_round':
                    calendar["kharif"]["crops"].append(crop_name)
                    calendar["rabi"]["crops"].append(crop_name)
                    calendar["summer"]["crops"].append(crop_name)
        
        return jsonify({
            "location": subdivision,
            "year": year,
            "seasonal_calendar": calendar,
            "rainfall_outlook": rainfall_data.get("ANNUAL", "Unknown") if rainfall_data else "Unknown"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------
# Plant Disease Detection APIs
# -----------------------------

@app.route("/api/disease/supported-crops", methods=["GET"])
def disease_supported_crops():
    """Get list of crops supported for disease detection"""
    if not get_supported_crops:
        return jsonify({"error": "Disease detection system not available"}), 503
    
    try:
        crops = get_supported_crops()
        return jsonify({
            "success": True,
            "crops": crops,
            "total": len(crops)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/disease/analyze", methods=["POST"])
def disease_analyze():
    """Analyze plant disease from symptoms"""
    if not analyze_plant_disease:
        return jsonify({"error": "Disease detection system not available"}), 503
    
    data = request.get_json(silent=True) or {}
    crop_type = data.get("crop_type")
    symptoms = data.get("symptoms", [])
    
    if not crop_type or not symptoms:
        return jsonify({"error": "crop_type and symptoms required"}), 400
    
    try:
        result = analyze_plant_disease(crop_type, symptoms)
        return jsonify({
            "success": True,
            "analysis": result
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/disease/info/<crop_type>", methods=["GET"])
def disease_info(crop_type):
    """Get disease information for a specific crop"""
    if not get_disease_info:
        return jsonify({"error": "Disease detection system not available"}), 503
    
    try:
        disease_name = request.args.get("disease")
        info = get_disease_info(crop_type, disease_name)
        
        if not info:
            return jsonify({"error": "Crop or disease not found"}), 404
        
        return jsonify({
            "success": True,
            "crop": crop_type,
            "disease_info": info
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/disease/statistics", methods=["GET"])
def disease_statistics():
    """Get disease database statistics"""
    if not get_disease_stats:
        return jsonify({"error": "Disease detection system not available"}), 503
    
    try:
        stats = get_disease_stats()
        return jsonify({
            "success": True,
            "statistics": stats
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/disease/analyze-image", methods=["POST"])
def disease_analyze_image():
    """Fast self-contained plant disease analyzer using PIL + numpy only"""
    import base64, numpy as np
    from PIL import Image
    from io import BytesIO

    data = request.get_json(silent=True) or {}
    image_data = data.get("image", "")
    crop_type = data.get("crop_type") or "Unknown"

    if not image_data:
        return jsonify({"error": "Image data required"}), 400

    try:
        # ── Decode ──────────────────────────────────────────────────────────
        raw = image_data.split(",")[1] if "," in image_data else image_data
        img = Image.open(BytesIO(base64.b64decode(raw))).convert("RGB").resize((224, 224))
        arr = np.array(img, dtype=np.float32)

        # ── Feature extraction ───────────────────────────────────────────────
        mean_r = float(arr[:,:,0].mean())
        mean_g = float(arr[:,:,1].mean())
        mean_b = float(arr[:,:,2].mean())

        # Perceived luminance
        lum = 0.299 * arr[:,:,0] + 0.587 * arr[:,:,1] + 0.114 * arr[:,:,2]

        # Dark/necrotic pixels (low luminance)
        dark_ratio  = float(np.sum(lum < 60) / lum.size)

        # Brown/rust pixels: R significantly dominates G  → blight / rot / rust
        brown_ratio = float(np.sum((arr[:,:,0].astype(np.float32) - arr[:,:,1].astype(np.float32)) > 20) / arr[:,:,0].size)

        # Yellow pixels: R and G both high, B low → mosaic / rust
        yellow_ratio = float(np.sum(
            (arr[:,:,0] > 140) & (arr[:,:,1] > 120) & (arr[:,:,2] < 80)
        ) / arr[:,:,0].size)

        # Combined disease score — brown is the strongest indicator
        disease_score = brown_ratio * 0.60 + dark_ratio * 0.25 + yellow_ratio * 0.15

        green_dom = bool(mean_g >= mean_r and mean_g >= mean_b)

        # ── Validate it is a plant ────────────────────────────────────────────
        if mean_g < 45 and not green_dom:
            return jsonify({"success": True, "analysis": {
                "is_valid_image": False,
                "error": "Not a plant image. Please upload a clear leaf photo."
            }})

        # ── Decide healthy vs diseased ────────────────────────────────────────
        # Healthy: green dominant, high mean_g, very low disease score
        is_healthy = green_dom and mean_g > 85 and disease_score < 0.12

        # ── Disease classification based on visual features ────────────────────
        if is_healthy:
            name     = "Healthy Plant"
            severity = "None"
            conf     = min(98, int(88 + mean_g * 0.05))
            recommendations = [
                "Plant appears healthy — continue current care routine",
                "Monitor leaves weekly for early signs of stress",
                "Maintain optimal soil moisture and nutrient levels",
            ]
            preventive = [
                "Regular field inspections",
                "Proper fertilisation schedule",
                "Integrated pest management",
            ]
        else:
            # Select most likely disease from visual signature
            if brown_ratio > 0.30:
                name, severity, base_conf = "Early Blight / Leaf Spot", "High",     80
            elif brown_ratio > 0.15:
                name, severity, base_conf = "Leaf Blight",               "Moderate", 75
            elif dark_ratio > 0.20:
                name, severity, base_conf = "Late Blight",                "High",     82
            elif yellow_ratio > 0.12:
                name, severity, base_conf = "Common Rust / Mosaic",      "Moderate", 74
            elif dark_ratio > 0.10:
                name, severity, base_conf = "Cercospora Leaf Spot",       "Moderate", 70
            else:
                name, severity, base_conf = "Bacterial Spot",             "Moderate", 68

            conf = min(95, int(base_conf + disease_score * 30))
            recommendations = [
                f"Apply appropriate fungicide/bactericide for {name}",
                "Remove and destroy all infected plant parts immediately",
                "Improve air circulation — avoid dense planting",
                "Monitor neighbouring plants for spread",
            ]
            preventive = [
                "Practice crop rotation each season",
                "Use certified disease-resistant varieties",
                "Maintain proper plant spacing",
                "Avoid overhead watering; water at the base",
            ]

        return jsonify({
            "success": True,
            "analysis": {
                "is_valid_image": True,
                "crop": crop_type,
                "diseases": [{"name": name, "confidence": conf, "severity": severity}],
                "recommendations": recommendations,
                "preventive_measures": preventive,
                "image_features": {
                    "mean_r": round(mean_r, 1),
                    "mean_g": round(mean_g, 1),
                    "mean_b": round(mean_b, 1),
                    "dark_ratio": round(dark_ratio, 3),
                    "green_dominant": green_dom,
                }
            }
        })

    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500


# -----------------------------
# Notifications API
# -----------------------------

@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    """Get all notifications (weather + crop - for users without FCM token)"""
    try:
        # Generate current alerts
        weather = get_current_weather() if get_current_weather else None
        crops = get_active_crops() if get_active_crops else []
        
        notifications = []
        
        if weather:
            weather_alerts = generate_weather_alerts(weather) if generate_weather_alerts else []
            notifications.extend(weather_alerts)
        
        if crops:
            crop_alerts = generate_crop_alerts(crops) if generate_crop_alerts else []
            notifications.extend(crop_alerts)
        
        # Sort by timestamp (newest first)
        notifications.sort(key=lambda x: x.get('id', 0), reverse=True)
        
        return jsonify({
            "success": True,
            "notifications": notifications[:50]  # Return latest 50
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/notifications/user", methods=["POST"])
def get_user_notifications_endpoint():
    """Get user-specific notifications (requires FCM token)"""
    try:
        data = request.get_json()
        token = data.get("token")
        
        if not token:
            return jsonify({"error": "FCM token required"}), 400
        
        # Get user-specific Firebase notifications
        firebase_notifs = get_user_notifications(token) if get_user_notifications else []
        
        # Also get current weather and crop alerts
        weather = get_current_weather() if get_current_weather else None
        crops = get_active_crops() if get_active_crops else []
        
        notifications = []
        
        if weather:
            weather_alerts = generate_weather_alerts(weather) if generate_weather_alerts else []
            notifications.extend(weather_alerts)
        
        if crops:
            crop_alerts = generate_crop_alerts(crops) if generate_crop_alerts else []
            notifications.extend(crop_alerts)
        
        # Add user's Firebase notifications
        notifications.extend(firebase_notifs)
        
        # Sort by timestamp (newest first)
        notifications.sort(key=lambda x: x.get('id', 0), reverse=True)
        
        return jsonify({
            "success": True,
            "notifications": notifications[:50]  # Return latest 50
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/weather/current", methods=["GET"])
def get_weather():
    """Get current weather data"""
    if not get_current_weather:
        return jsonify({"error": "Weather service not available"}), 503
    
    try:
        weather = get_current_weather()
        return jsonify({
            "success": True,
            "weather": weather
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/crops/active", methods=["GET"])
def get_active_crops_endpoint():
    """Get active crops data"""
    if not get_active_crops:
        return jsonify({"error": "Crop service not available"}), 503
    
    try:
        crops = get_active_crops()
        return jsonify({
            "success": True,
            "crops": crops
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/weather/forecast", methods=["GET"])
def get_weather_forecast_endpoint():
    """Get weather forecast"""
    if not get_weather_forecast:
        return jsonify({"error": "Weather forecast not available"}), 503
    
    try:
        forecast = get_weather_forecast()
        return jsonify({
            "success": True,
            "forecast": forecast
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/irrigation/recommendations", methods=["GET"])
def get_irrigation_recommendations_endpoint():
    """Get irrigation recommendations"""
    if not get_irrigation_recommendation:
        return jsonify({"error": "Irrigation service not available"}), 503
    
    try:
        weather = get_current_weather() if get_current_weather else None
        crops = get_active_crops() if get_active_crops else []
        
        recommendations = get_irrigation_recommendation(weather, crops)
        
        return jsonify({
            "success": True,
            "recommendations": recommendations
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/notifications/register", methods=["POST"])
def register_fcm_token_endpoint():
    """Register FCM token for push notifications"""
    data = request.get_json()
    token = data.get("token")
    
    if not token:
        return jsonify({"error": "Token required"}), 400
    
    try:
        if register_fcm_token:
            success = register_fcm_token(token)
            if success:
                return jsonify({
                    "success": True,
                    "message": "Token registered successfully",
                    "active_tokens": len(get_registered_tokens()) if get_registered_tokens else 0
                })
            else:
                return jsonify({"error": "Failed to register token"}), 500
        else:
            # Fallback - just acknowledge
            return jsonify({
                "success": True,
                "message": "Token received (Firebase service not available)"
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/notifications/clear", methods=["POST"])
def clear_notifications():
    """Clear all stored notifications for a user (by FCM token)"""
    try:
        from firebase_service import clear_user_notifications, user_notifications
        data  = request.get_json() or {}
        token = data.get("token")
        if token:
            clear_user_notifications(token)
            return jsonify({"success": True, "message": "Notifications cleared"})
        else:
            # Clear ALL stored notifications (no token = global clear)
            user_notifications.clear()
            return jsonify({"success": True, "message": "All notifications cleared"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/notifications/send-test", methods=["POST"])
def send_test_notification():
    """Send a test notification to all or a specific token"""
    data = request.get_json() or {}
    title = data.get("title", "🧪 Test Notification")
    body  = data.get("body",  "This is a live Firebase push from FarmAI!")
    token = data.get("token")  # optional specific target

    try:
        if not send_fcm_notification:
            return jsonify({"error": "Firebase service not available"}), 503

        targets = [token] if token else None
        success = send_fcm_notification(title, body, {
            "type": data.get("type", "system"),
            "priority": "medium",
            "category": "system"
        }, tokens=targets)

        send_result = get_last_send_result() if get_last_send_result else {}

        if success:
            count = send_result.get("success_count", 1 if token else len(get_registered_tokens()))
            return jsonify({
                "success": True,
                "message": f"Notification sent to {count} device(s)",
                "details": send_result
            })
        return jsonify({
            "success": False,
            "error": send_result.get("error", "Failed to send notification — token may be expired, re-enable notifications"),
            "details": send_result
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route("/api/notifications/weather-alert", methods=["POST"])
def trigger_weather_alert():
    """Trigger weather-based alerts"""
    try:
        if not get_current_weather or not send_weather_alert:
            return jsonify({"error": "Weather or Firebase service not available"}), 503
        
        weather = get_current_weather()
        alerts = send_weather_alert(weather)
        
        return jsonify({
            "success": True,
            "message": f"Sent {len(alerts)} weather alerts",
            "alerts": alerts
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/notifications/crop-alert", methods=["POST"])
def trigger_crop_alert():
    """Trigger crop-based alerts"""
    try:
        if not get_active_crops or not send_crop_alert:
            return jsonify({"error": "Crop or Firebase service not available"}), 503
        
        crops = get_active_crops()
        all_alerts = []
        
        for crop in crops:
            alerts = send_crop_alert(crop)
            all_alerts.extend(alerts)
        
        return jsonify({
            "success": True,
            "message": f"Sent {len(all_alerts)} crop alerts",
            "alerts": all_alerts
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/notifications/push-live", methods=["POST"])
def push_live_notifications():
    """Push current live weather + crop alerts to all registered FCM tokens.
    Called from frontend on page load to trigger real desktop push notifications."""
    try:
        data = request.get_json() or {}
        token = data.get("token")  # optional: target one device only

        sent = []

        # Weather push
        if get_current_weather and send_weather_alert:
            try:
                weather = get_current_weather()
                alerts = send_weather_alert(weather)
                sent.extend(alerts)
            except Exception as e:
                print(f"Weather push error: {e}")

        # Crop push (health-only: stressed crops always get pushed)
        if get_active_crops and send_fcm_notification:
            try:
                from notification_service import generate_crop_alerts
                crops = get_active_crops()
                crop_alerts = generate_crop_alerts(crops)
                for alert in crop_alerts:
                    if alert.get("severity") in ("high",):
                        targets = [token] if token else None
                        send_fcm_notification(
                            alert["title"], alert["message"],
                            {"type": alert.get("type", "crop"),
                             "category": "crop",
                             "priority": alert.get("priority", "high"),
                             "cropName": alert.get("crop_name", "")},
                            tokens=targets
                        )
                        sent.append(alert)
            except Exception as e:
                print(f"Crop push error: {e}")

        return jsonify({"success": True, "pushed": len(sent),
                        "message": f"{len(sent)} live alerts pushed"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/debug/notifications", methods=["GET"])
def debug_notifications():
    """Debug endpoint to check stored notifications"""
    from firebase_service import user_notifications, fcm_tokens
    return jsonify({
        "tokens_registered": list(fcm_tokens),
        "user_notifications_keys": list(user_notifications.keys()),
        "notification_counts": {k: len(v) for k, v in user_notifications.items()},
        "all_notifications": {
            k: [{"title": n.get("title"), "source": n.get("source"), "id": n.get("id")} for n in v]
            for k, v in user_notifications.items()
        }
    })

@app.route("/api/disease/history", methods=["GET"])
def get_disease_history():
    """Get disease analysis history for the user"""
    try:
        # In production, this would be user-specific from database
        # For now, return from file-based storage
        history_file = os.path.join(os.path.dirname(__file__), 'disease_history.json')
        
        if os.path.exists(history_file):
            with open(history_file, 'r') as f:
                history = json.load(f)
        else:
            history = []
        
        return jsonify({
            "success": True,
            "history": history,
            "total_scans": len(history),
            "healthy_count": len([h for h in history if h.get('status') == 'healthy']),
            "diseased_count": len([h for h in history if h.get('status') == 'diseased'])
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/disease/history", methods=["POST"])
def save_disease_analysis():
    """Save a disease analysis result"""
    try:
        data = request.get_json()
        history_file = os.path.join(os.path.dirname(__file__), 'disease_history.json')
        
        # Load existing history
        if os.path.exists(history_file):
            try:
                with open(history_file, 'r') as f:
                    content = f.read().strip()
                    history = json.loads(content) if content else []
            except (json.JSONDecodeError, IOError):
                history = []
        else:
            history = []
        
        # Add new analysis with ID and timestamp
        new_analysis = {
            "id": len(history) + 1,
            "crop": data.get('crop', 'Unknown'),
            "disease": data.get('disease', 'Unknown'),
            "confidence": data.get('confidence', 0),
            "date": datetime.now().strftime("%Y-%m-%d"),
            "status": data.get('status', 'unknown'),
            "location": data.get('location', 'Unknown'),
            "treatment": data.get('treatment', ''),
            "image": data.get('image', '')[:200] + '...' if data.get('image') else '',  # Store thumbnail preview
            "timestamp": datetime.now().isoformat()
        }
        
        history.insert(0, new_analysis)  # Add to beginning
        
        # Save back to file
        with open(history_file, 'w') as f:
            json.dump(history[:100], f, indent=2)  # Keep last 100 scans
        
        return jsonify({
            "success": True,
            "message": "Analysis saved",
            "analysis": new_analysis
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------
# Run Flask
# -----------------------------

# Start the background notification scheduler (runs in daemon thread, safe with Flask reloader)
# use_reloader=True forks the process — only start in the main process
import os as _os
if _os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
    start_scheduler()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=True)

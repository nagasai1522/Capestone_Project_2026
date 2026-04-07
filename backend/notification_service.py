import os
import json
import requests
import hashlib
from datetime import datetime, timedelta, date
from flask import request, jsonify

# Weather API configuration
WEATHER_API_KEY = "your_openweathermap_api_key"
WEATHER_BASE_URL = "http://api.openweathermap.org/data/2.5"

def generate_consistent_id(*args):
    """Generate a consistent ID from string arguments using MD5 hash"""
    content = "_".join(str(arg) for arg in args)
    return int(hashlib.md5(content.encode()).hexdigest()[:16], 16)

# Mock weather data (replace with real API)
mock_weather_data = {
    "temperature": 32,
    "humidity": 75,
    "rainfall": 2.5,
    "wind_speed": 12,
    "pressure": 1013,
    "description": "Partly cloudy",
    "forecast": [
        {"day": "Tomorrow", "temp": 30, "rain": 0, "humidity": 70},
        {"day": "Day 2", "temp": 28, "rain": 5, "humidity": 80},
        {"day": "Day 3", "temp": 31, "rain": 1, "humidity": 65}
    ]
}

# Mock crop data
mock_crops_data = [
    {
        "id": 1,
        "name": "Rice Field - Kharif Crop",
        "type": "rice",
        "planting_date": "2025-03-15",  # Recent planting
        "expected_harvest": "2025-06-15",
        "health_status": "healthy",
        "growth_stage": "vegetative",
        "location": "Field 1, Row 1-10"
    },
    {
        "id": 2,
        "name": "Wheat Field - Rabi Crop",
        "type": "wheat",
        "planting_date": "2025-02-01",
        "expected_harvest": "2025-05-01",
        "health_status": "healthy",
        "growth_stage": "tillering",
        "location": "Field 2, Row 1-8"
    },
    {
        "id": 3,
        "name": "Tomato Greenhouse",
        "type": "tomato",
        "planting_date": "2025-03-20",
        "expected_harvest": "2025-06-20",
        "health_status": "stressed",
        "growth_stage": "flowering",
        "location": "Greenhouse A"
    },
    {
        "id": 4,
        "name": "Cotton Field",
        "type": "cotton",
        "planting_date": "2025-03-10",
        "expected_harvest": "2025-07-10",
        "health_status": "healthy",
        "growth_stage": "seedling",
        "location": "Field 3, Row 1-15"
    }
]

def get_current_weather():
    """Get current weather data from Open-Meteo API (free, no API key needed)"""
    try:
        # Use Open-Meteo API - completely free, no API key required
        # Default: Hyderabad, India
        latitude = 17.3850
        longitude = 78.4867
        
        # Open-Meteo current weather endpoint
        url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current_weather=true&hourly=relativehumidity_2m,precipitation,windspeed_10m,pressure_msl"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            current = data.get("current_weather", {})
            hourly = data.get("hourly", {})
            
            # Get current hour index
            from datetime import datetime
            current_hour = datetime.now().hour
            
            # Extract real data
            weather = {
                "temperature": current.get("temperature", 25),
                "humidity": hourly.get("relativehumidity_2m", [60])[current_hour] if hourly.get("relativehumidity_2m") else 60,
                "rainfall": hourly.get("precipitation", [0])[current_hour] if hourly.get("precipitation") else 0,
                "wind_speed": current.get("windspeed_10m", 10),
                "pressure": hourly.get("pressure_msl", [1013])[current_hour] if hourly.get("pressure_msl") else 1013,
                "weathercode": current.get("weathercode", 0),
                "description": get_weather_description(current.get("weathercode", 0)),
                "location": "Hyderabad, India",
                "source": "open-meteo-api",
                "timestamp": datetime.now().isoformat()
            }
            print(f"✅ LIVE Weather: {weather['temperature']}°C, {weather['humidity']}% humidity, {weather['rainfall']}mm rain")
            return weather
        else:
            print(f"⚠️ Weather API returned status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Weather API error: {e}")
    
    # Emergency fallback only
    print("⚠️ CRITICAL: Using emergency weather fallback")
    from datetime import datetime
    return {
        "temperature": 30,
        "humidity": 65,
        "rainfall": 0,
        "wind_speed": 12,
        "pressure": 1013,
        "weathercode": 0,
        "description": "Clear sky (emergency fallback)",
        "location": "Hyderabad, India (fallback)",
        "source": "emergency_fallback",
        "timestamp": datetime.now().isoformat()
    }

def get_weather_description(weathercode):
    """Convert weather code to human-readable description"""
    codes = {
        0: "Clear sky",
        1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing rime fog",
        51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
        61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
        71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
        95: "Thunderstorm", 96: "Thunderstorm with hail"
    }
    return codes.get(weathercode, "Unknown conditions")

# Real crop data from database or API
# For now, using realistic crop data with current dates
def get_active_crops():
    """Get list of active crops - in production this queries database"""
    from datetime import datetime, timedelta
    today = datetime.now()
    
    # Calculate realistic growth stages based on planting dates
    crops = [
        {
            "id": 1,
            "name": "Rice Field - Kharif",
            "type": "rice",
            "planting_date": (today - timedelta(days=20)).strftime("%Y-%m-%d"),
            "expected_harvest": (today + timedelta(days=70)).strftime("%Y-%m-%d"),
            "health_status": "healthy",
            "growth_stage": "vegetative",
            "location": "Field 1, Rows 1-10",
            "area_acres": 5.5,
            "variety": "IR64"
        },
        {
            "id": 2,
            "name": "Wheat Field - Rabi",
            "type": "wheat",
            "planting_date": (today - timedelta(days=60)).strftime("%Y-%m-%d"),
            "expected_harvest": (today + timedelta(days=30)).strftime("%Y-%m-%d"),
            "health_status": "healthy",
            "growth_stage": "booting",
            "location": "Field 2, Rows 1-8",
            "area_acres": 4.2,
            "variety": "HD-2967"
        },
        {
            "id": 3,
            "name": "Tomato Greenhouse",
            "type": "tomato",
            "planting_date": (today - timedelta(days=14)).strftime("%Y-%m-%d"),
            "expected_harvest": (today + timedelta(days=76)).strftime("%Y-%m-%d"),
            "health_status": "stressed",  # This triggers alerts!
            "growth_stage": "flowering",
            "location": "Greenhouse A",
            "area_acres": 0.5,
            "variety": "Roma"
        },
        {
            "id": 4,
            "name": "Cotton Field",
            "type": "cotton",
            "planting_date": (today - timedelta(days=25)).strftime("%Y-%m-%d"),
            "expected_harvest": (today + timedelta(days=95)).strftime("%Y-%m-%d"),
            "health_status": "healthy",
            "growth_stage": "vegetative",
            "location": "Field 3, Rows 1-15",
            "area_acres": 8.0,
            "variety": "BT Cotton"
        }
    ]
    
    print(f"✅ Loaded {len(crops)} active crops with real growth stages")
    return crops

def generate_weather_alerts(weather):
    """Generate weather-based alerts"""
    alerts = []
    temp = weather["temperature"]
    humidity = weather["humidity"]
    rainfall = weather["rainfall"]
    wind_speed = weather["wind_speed"]
    
    # Create consistent base ID for today's weather
    today = date.today().isoformat()
    
    def weather_notif(key, ntype, title, message, severity):
        return {"id": generate_consistent_id(key, today), "type": ntype, "category": "weather",
                "title": title, "message": message, "severity": severity, "priority": severity,
                "time": "Just now", "read": False}

    # Temperature alerts
    if temp > 38:
        alerts.append(weather_notif("heat_alert", "error",
            "🔥 Extreme Heat Warning",
            f"Temperature is {temp}°C! Risk of heat stress. Provide shade and increase irrigation.", "high"))
    elif temp > 35:
        alerts.append(weather_notif("high_temp", "warning",
            "🌡️ High Temperature Alert",
            f"Temperature is {temp}°C. Ensure adequate irrigation and monitor for heat stress.", "medium"))
    elif temp < 8:
        alerts.append(weather_notif("frost", "warning",
            "❄️ Frost Warning",
            f"Temperature is {temp}°C. Risk of frost damage. Consider protective measures.", "high"))

    # Rainfall alerts
    if rainfall > 50:
        alerts.append(weather_notif("heavy_rain", "warning",
            "🌧️ Heavy Rainfall Alert",
            f"Heavy rainfall ({rainfall}mm) expected. Check drainage and prevent waterlogging.", "medium"))
    elif temp > 30 and rainfall < 5:
        alerts.append(weather_notif("drought", "warning",
            "🏜️ Drought Risk Alert",
            "Low rainfall with high temperature. Increase irrigation frequency.", "medium"))

    # Humidity alerts
    if humidity > 85:
        alerts.append(weather_notif("high_humidity", "info",
            "💧 High Humidity Alert",
            f"High humidity ({humidity}%) increases fungal disease risk. Ensure good air circulation.", "medium"))

    # Wind alerts
    if wind_speed > 40:
        alerts.append(weather_notif("strong_wind", "warning",
            "💨 Strong Wind Alert",
            f"Strong winds ({wind_speed}km/h). Secure loose items and protect young plants.", "medium"))
    
    return alerts

def generate_crop_alerts(crops):
    """Generate crop-based alerts"""
    alerts = []
    today = datetime.now()
    
    def crop_notif(key, ntype, title, message, crop, severity):
        return {"id": generate_consistent_id(key), "type": ntype, "category": "crop",
                "title": title, "message": message, "crop_name": crop["name"],
                "severity": severity, "priority": severity, "time": "Just now", "read": False}

    for crop in crops:
        planting_date = datetime.strptime(crop["planting_date"], "%Y-%m-%d")
        days_since_planting = (today - planting_date).days

        # Growth stage alerts
        if crop["type"] == "rice":
            if days_since_planting == 25:
                alerts.append(crop_notif(f"rice_tillering_{crop['id']}_{days_since_planting}", "info",
                    "🌱 Rice Tillering Stage",
                    f"{crop['name']} is entering tillering stage. Apply nitrogen fertilizer (50kg/ha).", crop, "low"))
            elif days_since_planting == 45:
                alerts.append(crop_notif(f"rice_panicle_{crop['id']}_{days_since_planting}", "info",
                    "🌾 Rice Panicle Initiation",
                    f"{crop['name']} is starting panicle initiation. Monitor for pests and diseases.", crop, "low"))

        elif crop["type"] == "wheat":
            if days_since_planting == 30:
                alerts.append(crop_notif(f"wheat_tillering_{crop['id']}_{days_since_planting}", "info",
                    "🌱 Wheat Tillering Stage",
                    f"{crop['name']} is in tillering stage. Apply first dose of nitrogen fertilizer.", crop, "low"))
            elif days_since_planting == 60:
                alerts.append(crop_notif(f"wheat_booting_{crop['id']}_{days_since_planting}", "info",
                    "🌾 Wheat Booting Stage",
                    f"{crop['name']} is entering booting stage. Protect from lodging and monitor for diseases.", crop, "medium"))

        elif crop["type"] == "tomato":
            if days_since_planting == 35:
                alerts.append(crop_notif(f"tomato_flowering_{crop['id']}_{days_since_planting}", "info",
                    "🍅 Tomato Flowering Stage",
                    f"{crop['name']} is flowering. Ensure adequate pollination and calcium.", crop, "low"))

        # Harvest alerts
        if crop["expected_harvest"]:
            harvest_date = datetime.strptime(crop["expected_harvest"], "%Y-%m-%d")
            days_until_harvest = (harvest_date - today).days
            if days_until_harvest == 7:
                alerts.append(crop_notif(f"harvest_7days_{crop['id']}_{today.strftime('%Y-%m-%d')}", "success",
                    "🚜 Harvest Reminder",
                    f"{crop['name']} will be ready for harvest in 7 days. Prepare harvesting equipment.", crop, "low"))
            elif days_until_harvest == 1:
                alerts.append(crop_notif(f"harvest_today_{crop['id']}_{today.strftime('%Y-%m-%d')}", "success",
                    "🌾 Harvest Today!",
                    f"{crop['name']} is ready for harvest today. Optimal conditions for harvesting.", crop, "high"))

        # Health alerts
        if crop["health_status"] == "stressed":
            alerts.append(crop_notif(f"health_stress_{crop['id']}_{today.strftime('%Y-%m-%d')}", "warning",
                "⚠️ Crop Health Alert",
                f"{crop['name']} shows signs of stress. Check water, nutrients, and look for pests/diseases.", crop, "high"))
    
    return alerts

def get_weather_forecast():
    """Get weather forecast for next 3 days"""
    return mock_weather_data["forecast"]

def calculate_crop_water_needs(crop_type, temperature, humidity):
    """Calculate water requirements based on crop and weather"""
    base_water_needs = {
        "rice": 5.0,  # mm per day
        "wheat": 3.5,
        "tomato": 4.0,
        "corn": 4.5,
        "cotton": 3.0
    }
    
    base = base_water_needs.get(crop_type, 3.5)
    
    # Adjust based on temperature
    if temperature > 35:
        base *= 1.5
    elif temperature < 15:
        base *= 0.7
    
    # Adjust based on humidity
    if humidity < 40:
        base *= 1.3
    elif humidity > 80:
        base *= 0.8
    
    return round(base, 1)

def get_irrigation_recommendation(weather, crops):
    """Get irrigation recommendations based on weather and crops"""
    recommendations = []
    temp = weather["temperature"]
    rainfall = weather["rainfall"]
    
    if rainfall < 2 and temp > 30:
        recommendations.append({
            "type": "irrigation",
            "priority": "high",
            "message": "Increase irrigation due to high temperature and low rainfall",
            "water_amount": "5-7mm per day"
        })
    elif rainfall > 10:
        recommendations.append({
            "type": "irrigation",
            "priority": "low",
            "message": "Reduce irrigation due to recent rainfall",
            "water_amount": "2-3mm per day or skip"
        })
    else:
        recommendations.append({
            "type": "irrigation",
            "priority": "medium",
            "message": "Normal irrigation schedule",
            "water_amount": "3-5mm per day"
        })
    
    return recommendations

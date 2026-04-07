import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050';
// import 'bootstrap/dist/css/bootstrap.min.css';

// Indian meteorological subdivisions
// REF = https://openweathermap.org/
const subdivisions = [
  "Andaman & Nicobar Islands", "Arunachal Pradesh", "Assam & Meghalaya", "NMMT", "Bihar",
  "Chhattisgarh", "Coastal Andhra Pradesh", "Coastal Karnataka", "East Madhya Pradesh",
  "East Rajasthan", "East Uttar Pradesh", "Gangetic West Bengal", "Gujarat Region",
  "Haryana Delhi & Chandigarh", "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand",
  "Karnataka", "Kerala", "Konkan & Goa", "Lakshadweep", "Madhya Maharashtra",
  "Marathwada", "Nagaland Manipur Mizoram & Tripura", "North Interior Karnataka",
  "Odisha", "Punjab", "Rayalaseema", "Saurashtra & Kutch", "South Interior Karnataka",
  "Sub Himalayan West Bengal & Sikkim", "Tamil Nadu", "Telangana", "Uttarakhand",
  "Vidarbha", "West Madhya Pradesh", "West Rajasthan", "West Uttar Pradesh"
];

// Current weather data simulation (used as fallback / initial state)
const DEFAULT_CURRENT_WEATHER = {
  temperature: 28,
  humidity: 65,
  windSpeed: 12,
  pressure: 1013,
  visibility: 10,
  uvIndex: 6,
  condition: 'partly-cloudy',
  description: 'Partly Cloudy',
  feelsLike: 31,
  dewPoint: 19
};

// Weekly forecast simulation (used as fallback / initial state)
const DEFAULT_WEEKLY_FORECAST = [
  { day: 'Today', date: 'Dec 15', condition: 'sunny', temp: { high: 32, low: 22 }, humidity: 60, rain: 0, windSpeed: 8 },
  { day: 'Tomorrow', date: 'Dec 16', condition: 'cloudy', temp: { high: 29, low: 20 }, humidity: 70, rain: 0, windSpeed: 12 },
  { day: 'Wed', date: 'Dec 17', condition: 'rainy', temp: { high: 26, low: 18 }, humidity: 85, rain: 15, windSpeed: 15 },
  { day: 'Thu', date: 'Dec 18', condition: 'rainy', temp: { high: 24, low: 17 }, humidity: 90, rain: 25, windSpeed: 18 },
  { day: 'Fri', date: 'Dec 19', condition: 'stormy', temp: { high: 23, low: 16 }, humidity: 95, rain: 45, windSpeed: 25 },
  { day: 'Sat', date: 'Dec 20', condition: 'cloudy', temp: { high: 27, low: 19 }, humidity: 75, rain: 5, windSpeed: 10 },
  { day: 'Sun', date: 'Dec 21', condition: 'sunny', temp: { high: 30, low: 21 }, humidity: 65, rain: 0, windSpeed: 8 }
];

// Hourly forecast simulation (used as fallback / initial state)
const DEFAULT_HOURLY_FORECAST = [
  { time: '06:00', temp: 22, condition: 'cloudy', rain: 0, humidity: 75 },
  { time: '09:00', temp: 26, condition: 'sunny', rain: 0, humidity: 68 },
  { time: '12:00', temp: 30, condition: 'sunny', rain: 0, humidity: 55 },
  { time: '15:00', temp: 32, condition: 'partly-cloudy', rain: 0, humidity: 50 },
  { time: '18:00', temp: 28, condition: 'cloudy', rain: 0, humidity: 65 },
  { time: '21:00', temp: 24, condition: 'cloudy', rain: 0, humidity: 70 }
];

// Weather-based farming recommendations
const getWeatherRecommendations = (forecast) => {
  const recommendations = [];
  const nextThreeDays = forecast.slice(0, 3);

  const rainyDays = nextThreeDays.filter(day => day.rain > 10);
  if (rainyDays.length >= 2) {
    recommendations.push({
      type: 'warning',
      category: 'Irrigation',
      title: 'Heavy Rain Expected',
      description: 'Avoid irrigation for the next 3 days. Ensure proper drainage.',
      action: 'Check drainage systems and postpone watering'
    });
  } else if (nextThreeDays.every(day => day.rain === 0)) {
    recommendations.push({
      type: 'info',
      category: 'Irrigation',
      title: 'Dry Period Ahead',
      description: 'No rain expected. Increase irrigation frequency.',
      action: 'Schedule additional watering sessions'
    });
  }

  const highTemp = Math.max(...nextThreeDays.map(day => day.temp.high));
  const lowTemp = Math.min(...nextThreeDays.map(day => day.temp.low));

  if (highTemp > 35) {
    recommendations.push({
      type: 'warning',
      category: 'Heat Protection',
      title: 'Extreme Heat Warning',
      description: 'Protect crops from heat stress. Consider shade nets.',
      action: 'Apply mulching and increase watering frequency'
    });
  }

  if (lowTemp < 10) {
    recommendations.push({
      type: 'warning',
      category: 'Cold Protection',
      title: 'Cold Wave Alert',
      description: 'Protect sensitive crops from cold damage.',
      action: 'Cover crops and avoid early morning watering'
    });
  }

  const highWind = nextThreeDays.some(day => day.windSpeed > 20);
  if (highWind) {
    recommendations.push({
      type: 'warning',
      category: 'Wind Protection',
      title: 'High Wind Alert',
      description: 'Strong winds may damage crops. Secure support structures.',
      action: 'Check and reinforce crop supports'
    });
  }

  const optimalDays = nextThreeDays.filter(day =>
    day.temp.high >= 25 && day.temp.high <= 30 &&
    day.rain === 0 &&
    day.windSpeed < 15
  );

  if (optimalDays.length > 0) {
    recommendations.push({
      type: 'success',
      category: 'Optimal Farming',
      title: 'Perfect Farming Weather',
      description: `${optimalDays.length} day(s) with ideal conditions for field work.`,
      action: 'Schedule fertilizer application and field maintenance'
    });
  }

  return recommendations;
};

// Dynamic recommendations based on rainfall prediction
const getRainfallBasedRecommendations = (rainfallResult) => {
  if (!rainfallResult) return [];
  
  const recommendations = [];
  const annual = rainfallResult.ANNUAL || 0;
  const monsoon = (rainfallResult.JUN || 0) + (rainfallResult.JUL || 0) + (rainfallResult.AUG || 0) + (rainfallResult.SEP || 0);
  const winter = (rainfallResult.DEC || 0) + (rainfallResult.JAN || 0) + (rainfallResult.FEB || 0);
  
  // Annual rainfall recommendations
  if (annual < 500) {
    recommendations.push({
      type: 'warning',
      category: 'Water Management',
      title: 'Drought Conditions Expected',
      description: 'Low rainfall predicted. Implement drought-resistant crops and water conservation.',
      action: 'Choose millets, sorghum, or drought-resistant rice varieties'
    });
  } else if (annual > 1500) {
    recommendations.push({
      type: 'warning',
      category: 'Flood Risk',
      title: 'Heavy Rainfall Expected',
      description: 'High rainfall may cause waterlogging. Ensure proper drainage.',
      action: 'Consider raised beds and flood-resistant crop varieties'
    });
  } else {
    recommendations.push({
      type: 'success',
      category: 'Optimal Conditions',
      title: 'Favorable Rainfall Expected',
      description: 'Moderate rainfall suitable for most crops.',
      action: 'Good conditions for rice, wheat, and vegetable cultivation'
    });
  }
  
  // Monsoon-specific recommendations
  if (monsoon > 800) {
    recommendations.push({
      type: 'info',
      category: 'Monsoon Planning',
      title: 'Strong Monsoon Expected',
      description: 'Heavy monsoon rains anticipated. Prepare for intensive planting.',
      action: 'Start Kharif crop preparation in May-June'
    });
  }
  
  // Winter rainfall analysis
  if (winter < 50) {
    recommendations.push({
      type: 'warning',
      category: 'Rabi Season',
      title: 'Dry Winter Expected',
      description: 'Low winter rainfall may affect Rabi crops.',
      action: 'Focus on irrigation-dependent wheat and barley'
    });
  }
  
  return recommendations;
};

// Crop suitability based on rainfall prediction
const getRainfallBasedCropSuitability = (rainfallResult) => {
  if (!rainfallResult) return [];
  
  const annual = rainfallResult.ANNUAL || 0;
  const monsoon = (rainfallResult.JUN || 0) + (rainfallResult.JUL || 0) + (rainfallResult.AUG || 0) + (rainfallResult.SEP || 0);
  
  const crops = [
    {
      name: 'Rice',
      suitability: annual >= 800 && annual <= 1500 ? 90 : annual >= 500 ? 70 : 40,
      reason: annual >= 800 && annual <= 1500 ? 'Optimal rainfall for paddy cultivation' : 
                annual >= 500 ? 'Moderate rainfall, needs irrigation' : 'Insufficient rainfall',
      recommendation: annual >= 800 ? 'Excellent time for Kharif rice' : 'Consider drought-resistant varieties'
    },
    {
      name: 'Wheat',
      suitability: annual >= 400 && annual <= 800 ? 85 : annual >= 600 ? 75 : 50,
      reason: annual >= 400 && annual <= 800 ? 'Perfect for Rabi season' :
                annual >= 600 ? 'Good conditions with some irrigation' : 'May need supplemental irrigation',
      recommendation: annual >= 400 ? 'Plant in Rabi season' : 'Ensure irrigation availability'
    },
    {
      name: 'Cotton',
      suitability: annual >= 600 && annual <= 1200 ? 80 : annual >= 400 ? 60 : 30,
      reason: annual >= 600 && annual <= 1200 ? 'Warm, moderately wet conditions ideal' :
                annual >= 400 ? 'Acceptable with irrigation' : 'Too dry for optimal yield',
      recommendation: annual >= 600 ? 'Good for Kharif season' : 'Requires heavy irrigation'
    },
    {
      name: 'Pulses (Lentil/Chickpea)',
      suitability: annual >= 300 && annual <= 700 ? 85 : annual >= 200 ? 65 : 40,
      reason: annual >= 300 && annual <= 700 ? 'Moderate rainfall perfect for pulses' :
                annual >= 200 ? 'Manageable with irrigation' : 'Too dry for good yields',
      recommendation: annual >= 300 ? 'Excellent for Rabi pulses' : 'Consider drought-resistant varieties'
    },
    {
      name: 'Millets',
      suitability: annual <= 500 ? 90 : annual <= 800 ? 70 : 40,
      reason: annual <= 500 ? 'Drought-resistant, perfect for low rainfall' :
                annual <= 800 ? 'Can tolerate moderate conditions' : 'Too much water for millets',
      recommendation: annual <= 500 ? 'Ideal for rainfed farming' : 'Consider water-loving crops instead'
    },
    {
      name: 'Sugarcane',
      suitability: annual >= 1000 ? 85 : annual >= 700 ? 65 : 35,
      reason: annual >= 1000 ? 'High water requirements met' :
                annual >= 700 ? 'Moderate, needs irrigation' : 'Insufficient for good yields',
      recommendation: annual >= 1000 ? 'Excellent conditions' : 'Requires heavy irrigation investment'
    },
    {
      name: 'Maize',
      suitability: annual >= 500 && annual <= 1000 ? 80 : annual >= 300 ? 60 : 35,
      reason: annual >= 500 && annual <= 1000 ? 'Good rainfall for corn cultivation' :
                annual >= 300 ? 'Moderate, needs irrigation' : 'Too dry for optimal growth',
      recommendation: annual >= 500 ? 'Good for Kharif season' : 'Ensure irrigation during flowering'
    },
    {
      name: 'Vegetables (Tomato/Brinjal)',
      suitability: annual >= 600 && monsoon >= 400 ? 85 : annual >= 400 ? 65 : 40,
      reason: annual >= 600 && monsoon >= 400 ? 'Monsoon rains support vegetable growth' :
                annual >= 400 ? 'Good with irrigation' : 'Requires water management',
      recommendation: annual >= 600 ? 'Monsoon vegetable cultivation ideal' : 'Focus on irrigation'
    }
  ];
  
  return crops.sort((a, b) => b.suitability - a.suitability).slice(0, 6);
};

// Weather alerts based on rainfall prediction
const getRainfallBasedAlerts = (rainfallResult) => {
  if (!rainfallResult) return [];
  
  const alerts = [];
  const annual = rainfallResult.ANNUAL || 0;
  const monsoon = (rainfallResult.JUN || 0) + (rainfallResult.JUL || 0) + (rainfallResult.AUG || 0) + (rainfallResult.SEP || 0);
  
  // Drought alerts
  if (annual < 400) {
    alerts.push({
      type: 'danger',
      title: 'Severe Drought Warning',
      description: 'Extremely low rainfall expected. Implement emergency water conservation.',
      icon: '🚨',
      priority: 'high',
      actions: ['Drill borewells', 'Install drip irrigation', 'Plant drought-resistant crops']
    });
  } else if (annual < 600) {
    alerts.push({
      type: 'warning',
      title: 'Moderate Drought Risk',
      description: 'Below-average rainfall expected. Plan water conservation.',
      icon: '⚠️',
      priority: 'medium',
      actions: ['Check irrigation systems', 'Store water', 'Monitor soil moisture']
    });
  }
  
  // Flood alerts
  if (annual > 1400) {
    alerts.push({
      type: 'danger',
      title: 'High Flood Risk',
      description: 'Heavy rainfall may cause flooding. Prepare drainage systems.',
      icon: '🌊',
      priority: 'high',
      actions: ['Clear drainage channels', 'Elevate storage', 'Prepare evacuation plan']
    });
  } else if (annual > 1200) {
    alerts.push({
      type: 'warning',
      title: 'Moderate Flood Risk',
      description: 'Heavy rainfall possible. Monitor water levels.',
      icon: '💧',
      priority: 'medium',
      actions: ['Check field drainage', 'Secure equipment', 'Monitor weather updates']
    });
  }
  
  // Monsoon intensity alerts
  if (monsoon > 1000) {
    alerts.push({
      type: 'warning',
      title: 'Intense Monsoon Expected',
      description: 'Very heavy monsoon rains anticipated. Take precautions.',
      icon: '🌧️',
      priority: 'medium',
      actions: ['Delay field operations', 'Secure farm structures', 'Prepare for waterlogging']
    });
  }
  
  // Optimal conditions
  if (annual >= 700 && annual <= 1100 && alerts.length === 0) {
    alerts.push({
      type: 'success',
      title: 'Optimal Farming Conditions',
      description: 'Favorable rainfall expected for most crops.',
      icon: '✅',
      priority: 'low',
      actions: ['Plan regular planting', 'Maintain irrigation', 'Monitor crop health']
    });
  }
  
  return alerts;
};

// Crop suitability based on weather
const getCropSuitability = (forecast) => {
  const crops = [
    {
      name: 'Rice',
      suitability: forecast.some(day => day.rain > 20) ? 85 : 45,
      reason: forecast.some(day => day.rain > 20) ? 'Excellent for monsoon season' : 'Needs more water',
      recommendation: forecast.some(day => day.rain > 20) ? 'Plant now' : 'Wait for rain'
    },
    {
      name: 'Wheat',
      suitability: forecast.every(day => day.temp.high < 30) ? 90 : 60,
      reason: forecast.every(day => day.temp.high < 30) ? 'Perfect temperature range' : 'Temperature slightly high',
      recommendation: forecast.every(day => day.temp.high < 30) ? 'Ideal for planting' : 'Monitor temperature'
    },
    {
      name: 'Cotton',
      suitability: forecast.some(day => day.temp.high > 30) ? 80 : 55,
      reason: forecast.some(day => day.temp.high > 30) ? 'Good warm weather' : 'Needs warmer conditions',
      recommendation: forecast.some(day => day.temp.high > 30) ? 'Good time to plant' : 'Wait for warmer weather'
    },
    {
      name: 'Sugarcane',
      suitability: forecast.some(day => day.rain > 10) && forecast.some(day => day.temp.high > 28) ? 88 : 65,
      reason: 'Requires high moisture and warm temperature',
      recommendation: 'Monitor water levels closely'
    },
    {
      name: 'Tomato',
      suitability: forecast.every(day => day.temp.high >= 20 && day.temp.high <= 30) ? 85 : 50,
      reason: forecast.every(day => day.temp.high >= 20 && day.temp.high <= 30) ? 'Ideal temperature range' : 'Temperature fluctuation',
      recommendation: 'Use greenhouse if temperature varies'
    }
  ];

  return crops.sort((a, b) => b.suitability - a.suitability);
};

// Weather icon replacement with emojis
const getWeatherIcon = (condition) => {
  switch (condition) {
    case 'sunny': return '☀️';
    case 'cloudy': return '☁️';
    case 'partly-cloudy': return '⛅';
    case 'rainy': return '🌧️';
    case 'stormy': return '⛈️';
    default: return '☀️';
  }
};

// Map backend / OpenWeather current weather payload to UI shape
const mapCurrentWeather = (data) => {
  try {
    const temp = data?.main?.temp;
    const humidity = data?.main?.humidity;
    const windSpeedMs = data?.wind?.speed ?? 0;
    const pressure = data?.main?.pressure;
    const visibilityMeters = data?.visibility ?? 0;
    const feelsLike = data?.main?.feels_like ?? temp;
    const desc = data?.weather?.[0]?.description ?? 'Current conditions';
    const mainCond = (data?.weather?.[0]?.main || 'sunny').toLowerCase();

    let condition = 'sunny';
    if (mainCond.includes('cloud')) condition = 'cloudy';
    if (mainCond.includes('rain') || mainCond.includes('drizzle')) condition = 'rainy';
    if (mainCond.includes('storm') || mainCond.includes('thunder')) condition = 'stormy';

    return {
      temperature: Math.round(temp ?? DEFAULT_CURRENT_WEATHER.temperature),
      humidity: humidity ?? DEFAULT_CURRENT_WEATHER.humidity,
      windSpeed: Math.round(windSpeedMs * 3.6), // m/s -> km/h
      pressure: pressure ?? DEFAULT_CURRENT_WEATHER.pressure,
      visibility: Math.round((visibilityMeters / 1000) * 10) / 10, // km
      uvIndex: DEFAULT_CURRENT_WEATHER.uvIndex, // OpenWeather basic API doesn't provide UV index
      condition,
      description: desc,
      feelsLike: Math.round(feelsLike),
      dewPoint: DEFAULT_CURRENT_WEATHER.dewPoint,
    };
  } catch (e) {
    return DEFAULT_CURRENT_WEATHER;
  }
};

// Map backend / OpenWeather forecast payload to weekly & hourly UI shapes
const mapForecastWeather = (data) => {
  try {
    const list = data?.list || [];
    if (!Array.isArray(list) || list.length === 0) {
      return {
        weekly: DEFAULT_WEEKLY_FORECAST,
        hourly: DEFAULT_HOURLY_FORECAST,
      };
    }

    const firstEntries = list.slice(0, 8); // ~first day

    const hourly = firstEntries.slice(0, 6).map((item) => {
      const date = new Date(item.dt * 1000);
      const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const cond = (item.weather?.[0]?.main || 'sunny').toLowerCase();
      let condition = 'sunny';
      if (cond.includes('cloud')) condition = 'cloudy';
      if (cond.includes('rain') || cond.includes('drizzle')) condition = 'rainy';
      if (cond.includes('storm') || cond.includes('thunder')) condition = 'stormy';

      return {
        time,
        temp: Math.round(item.main?.temp ?? 0),
        condition,
        rain: item.rain?.['3h'] ? Number(item.rain['3h'].toFixed(1)) : 0,
        humidity: item.main?.humidity ?? 0,
      };
    });

    const byDate = {};
    list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const key = date.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!byDate[key]) {
        byDate[key] = [];
      }
      byDate[key].push(item);
    });

    const dateKeys = Object.keys(byDate).sort().slice(0, 7);
    const weekly = dateKeys.map((key, index) => {
      const items = byDate[key];
      const temps = items.map((i) => i.main?.temp ?? 0);
      const hums = items.map((i) => i.main?.humidity ?? 0);
      const winds = items.map((i) => i.wind?.speed ?? 0);
      const rains = items.map((i) => i.rain?.['3h'] ?? 0);
      const mainConds = items.map((i) => (i.weather?.[0]?.main || '').toLowerCase());

      const high = Math.round(Math.max(...temps));
      const low = Math.round(Math.min(...temps));
      const avgHumidity = Math.round(hums.reduce((a, b) => a + b, 0) / hums.length || 0);
      const totalRain = rains.reduce((a, b) => a + b, 0);
      const avgWind = Math.round(
        (winds.reduce((a, b) => a + b, 0) / winds.length || 0) * 3.6,
      );

      const condCounts = mainConds.reduce((acc, c) => {
        if (!c) return acc;
        acc[c] = (acc[c] || 0) + 1;
        return acc;
      }, {});
      const dominant = Object.entries(condCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'sunny';

      let condition = 'sunny';
      if (dominant.includes('cloud')) condition = 'cloudy';
      if (dominant.includes('rain') || dominant.includes('drizzle')) condition = 'rainy';
      if (dominant.includes('storm') || dominant.includes('thunder')) condition = 'stormy';

      const dateObj = new Date(key);
      let dayLabel;
      if (index === 0) dayLabel = 'Today';
      else if (index === 1) dayLabel = 'Tomorrow';
      else dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return {
        day: dayLabel,
        date: dateLabel,
        condition,
        temp: { high, low },
        humidity: avgHumidity,
        rain: Number(totalRain.toFixed(1)),
        windSpeed: avgWind,
      };
    });

    return { weekly, hourly };
  } catch (e) {
    return {
      weekly: DEFAULT_WEEKLY_FORECAST,
      hourly: DEFAULT_HOURLY_FORECAST,
    };
  }
};

export default function Weather() {
  const [currentWeather, setCurrentWeather] = useState(DEFAULT_CURRENT_WEATHER);
  const [weeklyForecast, setWeeklyForecast] = useState(DEFAULT_WEEKLY_FORECAST);
  const [hourlyForecast, setHourlyForecast] = useState(DEFAULT_HOURLY_FORECAST);
  const [recommendations, setRecommendations] = useState([]);
  const [cropSuitability, setCropSuitability] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('Delhi');
  const [coords, setCoords] = useState(null); // { lat, lon } when using current location
  const [activeTab, setActiveTab] = useState('current');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rainfallPredictionForm, setRainfallPredictionForm] = useState({
    subdivision: '',
    year: new Date().getFullYear().toString() // Use current year as default
  });
  const [rainfallPredictionResult, setRainfallPredictionResult] = useState(null);
  const [isPredictingRainfall, setIsPredictingRainfall] = useState(false);

  const popularCities = [
    'Delhi',
    'Mumbai',
    'Bengaluru',
    'Chennai',
    'Kolkata',
    'Hyderabad',
    'Pune',
  ];

  const handleCityChange = (event) => {
    const city = event.target.value;
    setCoords(null); // switch back to city-based lookup
    setSelectedLocation(city);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lon: longitude });
        setSelectedLocation('Current Location');
      },
      () => {
        setError('Unable to fetch your current location.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setError(null);
        const params = coords
          ? { lat: coords.lat, lon: coords.lon }
          : { city: selectedLocation };
        const [currentRes, forecastRes] = await Promise.all([
          axios.get(`${API_URL}/api/weather/current`, { params }),
          axios.get(`${API_URL}/api/weather/forecast`, { params }),
        ]);
        const mappedCurrent = mapCurrentWeather(currentRes.data);
        const mappedForecast = mapForecastWeather(forecastRes.data);
        setCurrentWeather(mappedCurrent);
        setWeeklyForecast(mappedForecast.weekly);
        setHourlyForecast(mappedForecast.hourly);
      } catch (e) {
        setError('Unable to load live weather data. Showing demo data.');
        setCurrentWeather(DEFAULT_CURRENT_WEATHER);
        setWeeklyForecast(DEFAULT_WEEKLY_FORECAST);
        setHourlyForecast(DEFAULT_HOURLY_FORECAST);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [selectedLocation, coords]);

  useEffect(() => {
    // Use rainfall-based recommendations when available, otherwise weather-based
    if (rainfallPredictionResult) {
      setRecommendations(getRainfallBasedRecommendations(rainfallPredictionResult));
      setCropSuitability(getRainfallBasedCropSuitability(rainfallPredictionResult));
      setAlerts(getRainfallBasedAlerts(rainfallPredictionResult));
    } else {
      setRecommendations(getWeatherRecommendations(weeklyForecast));
      setCropSuitability(getCropSuitability(weeklyForecast));
      setAlerts([]);
    }
  }, [weeklyForecast, rainfallPredictionResult]);

  const currentConditions = (() => {
    const temp = currentWeather.temperature;
    const humidity = currentWeather.humidity;
    const wind = currentWeather.windSpeed;
    const today = weeklyForecast[0] || null;
    const todayRain = today ? today.rain : 0;

    let plantingStatus = 'Good';
    let plantingDescription = 'Favourable conditions for most crops';
    if (temp >= 20 && temp <= 32 && humidity >= 40 && humidity <= 75 && todayRain === 0) {
      plantingStatus = 'Excellent';
      plantingDescription = 'Ideal soil moisture and temperature for most crops';
    } else if (todayRain > 20 || temp < 15 || temp > 38) {
      plantingStatus = 'Caution';
      plantingDescription = 'Not ideal for new planting. Monitor weather closely.';
    }

    let irrigationStatus = 'Moderate';
    let irrigationDescription = 'Consider light watering in the evening';
    if (todayRain >= 10) {
      irrigationStatus = 'Low';
      irrigationDescription = 'Recent/expected rain. Reduce or skip irrigation.';
    } else if (todayRain === 0 && (humidity < 40 || temp > 32)) {
      irrigationStatus = 'High';
      irrigationDescription = 'Dry and/or hot conditions. Increase irrigation.';
    }

    let fieldWorkStatus = 'Good';
    let fieldWorkDescription = 'Suitable for most field operations';
    if (todayRain > 10) {
      fieldWorkStatus = 'Limited';
      fieldWorkDescription = 'Wet fields. Avoid heavy machinery operations.';
    } else if (wind > 25) {
      fieldWorkStatus = 'Caution';
      fieldWorkDescription = 'Strong winds. Secure structures and avoid spraying.';
    }

    return [
      { title: 'Planting Conditions', status: plantingStatus, description: plantingDescription, icon: '🌿' },
      { title: 'Irrigation Need', status: irrigationStatus, description: irrigationDescription, icon: '💧' },
      { title: 'Field Work', status: fieldWorkStatus, description: fieldWorkDescription, icon: '⚡' },
    ];
  })();

  const handleRainfallPrediction = async () => {
    if (!rainfallPredictionForm.subdivision || !rainfallPredictionForm.year) return;
    
    setIsPredictingRainfall(true);
    
    try {
      // Try enhanced API first
      const { data } = await axios.post(`${API_URL}/api/rainfall/enhanced/predict`, {
        subdivision: rainfallPredictionForm.subdivision,
        year: parseInt(rainfallPredictionForm.year),
      });
      
      if (data && !data.error) {
        // Store prediction context with results
        setRainfallPredictionResult({
          ...data,
          _subdivision: rainfallPredictionForm.subdivision,
          _year: rainfallPredictionForm.year,
          _enhanced: true
        });
      } else {
        console.error('Enhanced rainfall prediction error:', data?.error);
        // Fallback to basic API
        const fallbackResponse = await axios.post(`${API_URL}/api/rainfall/predict`, {
          subdivision: rainfallPredictionForm.subdivision,
          year: parseInt(rainfallPredictionForm.year),
        });
        
        if (fallbackResponse.data && !fallbackResponse.data.error) {
          setRainfallPredictionResult({
            ...fallbackResponse.data,
            _subdivision: rainfallPredictionForm.subdivision,
            _year: rainfallPredictionForm.year,
            _enhanced: false
          });
        } else {
          setRainfallPredictionResult(null);
        }
      }
    } catch (e) {
      console.error('Rainfall prediction request failed', e);
      // Clear only rainfall results on error
      setRainfallPredictionResult(null);
    } finally {
      setIsPredictingRainfall(false);
    }
  };

  return (
    <div className="min-vh-100" style={{ }}>
      <style>
        {`
          .fade-in {
            animation: fadeIn 0.6s ease-in;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .card-hover:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            transform: translateY(-2px);
            transition: all 0.3s ease;
          }
        `}
      </style>
      <div className="container py-4">
        {/* Header */}
        <div className="mb-4 fade-in">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className='mx-2' >
              <h1 className="display-6 fw-bold">
                <span style={{ background: 'linear-gradient(to right, #2563eb, #16a34a)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                  Agricultural Weather Intelligence
                </span>
              </h1>
              <p className="lead text-muted mb-0">
                📍 {selectedLocation} • ML-Powered Weather Analytics for Smart Farming
              </p>
            </div>
            <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
              <select
                className="form-select"
                value={coords ? 'Current Location' : selectedLocation}
                onChange={handleCityChange}
                style={{ minWidth: '180px' }}
              >
                {popularCities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-outline-success"
                onClick={handleUseCurrentLocation}
                disabled={loading}
                style={{ width: '350px' }}
              >
                Use Current Location
              </button>
            </div>
          </div>
          {error && (
            <div className="alert alert-warning mt-3 py-2 mb-0">
              {error}
            </div>
          )}
        </div>

        {/* Tabs */}
        {/* <ul className="nav nav-tabs mb-4">
          {['current', 'forecast', 'rainfall-prediction', 'recommendations', 'crops', 'alerts'].map(tab => (
            <li className="nav-item" key={tab}>
              <button
                className={`nav-link ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            </li>
          ))}
        </ul> */}
        <div className="d-flex justify-content-center m-2 mb-4">
          <div className="d-flex bg-light rounded-3 shadow-sm w-100" style={{}}>
            {['current', 'forecast', 'rainfall-prediction', 'recommendations', 'crops', 'alerts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-fill btn border-0 fw-semibold py-2 ${
                  activeTab === tab
                    ? "bg-white text-success shadow-sm rounded-3"
                    : "text-muted"
                }`}
              >
               {tab.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Current Weather Tab */}
        {activeTab === 'current' && (
          <div className="fade-in">
            <div className="row g-4 mx-0">
              {/* Main Weather Card */}
              <div className="col-lg-8">
                <div className="card card-hover" style={{  color: 'black',height:"330px" }}>
                  <div className="ms-2" >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h2 className="card-title display-4">{currentWeather.temperature}°C</h2>
                        <p className="card-text fs-5">{currentWeather.description}</p>
                        <p className="text-black fw-bold">Feels like {currentWeather.feelsLike}°C</p>
                      </div>
                      <div className="fs-1">{getWeatherIcon(currentWeather.condition)}</div>
                    </div>
                    <div className="row">
                      {[
                        { label: 'Humidity', value: `${currentWeather.humidity}%`, icon: '💧' },
                        { label: 'Wind Speed', value: `${currentWeather.windSpeed} km/h`, icon: '🌬️' },
                        { label: 'Visibility', value: `${currentWeather.visibility} km`, icon: '👁️' },
                        { label: 'Pressure', value: `${currentWeather.pressure} hPa`, icon: '📏' },
                        { label: 'UV Index', value: currentWeather.uvIndex, icon: '☀️' },
                        { label: 'Dew Point', value: `${currentWeather.dewPoint}°C`, icon: '🌡️' }
                      ].map((item, index) => (
                        <div className="col-md-4 mb-3" key={index}>
                          <p className="text-black fw-bold mb-1">{item.icon} {item.label}</p>
                          <p className="fw-bold">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hourly Forecast */}
              <div className="col-lg-4">
                <div className="card card-hover">
                  <div className="card-body">
                    <h3 className="card-title">⏰ Today's Hourly</h3>
                    <div className="mt-3">
                      {hourlyForecast.map((hour, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                          <span>{hour.time}</span>
                          <div className="d-flex align-items-center gap-2">
                            <span>{getWeatherIcon(hour.condition)}</span>
                            <span>{hour.temp}°</span>
                            <span className="text-muted">{hour.humidity}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Conditions for Farming */}
            <div className="card card-hover mt-4 mx-2">
              <div className="card-body p-0">
                <h3 className="card-title">🌱 Current Farming Conditions</h3>
                <p className="card-text text-muted">Real-time assessment for agricultural activities</p>
                <div className="row mt-4">
                  {currentConditions.map((item, index) => (
                    <div className="col-md-4 text-center mb-4" key={index}>
                      <div className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '64px', height: '64px' }}>
                        <span className="fs-3">{item.icon}</span>
                      </div>
                      <h4 className="fw-bold">{item.title}</h4>
                      <span className={`badge ${item.status === 'Excellent' ? 'bg-success' : item.status === 'Moderate' ? 'bg-warning' : 'bg-info'}`}>
                        {item.status}
                      </span>
                      <p className="text-muted mt-2">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7-Day Forecast Tab */}
        {activeTab === 'forecast' && (
          <div className="card card-hover fade-in">
            <div className="card-body">
              <h3 className="card-title">📅 7-Day Agricultural Forecast</h3>
              <p className="card-text text-muted">Detailed weather predictions for farming planning</p>
              <div className="mt-4">
                {weeklyForecast.map((day, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center p-2 border rounded-3 mb-2 card-hover">
                    <div className="d-flex align-items-center gap-3">
                      <div className="text-center" style={{ minWidth: '80px' }}>
                        <p className="fw-medium">{day.day}</p>
                        <p className="text-muted small">{day.date}</p>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <span>{getWeatherIcon(day.condition)}</span>
                        <div>
                          <p className="fw-medium text-capitalize">{day.condition.replace('-', ' ')}</p>
                          <p className="text-muted small">H: {day.temp.high}° L: {day.temp.low}°</p>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex gap-4 text-center">
                      <div>
                        <p className="text-muted small">Rain</p>
                        <p className="fw-medium">🌧️ {day.rain}mm</p>
                      </div>
                      <div>
                        <p className="text-muted small">Humidity</p>
                        <p className="fw-medium">💧 {day.humidity}%</p>
                      </div>
                      <div>
                        <p className="text-muted small">Wind</p>
                        <p className="fw-medium">🌬️ {day.windSpeed} km/h</p>
                      </div>
                    </div>
                    <div>
                      {day.rain > 20 ? (
                        <span className="badge bg-primary">Heavy Rain</span>
                      ) : day.temp.high > 35 ? (
                        <span className="badge bg-danger">Hot</span>
                      ) : day.rain === 0 && day.temp.high < 30 ? (
                        <span className="badge bg-success">Ideal</span>
                      ) : (
                        <span className="badge bg-secondary">Normal</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rainfall Prediction Tab */}
        {activeTab === 'rainfall-prediction' && (
          <div className="row g-4 fade-in">
            <div className="col-lg-6">
              <div className="card card-hover">
                <div className="card-body">
                  <h3 className="card-title">📊 Rainfall Prediction Dataset</h3>
                  <p className="card-text text-muted">Input subdivision and year for detailed rainfall predictions</p>
                  <div className="mb-3">
                    <label htmlFor="subdivision" className="form-label">Subdivision</label>
                    <select
                      className="form-select"
                      value={rainfallPredictionForm.subdivision}
                      onChange={(e) => setRainfallPredictionForm(prev => ({ ...prev, subdivision: e.target.value }))}
                    >
                      <option value="">Select meteorological subdivision</option>
                      {subdivisions.map((subdivision) => (
                        <option key={subdivision} value={subdivision}>{subdivision}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Year</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1901"
                      max="2050"
                      value={rainfallPredictionForm.year}
                      onChange={(e) => setRainfallPredictionForm(prev => ({ ...prev, year: e.target.value }))}
                    />
                    <div className="form-text">Historical data: 1901-2017 | Future predictions use trend extrapolation</div>
                  </div>
                  <button
                    className="btn btn-primary w-100"
                    onClick={handleRainfallPrediction}
                    disabled={!rainfallPredictionForm.subdivision || !rainfallPredictionForm.year || isPredictingRainfall}
                  >
                    {isPredictingRainfall ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Predicting...
                      </>
                    ) : (
                      '🧠 Predict Rainfall'
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card card-hover">
                <div className="card-body">
                  <h3 className="card-title">📈 Rainfall Prediction Results</h3>
                  {isPredictingRainfall ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading prediction...</span>
                      </div>
                      <p className="mt-3 text-muted">Analyzing rainfall patterns...</p>
                    </div>
                  ) : rainfallPredictionResult ? (
                    <div>
                      <div className="alert alert-primary">
                        <div className="fw-bold">🌧️ Annual Rainfall Prediction: {rainfallPredictionResult.ANNUAL.toFixed(1)}mm</div>
                        <p className="small">For {rainfallPredictionResult._subdivision} in {rainfallPredictionResult._year}</p>
                        {rainfallPredictionResult._enhanced && rainfallPredictionResult._metadata && (
                          <div className="mt-2">
                            <span className="badge bg-info me-2">
                              🤖 Enhanced ML Model
                            </span>
                            <span className="badge bg-success">
                              Confidence: {(rainfallPredictionResult._metadata.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                        {!rainfallPredictionResult._enhanced && (
                          <div className="mt-2">
                            <span className="badge bg-secondary">
                              📊 Basic Linear Model
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mb-4">
                        <h4 className="fw-bold">Monthly Breakdown (mm)</h4>
                        <div className="row g-2">
                          {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map((month) => (
                            <div key={month} className="col-4">
                              <div className="p-2 bg-light rounded">
                                <span className="fw-medium">{month}</span>: {rainfallPredictionResult[month].toFixed(1)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="fw-bold">Seasonal Breakdown (mm)</h4>
                        <div className="row g-2">
                          <div className="col-6">
                            <div className="p-2 bg-light rounded">
                              <span className="fw-medium">Winter (Jan-Feb)</span>: {rainfallPredictionResult["Jan-Feb"].toFixed(1)}
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="p-2 bg-light rounded">
                              <span className="fw-medium">Pre-Monsoon (Mar-May)</span>: {rainfallPredictionResult["Mar-May"].toFixed(1)}
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="p-2 bg-light rounded">
                              <span className="fw-medium">Monsoon (Jun-Sep)</span>: {rainfallPredictionResult["Jun-Sep"].toFixed(1)}
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="p-2 bg-light rounded">
                              <span className="fw-medium">Post-Monsoon (Oct-Dec)</span>: {rainfallPredictionResult["Oct-Dec"].toFixed(1)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <p>📊 Select subdivision and year to get rainfall predictions</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Farm Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="row g-4 fade-in">
            <div className="col-lg-6">
              <div className="card card-hover">
                <div className="card-body p-0">
                  <h3 className="card-title">🧠 AI Weather Recommendations</h3>
                  <p className="card-text text-muted">Smart farming advice based on weather patterns</p>
                  <div className="mt-4">
                    {recommendations.map((rec, index) => (
                      <div key={index} className={`alert ${rec.type === 'warning' ? 'alert-danger' : rec.type === 'success' ? 'alert-success' : 'alert-info'} mb-3`}>
                        <div className="d-flex align-items-start">
                          <span className="me-2">{rec.type === 'warning' ? '⚠️' : rec.type === 'success' ? '✅' : '💡'}</span>
                          <div>
                            <div className="d-flex justify-content-between">
                              <h4 className="fw-bold">{rec.title}</h4>
                              <span className="badge bg-white text-dark" style={{width:'120px',marginTop:'10px'}} >{rec.category}</span>
                            </div>
                            <p>{rec.description}</p>
                            <p className="small bg-light p-1 rounded">Action: {rec.action}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card card-hover">
                <div className="card-body  p-0">
                  <h3 className="card-title">💧 Smart Irrigation Schedule</h3>
                  <p className="card-text text-muted">Optimized watering plan based on weather forecast</p>
                  <div className="mt-4">
                    {weeklyForecast.slice(0, 5).map((day, index) => {
                      const needsIrrigation = day.rain < 5;
                      const irrigationLevel = day.rain === 0 ? 'High' : day.rain < 10 ? 'Medium' : 'Low';
                      return (
                        <div key={index} className="d-flex justify-content-between align-items-center p-2 border rounded mb-2">
                          <div className="d-flex align-items-center gap-3">
                            <div className="text-center" style={{ minWidth: '60px' }}>
                              <p className="fw-medium small">{day.day}</p>
                              <p className="text-muted small">{day.date}</p>
                            </div>
                            <span>{getWeatherIcon(day.condition)}</span>
                            <div>
                              <p className="small">{day.temp.high}°/{day.temp.low}°</p>
                              <p className="text-muted small">{day.rain}mm rain</p>
                            </div>
                          </div>
                          <div className="text-end">
                            {needsIrrigation ? (
                              <div>
                                <span className={`badge ${irrigationLevel === 'High' ? 'bg-danger' : irrigationLevel === 'Medium' ? 'bg-warning' : 'bg-primary'}`}>
                                  {irrigationLevel} Need
                                </span>
                                <p className="text-muted small mt-1">
                                  {irrigationLevel === 'High' ? '2-3 hours' : 
                                   irrigationLevel === 'Medium' ? '1-2 hours' : '30-60 min'}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <span className="badge bg-secondary">Skip</span>
                                <p className="text-muted small mt-1">Natural rain</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div className="mt-4 p-3 bg-light rounded">
                      <h4 className="fw-bold">💡 Irrigation Tips</h4>
                      <ul className="list-unstyled small">
                        <li>• Water early morning (5-7 AM) or evening (6-8 PM)</li>
                        <li>• Avoid watering during heavy rain forecast</li>
                        <li>• Increase frequency during hot, dry periods</li>
                        <li>• Check soil moisture before watering</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Crop Suitability Tab */}
        {activeTab === 'crops' && (
          <div className="card card-hover fade-in">
            <div className="card-body p-0">
              <h3 className="card-title">🎯 Weather-Based Crop Suitability</h3>
              <p className="card-text text-muted">Best crops to grow based on current and forecasted weather conditions</p>
              <div className="row g-3 mt-2">
                {cropSuitability.map((crop, index) => (
                  <div key={index} className="col-md-4">
                    <div className="border rounded p-3 card-hover">
                      <div className="d-flex justify-content-between mb-2">
                        <h4 className="fw-bold">{crop.name}</h4>
                        <span className={`badge ${crop.suitability >= 80 ? 'bg-success' : crop.suitability >= 60 ? 'bg-warning' : 'bg-danger'} mt-3`}>
                          {crop.suitability}%
                        </span>
                      </div>
                      <div>
                        <p className="text-muted small mb-1">Suitability Score</p>
                        <div className="progress" style={{ height: '8px' }}>
                          <div
                            className="progress-bar"
                            style={{ width: `${crop.suitability}%`, backgroundColor: crop.suitability >= 80 ? '#28a745' : crop.suitability >= 60 ? '#ffc107' : '#dc3545',}}
                          ></div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="fw-medium small mb-0">Weather Analysis:</p>
                        <p className="text-muted small">{crop.reason}</p>
                      </div>
                      <div className="mt-2 pt-1 border-top">
                        <p className="fw-medium small text-success mb-0">Recommendation:</p>
                        <p className="">{crop.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Weather Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="row g-4 fade-in">
            <div className="col-lg-12">
              <div className="card card-hover">
                <div className="card-body p-0">
                  <h3 className="card-title">🚨 Weather & Rainfall Alerts</h3>
                  <div className="mt-4">
                    {alerts.length > 0 ? (
                      alerts.map((alert, index) => (
                        <div key={index} className={`alert alert-${alert.type} mb-3`}>
                          <div className="d-flex align-items-start">
                            <div className="me-3 fs-4">{alert.icon}</div>
                            <div className="flex-grow-1">
                              <div className="fw-bold">{alert.title}</div>
                              <p className="small mb-2">{alert.description}</p>
                              <div className="d-flex flex-wrap gap-2">
                                {alert.actions.map((action, actionIndex) => (
                                  <span key={actionIndex} className="badge bg-secondary">
                                    {action}
                                  </span>
                                ))}
                              </div>
                              {alert.priority && (
                                <p className="small text-muted mb-0 mt-2">
                                  Priority: <span className={`fw-bold text-${alert.type}`}>{alert.priority.toUpperCase()}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="alert alert-info">
                        <div className="fw-bold">📊 No Active Alerts</div>
                        <p className="small">Generate a rainfall prediction to see personalized alerts and recommendations.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
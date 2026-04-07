# FarmAI — Complete Project Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Frontend Technologies](#3-frontend-technologies)
4. [Backend Technologies](#4-backend-technologies)
5. [Machine Learning Models](#5-machine-learning-models)
6. [Datasets](#6-datasets)
7. [Features & Pages](#7-features--pages)
8. [Notification System](#8-notification-system)
9. [API Endpoints](#9-api-endpoints)
10. [Project File Structure](#10-project-file-structure)
11. [How to Run](#11-how-to-run)

---

## 1. Project Overview

**FarmAI** is an AI-powered smart farming assistant built for Indian farmers. It provides:

- Real-time plant disease detection from crop images
- Rainfall and weather prediction using historical IMD data
- Intelligent crop management and scheduling
- Desktop push notifications for weather/crop alerts
- AI chatbot for farming advice
- Data-driven crop recommendations

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────┐
│                  FRONTEND (React)                    │
│  Dashboard │ Crops │ Disease │ Weather │ Chat │ Notif│
└──────────────────────┬───────────────────────────────┘
                       │ REST API (Axios)
                       ▼
┌──────────────────────────────────────────────────────┐
│              BACKEND (Flask Python)                  │
│  app.py  ─── crop_management.py                     │
│           ─── disease_ml_model.py                   │
│           ─── enhanced_rainfall_model.py            │
│           ─── notification_service.py               │
│           ─── firebase_service.py                   │
│           ─── kaggle_integration.py                 │
└──────────────────────┬───────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
  ML Models (sklearn/torch)   Firebase Admin SDK
  Kaggle Datasets              (Push Notifications)
```

**Communication:**
- Frontend → Backend: REST API over `http://localhost:5050`
- Push Notifications: Firebase Cloud Messaging (FCM)
- Backend scheduler: Runs every 5 minutes to send weather/crop alerts

---

## 3. Frontend Technologies

| Technology | Version | Purpose |
|---|---|---|
| React | 19.1.1 | UI framework |
| React Router DOM | 7.7.1 | Page routing |
| Bootstrap 5 | 5.3.7 | Base CSS framework |
| React Bootstrap | 2.10.10 | Bootstrap components |
| TailwindCSS | 4.1.12 | Utility CSS |
| Radix UI | various | Accessible UI primitives |
| Chart.js + React-ChartJS-2 | 4.5.0 | Data charts |
| Lucide React | 0.539.0 | Icon library |
| React Icons | 5.5.0 | Additional icons |
| Firebase SDK | 12.0.0 | Push notifications (FCM) |
| TensorFlow.js | 4.22.0 | In-browser ML inference |
| Teachable Machine | 0.8.5 | Image classification (browser) |
| React Three Fiber | 8.18.0 | 3D rendering (Three.js) |
| Axios | 1.11.0 | HTTP API client |
| PapaParse | 5.5.3 | CSV parsing |

### Key Frontend Files

| File | Purpose |
|---|---|
| `src/firebase.js` | Firebase init, FCM token, foreground listener |
| `public/firebase-messaging-sw.js` | Service worker for background push |
| `src/App.js` | Root component, router mount |
| `src/routes/AppRouter.js` | Route definitions |
| `src/views/home/` | Dashboard page |
| `src/views/crops/` | Crop management page |
| `src/views/diseasae-detection/` | Disease detection page |
| `src/views/weather/` | Weather dashboard page |
| `src/views/notifications/Notifications.js` | Push notification UI |
| `src/views/chatbot/Chat.js` | AI chatbot UI |

---

## 4. Backend Technologies

| Technology | Version | Purpose |
|---|---|---|
| Flask | 3.0.3 | Python web framework |
| Flask-CORS | 4.0.1 | Cross-origin requests |
| scikit-learn | 1.5.1 | ML models (Random Forest, Gradient Boosting) |
| pandas | 2.2.2 | Dataset loading and processing |
| numpy | 1.26.4 | Numerical computation |
| PyTorch | latest | Deep learning (disease model) |
| Transformers (HuggingFace) | 4.41.2 | NLP / chatbot |
| Pillow (PIL) | — | Image processing |
| firebase-admin | — | Firebase push notifications |
| requests | 2.32.3 | External HTTP calls (weather API) |

### Key Backend Files

| File | Purpose |
|---|---|
| `app.py` | Main Flask app, all API routes, background scheduler |
| `firebase_service.py` | FCM token storage, push notification sending |
| `notification_service.py` | Weather/crop alert generation, mock data |
| `disease_ml_model.py` | CNN plant disease detection model |
| `disease_image_analysis.py` | Image validation and preprocessing |
| `disease_integration.py` | Disease detection pipeline |
| `crop_management.py` | Random Forest crop recommendation + yield prediction |
| `enhanced_crop_management.py` | Enhanced version with Kaggle dataset integration |
| `enhanced_rainfall_model.py` | Ensemble rainfall prediction model |
| `rainfall_model.py` | Basic rainfall model |
| `kaggle_integration.py` | Kaggle API data downloader |

---

## 5. Machine Learning Models

### 5.1 Plant Disease Detection (CNN)

**File:** `backend/disease_ml_model.py`  
**Type:** Convolutional Neural Network (CNN)  
**Framework:** PyTorch / TensorFlow.js (in-browser fallback via Teachable Machine)

**What it does:**
- Takes a plant leaf image as input
- Classifies it into one of **38 disease classes** across **14 crops**
- Returns disease name, confidence score, and treatment recommendations

**Classes include:**
- Apple: Apple Scab, Black Rot, Cedar Rust, Healthy
- Corn: Cercospora Leaf Spot, Common Rust, Northern Leaf Blight, Healthy
- Tomato: Bacterial Spot, Early Blight, Late Blight, Septoria Leaf Spot, Target Spot, Mosaic Virus, Healthy
- Grape: Black Rot, Esca, Leaf Blight, Healthy
- Potato: Early Blight, Late Blight, Healthy
- Rice, Wheat, Cotton, Soybean, Pepper, Strawberry, Peach, Cherry, Squash

**Image Validation:**
- Minimum 100×100 pixels
- Must have ≥35% green content (strict plant validation)
- RGB conversion enforced

---

### 5.2 Rainfall Prediction (Ensemble)

**File:** `backend/enhanced_rainfall_model.py`  
**Type:** Ensemble of 3 models  
**Framework:** scikit-learn

| Sub-model | Algorithm | Purpose |
|---|---|---|
| Model 1 | Random Forest Regressor | Primary rainfall prediction |
| Model 2 | Gradient Boosting Regressor | Secondary prediction |
| Model 3 | Linear Regression | Baseline prediction |

**How it works:**
- Trained on IMD subdivision-wise monthly rainfall data
- Input: subdivision name, year, month
- Output: predicted rainfall (mm) and annual totals
- Ensemble average of all 3 models for final prediction

**Features used:**
- `SUBDIVISION` (label encoded)
- `YEAR`
- `MONTH` (1–12)
- Historical monthly rainfall (JAN–DEC)

---

### 5.3 Crop Recommendation (Random Forest Classifier)

**File:** `backend/crop_management.py`  
**Type:** Random Forest Classifier  
**Framework:** scikit-learn

**What it does:**
- Recommends the best crop for a given location and season
- Input: region, season (kharif/rabi), soil type, rainfall prediction
- Output: ranked crop recommendations with confidence scores

**Crop Database includes:**
- Rice, Wheat, Cotton, Sugarcane, Maize, Soybean, Groundnut, Sunflower, Jowar, Bajra, Tur/Arhar, Chickpea, Mustard, Tomato, Onion, Potato

**Each crop has:**
- Water needs (low/medium/high)
- Temperature range (°C)
- Rainfall range (mm)
- Growing season (kharif/rabi/zaid)
- Soil type compatibility
- NPK fertilizer requirements
- Days to harvest
- Drought/flood tolerance
- Market price (₹/quintal)
- Yield potential (tons/hectare)

---

### 5.4 Yield Prediction (Gradient Boosting Regressor)

**File:** `backend/crop_management.py` (inside `CropManagementSystem`)  
**Type:** Gradient Boosting Regressor  
**Framework:** scikit-learn

**What it does:**
- Predicts expected crop yield based on inputs
- Input: crop type, rainfall, temperature, soil type
- Output: predicted yield in tons per hectare

---

### 5.5 AI Chatbot

**File:** `backend/app.py` + `farmai/src/views/chatbot/ChatManager.js`  
**Framework:** HuggingFace Transformers (backend NLP)

**What it does:**
- Answers farming questions in natural language
- Provides crop advice, weather interpretation, disease guidance
- Has quick-question templates for common queries

---

## 6. Datasets

### 6.1 New Plant Diseases Dataset (Augmented)

| Property | Value |
|---|---|
| Source | Kaggle — `plantvillage` dataset |
| Location | `backend/data/disease/New Plant Diseases Dataset(Augmented)/` |
| Size | ~2.9 GB |
| Images | 87,000+ |
| Classes | 38 (healthy + diseased) |
| Crops covered | 14 crops |
| Image size | 256×256 px |
| Format | JPG organized in class folders |

**Folder structure:**
```
train/
  Apple___Apple_scab/
  Apple___Black_rot/
  Apple___Cedar_apple_rust/
  Apple___healthy/
  Corn___Cercospora_leaf_spot/
  ...
  Tomato___Late_blight/
  Tomato___healthy/
```

---

### 6.2 IMD Rainfall Dataset — Sub_Division_IMD_2017

| Property | Value |
|---|---|
| Source | India Meteorological Department |
| File | `backend/Sub_Division_IMD_2017.csv` |
| Coverage | India's meteorological subdivisions |
| Columns | SUBDIVISION, YEAR, JAN–DEC, ANNUAL |
| Purpose | Training rainfall prediction model |

---

### 6.3 Agriculture Crop Production in India (Kaggle)

| Property | Value |
|---|---|
| Source | Kaggle — `srinivas1/agricuture-crops-production-in-india` |
| Location | `backend/data/kaggle/` |
| Purpose | Crop yield and production training data |
| Integration | `kaggle_integration.py` with Kaggle API |

---

## 7. Features & Pages

### Dashboard (Home)
- Overview cards: active crops, weather summary, recent alerts
- Quick navigation to all modules

### Crop Management
- Add/edit/delete crops with planting date, harvest date, type
- Track growth stages (vegetative, tillering, flowering, harvest)
- Receive growth-stage alerts automatically
- Crop health status monitoring

### Disease Detection
- Upload plant leaf photo (camera or file)
- Image validated for green plant content (≥35% green)
- CNN model classifies into 38 disease classes
- Returns: disease name, confidence %, symptoms, treatment recommendations

### Weather Dashboard
- Current weather (temperature, humidity, rainfall, wind speed)
- 3-day forecast
- Rainfall prediction by subdivision using IMD data + ML models
- Historical rainfall trends (Chart.js graphs)

### AI Chatbot
- Natural language farming Q&A
- Quick-question shortcuts
- Powered by HuggingFace Transformers

### Notifications
- Desktop push notifications via Firebase FCM
- Automatic alerts for:
  - Extreme heat (>38°C)
  - Frost warning (<8°C)
  - Heavy rainfall (>50mm)
  - Drought risk
  - High humidity (>85%)
  - Strong winds (>40 km/h)
  - Crop growth stage milestones
  - Harvest reminders (7 days + day-of)
  - Disease detections
- Background scheduler runs every 5 minutes
- Notification history in UI
- Mark as read / clear all

---

## 8. Notification System

### Architecture

```
Browser                     Backend                  Firebase
  │                            │                        │
  │── Enable Notifications ──► │                        │
  │◄── FCM Token ───────────── │                        │
  │── POST /register token ──► │                        │
  │                            │── Firebase Admin ────► │
  │                            │   send_fcm_notification│
  │◄────── Push message ───────────────────────────────►│
  │  showNotification()        │                        │
```

### Key Files

| File | Role |
|---|---|
| `farmai/src/firebase.js` | Token generation, SW registration, foreground listener |
| `farmai/public/firebase-messaging-sw.js` | Background push handler (service worker) |
| `farmai/src/views/notifications/Notifications.js` | Notification UI, enable button, test push |
| `backend/firebase_service.py` | Token storage, FCM push via Firebase Admin SDK |
| `backend/app.py` | API endpoints + background scheduler thread |

### Firebase Configuration

| Parameter | Value |
|---|---|
| Project ID | `farmai-2f0f9` |
| Messaging Sender ID | `921196523463` |
| App ID | `1:921196523463:web:1d56ab53c8cd53898af3e2` |
| VAPID Key | `BBrJ5TAYbZ9w05E-NPmDE5F0Ikx6lWRJ...` |
| Service Account | `farmai-2f0f9-d9932aee09dc.json` |

---

## 9. API Endpoints

### Crop Management
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/crops` | Get all crops |
| POST | `/api/crops` | Add a new crop |
| PUT | `/api/crops/<id>` | Update a crop |
| DELETE | `/api/crops/<id>` | Delete a crop |
| GET | `/api/crops/recommendations` | Get crop recommendations |

### Disease Detection
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/disease/detect` | Upload image → detect disease |
| GET | `/api/disease/history` | Get detection history |
| GET | `/api/disease/classes` | Get all 38 disease classes |

### Weather & Rainfall
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/weather/current` | Current weather data |
| GET | `/api/weather/forecast` | 3-day forecast |
| POST | `/api/rainfall/predict` | Predict rainfall for subdivision/year/month |
| GET | `/api/rainfall/subdivisions` | List available IMD subdivisions |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/notifications/register` | Register FCM token |
| POST | `/api/notifications/send-test` | Send a test push notification |
| POST | `/api/notifications/push-live` | Trigger live weather/crop alerts |
| GET | `/api/notifications/user` | Get notification history |
| DELETE | `/api/notifications/clear` | Clear all notifications |

### Chatbot
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat` | Send message, get AI response |

---

## 10. Project File Structure

```
Project/
├── backend/
│   ├── app.py                        # Flask app + all API routes + scheduler
│   ├── firebase_service.py           # Firebase Admin SDK + FCM token management
│   ├── notification_service.py       # Weather/crop alert generators
│   ├── disease_ml_model.py           # CNN disease detection model class
│   ├── disease_image_analysis.py     # Image validation + preprocessing
│   ├── disease_integration.py        # Disease pipeline integration
│   ├── crop_management.py            # RandomForest crop rec + yield prediction
│   ├── enhanced_crop_management.py   # Kaggle-enhanced crop management
│   ├── enhanced_rainfall_model.py    # Ensemble rainfall prediction
│   ├── rainfall_model.py             # Basic rainfall model
│   ├── kaggle_integration.py         # Kaggle API dataset downloader
│   ├── Sub_Division_IMD_2017.csv     # IMD rainfall dataset
│   ├── requirements.txt              # Python dependencies
│   ├── fcm_tokens.json               # Registered FCM tokens (runtime)
│   ├── notifications_data.json       # Notification history (runtime)
│   ├── farmai-2f0f9-d9932aee09dc.json # Firebase service account key
│   └── data/
│       ├── disease/
│       │   ├── New Plant Diseases Dataset(Augmented)/   # 87k+ images
│       │   └── class_names.json      # 38 disease class definitions
│       └── kaggle/                   # Downloaded Kaggle crop data
│
└── farmai/                           # React frontend
    ├── public/
    │   ├── firebase-messaging-sw.js  # FCM background service worker
    │   └── logo192.png
    ├── src/
    │   ├── App.js                    # Root component
    │   ├── firebase.js               # Firebase SDK + FCM token logic
    │   ├── routes/AppRouter.js       # React Router routes
    │   ├── views/
    │   │   ├── home/                 # Dashboard
    │   │   ├── crops/                # Crop management
    │   │   ├── diseasae-detection/   # Disease detection
    │   │   ├── weather/              # Weather + rainfall
    │   │   ├── notifications/        # Push notification UI
    │   │   └── chatbot/              # AI chatbot
    │   ├── components/               # Shared UI components
    │   ├── hooks/                    # Custom React hooks
    │   ├── utils/                    # Utility functions
    │   └── lib/                      # Shared libraries
    ├── package.json
    └── .gitignore
```

---

## 11. How to Run

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5050
```

### Frontend
```bash
cd farmai
npm install
npm start
# Runs on http://localhost:3000
```

### Test Push Notification
1. Open `http://localhost:3000/notifications`
2. Click **🔔 Enable Notifications** → Allow
3. Click **🧪 Test Push**
4. Desktop popup appears

### Test Rainfall Prediction (curl)
```bash
curl -X POST http://localhost:5050/api/rainfall/predict \
  -H "Content-Type: application/json" \
  -d '{"subdivision": "Karnataka", "year": 2025, "month": 6}'
```

### Test Disease Detection (curl)
```bash
curl -X POST http://localhost:5050/api/disease/detect \
  -H "Content-Type: application/json" \
  -d '{"image": "<base64_encoded_image>"}'
```

---



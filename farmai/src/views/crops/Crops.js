import { useState, useEffect } from "react";
import axios from "axios";
import "./Crops.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050';

const statesAndDistricts = {
  "Andhra Pradesh": [
    "Anantapur",
    "Chittoor",
    "East Godavari",
    "Guntur",
    "Krishna",
    "Kurnool",
    "Prakasam",
    "Srikakulam",
    "Visakhapatnam",
    "Vizianagaram",
    "West Godavari",
    "YSR Kadapa",
  ],
  Karnataka: [
    "Bagalkot",
    "Bangalore Rural",
    "Bangalore Urban",
    "Belgaum",
    "Bellary",
    "Bidar",
    "Bijapur",
    "Chamarajanagar",
    "Chikmagalur",
    "Chitradurga",
    "Dakshina Kannada",
    "Davanagere",
  ],
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Cuddalore",
    "Dharmapuri",
    "Dindigul",
    "Erode",
    "Kanchipuram",
    "Kanyakumari",
    "Karur",
    "Krishnagiri",
    "Madurai",
    "Nagapattinam",
  ],
  Maharashtra: [
    "Ahmednagar",
    "Akola",
    "Amravati",
    "Aurangabad",
    "Beed",
    "Bhandara",
    "Buldhana",
    "Chandrapur",
    "Dhule",
    "Gadchiroli",
    "Gondia",
    "Hingoli",
  ],
  "Uttar Pradesh": [
    "Agra",
    "Aligarh",
    "Allahabad",
    "Ambedkar Nagar",
    "Amethi",
    "Amroha",
    "Auraiya",
    "Azamgarh",
    "Baghpat",
    "Bahraich",
    "Ballia",
    "Balrampur",
  ],
  Gujarat: [
    "Ahmedabad",
    "Amreli",
    "Anand",
    "Banaskantha",
    "Bharuch",
    "Bhavnagar",
    "Dahod",
    "Gandhinagar",
    "Jamnagar",
    "Junagadh",
    "Kutch",
    "Kheda",
  ],
  Rajasthan: [
    "Ajmer",
    "Alwar",
    "Banswara",
    "Baran",
    "Barmer",
    "Bharatpur",
    "Bhilwara",
    "Bikaner",
    "Bundi",
    "Chittorgarh",
    "Churu",
    "Dausa",
  ],
  Punjab: [
    "Amritsar",
    "Barnala",
    "Bathinda",
    "Faridkot",
    "Fatehgarh Sahib",
    "Fazilka",
    "Ferozepur",
    "Gurdaspur",
    "Hoshiarpur",
    "Jalandhar",
    "Kapurthala",
    "Ludhiana",
  ],
  Haryana: [
    "Ambala",
    "Bhiwani",
    "Faridabad",
    "Fatehabad",
    "Gurgaon",
    "Hisar",
    "Jhajjar",
    "Jind",
    "Kaithal",
    "Karnal",
    "Kurukshetra",
    "Mahendragarh",
  ],
  "Madhya Pradesh": [
    "Agar Malwa",
    "Alirajpur",
    "Anuppur",
    "Ashoknagar",
    "Balaghat",
    "Barwani",
    "Betul",
    "Bhind",
    "Bhopal",
    "Burhanpur",
    "Chhatarpur",
    "Chhindwara",
  ],
};

const seasons = ["Kharif", "Rabi", "Zaid", "Whole Year"];
const crops = [
  "Rice",
  "Wheat",
  "Maize",
  "Cotton",
  "Sugarcane",
  "Soybean",
  "Groundnut",
  "Sunflower",
  "Bajra",
  "Jowar",
  "Barley",
  "Gram",
  "Tur",
  "Sesamum",
  "Castor seed",
];
const soilTypes = ["Sandy", "Loamy", "Black", "Red", "Clayey"];
const tabs = [
  "Crop Prediction",
  "crop-recommendation",
  "fertilizer",
  "yield-prediction",
  "crop-info",
];

function Crops() {
  const [cropPredictionForm, setCropPredictionForm] = useState({
    state: "",
    district: "",
    season: "",
  });
  const [cropRecommendationForm, setCropRecommendationForm] = useState({
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    temperature: "",
    humidity: "",
    ph: "",
    rainfall: "",
  });
  const [fertilizerForm, setFertilizerForm] = useState({
    temperature: "",
    humidity: "",
    soilMoisture: "",
    soilType: "",
    cropType: "",
    nitrogen: "",
    phosphorous: "",
    potassium: "",
  });
  const [yieldPredictionForm, setYieldPredictionForm] = useState({
    state: "",
    district: "",
    cropYear: new Date().getFullYear().toString(),
    season: "",
    crop: "",
    area: "",
    production: "",
  });
  const [cropPredictionResult, setCropPredictionResult] = useState(null);
  const [cropRecommendationResult, setCropRecommendationResult] =
    useState(null);
  const [fertilizerResult, setFertilizerResult] = useState(null);
  const [yieldPredictionResult, setYieldPredictionResult] = useState(null);
  const [allCrops, setAllCrops] = useState(null);
  const [selectedCropInfo, setSelectedCropInfo] = useState(null);
  const [loading, setLoading] = useState({
    prediction: false,
    recommendation: false,
    fertilizer: false,
    yield: false,
    cropInfo: false,
  });
  const [activeTab, setActiveTab] = useState("Crop Prediction");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [showDataset, setShowDataset] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, title: "", message: "" });

  // Validation Functions
  const validateCropPredictionForm = () => {
    const errors = [];
    if (!cropPredictionForm.state) errors.push("Please select a state");
    if (!cropPredictionForm.district) errors.push("Please select a district");
    if (!cropPredictionForm.season) errors.push("Please select a season");
    return errors;
  };

  const validateCropRecommendationForm = () => {
    const errors = [];
    const { nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall } = cropRecommendationForm;
    
    if (!nitrogen || isNaN(nitrogen) || nitrogen < 0 || nitrogen > 200) 
      errors.push("Nitrogen must be between 0-200 mg/kg");
    if (!phosphorus || isNaN(phosphorus) || phosphorus < 0 || phosphorus > 200) 
      errors.push("Phosphorus must be between 0-200 mg/kg");
    if (!potassium || isNaN(potassium) || potassium < 0 || potassium > 200) 
      errors.push("Potassium must be between 0-200 mg/kg");
    if (!temperature || isNaN(temperature) || temperature < 0 || temperature > 50) 
      errors.push("Temperature must be between 0-50°C");
    if (!humidity || isNaN(humidity) || humidity < 0 || humidity > 100) 
      errors.push("Humidity must be between 0-100%");
    if (!ph || isNaN(ph) || ph < 0 || ph > 14) 
      errors.push("pH must be between 0-14");
    if (!rainfall || isNaN(rainfall) || rainfall < 0 || rainfall > 1000) 
      errors.push("Rainfall must be between 0-1000mm");
    
    return errors;
  };

  const validateFertilizerForm = () => {
    const errors = [];
    if (!fertilizerForm.cropType) errors.push("Please select a crop type");
    if (!fertilizerForm.nitrogen || isNaN(fertilizerForm.nitrogen)) 
      errors.push("Please enter valid nitrogen value");
    if (!fertilizerForm.phosphorous || isNaN(fertilizerForm.phosphorous)) 
      errors.push("Please enter valid phosphorus value");
    if (!fertilizerForm.potassium || isNaN(fertilizerForm.potassium)) 
      errors.push("Please enter valid potassium value");
    if (!fertilizerForm.soilType) errors.push("Please select a soil type");
    return errors;
  };

  const validateYieldPredictionForm = () => {
    const errors = [];
    if (!yieldPredictionForm.state) errors.push("Please select a state");
    if (!yieldPredictionForm.district) errors.push("Please select a district");
    if (!yieldPredictionForm.crop) errors.push("Please select a crop");
    if (!yieldPredictionForm.area || isNaN(yieldPredictionForm.area) || yieldPredictionForm.area <= 0) 
      errors.push("Please enter a valid area (hectares)");
    if (!yieldPredictionForm.cropYear || isNaN(yieldPredictionForm.cropYear)) 
      errors.push("Please enter a valid year");
    return errors;
  };

  const handleCropPrediction = async () => {
    const errors = validateCropPredictionForm();
    if (errors.length > 0) {
      setErrorModal({
        show: true,
        title: "Validation Error",
        message: errors.join("\n")
      });
      return;
    }

    setLoading((prev) => ({ ...prev, prediction: true }));
    try {
      // Simulated API call
      const data = {
        success: true,
        data: {
          location: `${cropPredictionForm.district}, ${cropPredictionForm.state}`,
          season: cropPredictionForm.season,
          predictions: [
            {
              crop: "Rice",
              confidence: 85,
              suitability: "High",
              reasons: ["Suitable climate", "Good soil conditions"],
            },
            {
              crop: "Wheat",
              confidence: 75,
              suitability: "Medium",
              reasons: ["Moderate rainfall", "Soil compatibility"],
            },
          ],
        },
      };
      if (data.success) {
        setCropPredictionResult(data.data);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Error predicting crop. Please try again.");
      console.error("Prediction error:", error);
    } finally {
      setLoading((prev) => ({ ...prev, prediction: false }));
    }
  };

  const handleCropRecommendation = async () => {
    const errors = validateCropRecommendationForm();
    if (errors.length > 0) {
      setErrorModal({
        show: true,
        title: "Validation Error",
        message: errors.join("\n")
      });
      return;
    }

    setLoading((prev) => ({ ...prev, recommendation: true }));
    try {
      const form = {
        nitrogen: parseFloat(cropRecommendationForm.nitrogen),
        phosphorus: parseFloat(cropRecommendationForm.phosphorus),
        potassium: parseFloat(cropRecommendationForm.potassium),
        temperature: parseFloat(cropRecommendationForm.temperature),
        humidity: parseFloat(cropRecommendationForm.humidity),
        ph: parseFloat(cropRecommendationForm.ph),
        rainfall: parseFloat(cropRecommendationForm.rainfall),
      };
      const data = {
        success: true,
        data: {
          soilAnalysis: {
            nitrogen: { value: form.nitrogen, status: "Optimal" },
            phosphorus: { value: form.phosphorus, status: "Low" },
            potassium: { value: form.potassium, status: "High" },
            ph: { value: form.ph, status: "Neutral" },
          },
          environmentalConditions: {
            temperature: { value: form.temperature },
            humidity: { value: form.humidity },
          },
          recommendations: [
            {
              crop: "Rice",
              scientificName: "Oryza sativa",
              suitability: 85,
              expectedYield: "5 tons/ha",
              duration: "120 days",
              season: "Kharif",
              reasons: ["High rainfall", "Good NPK balance"],
            },
            {
              crop: "Maize",
              scientificName: "Zea mays",
              suitability: 70,
              expectedYield: "4 tons/ha",
              duration: "100 days",
              season: "Kharif",
              reasons: ["Moderate temperature", "Suitable pH"],
            },
          ],
        },
      };
      if (data.success) {
        setCropRecommendationResult(data.data);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Error getting recommendations. Please try again.");
      console.error("Recommendation error:", error);
    } finally {
      setLoading((prev) => ({ ...prev, recommendation: false }));
    }
  };

  const handleFertilizerRecommendation = async () => {
    const errors = validateFertilizerForm();
    if (errors.length > 0) {
      setErrorModal({
        show: true,
        title: "Validation Error",
        message: errors.join("\n")
      });
      return;
    }

    setLoading((prev) => ({ ...prev, fertilizer: true }));
    try {
      const form = {
        temperature: parseFloat(fertilizerForm.temperature),
        humidity: parseFloat(fertilizerForm.humidity),
        soilMoisture: parseFloat(fertilizerForm.soilMoisture),
        soilType: fertilizerForm.soilType,
        cropType: fertilizerForm.cropType,
        nitrogen: parseFloat(fertilizerForm.nitrogen),
        phosphorous: parseFloat(fertilizerForm.phosphorous),
        potassium: parseFloat(fertilizerForm.potassium),
      };
      const data = {
        success: true,
        data: {
          cropType: form.cropType,
          soilAnalysis: {
            currentNPK: {
              nitrogen: form.nitrogen,
              phosphorous: form.phosphorous,
              potassium: form.potassium,
            },
            requiredNPK: { nitrogen: 120, phosphorous: 50, potassium: 100 },
            deficit: {
              nitrogen: 120 - form.nitrogen,
              phosphorous: 50 - form.phosphorous,
              potassium: 100 - form.potassium,
            },
          },
          recommendations: [
            {
              name: "Urea",
              quantity: "100 kg/ha",
              application: "Broadcast",
              timing: "At planting",
            },
            {
              name: "DAP",
              quantity: "50 kg/ha",
              application: "Band placement",
              timing: "30 days after planting",
            },
          ],
          applicationSchedule: [
            { days: "0", stage: "Planting", action: "Apply Urea" },
            { days: "30", stage: "Vegetative", action: "Apply DAP" },
          ],
          estimatedCost: "$150/ha",
          additionalTips: ["Ensure even distribution", "Monitor soil moisture"],
        },
      };
      if (data.success) {
        setFertilizerResult(data.data);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Error getting fertilizer recommendations. Please try again.");
      console.error("Fertilizer error:", error);
    } finally {
      setLoading((prev) => ({ ...prev, fertilizer: false }));
    }
  };

  const handleYieldPrediction = async () => {
    const errors = validateYieldPredictionForm();
    if (errors.length > 0) {
      setErrorModal({
        show: true,
        title: "Validation Error",
        message: errors.join("\n")
      });
      return;
    }

    setLoading((prev) => ({ ...prev, yield: true }));
    try {
      const form = {
        state: yieldPredictionForm.state,
        district: yieldPredictionForm.district,
        cropYear: parseInt(yieldPredictionForm.cropYear),
        season: yieldPredictionForm.season,
        crop: yieldPredictionForm.crop,
        area: parseFloat(yieldPredictionForm.area),
        production: yieldPredictionForm.production
          ? parseFloat(yieldPredictionForm.production)
          : undefined,
      };
      const data = {
        success: true,
        data: {
          location: `${form.district}, ${form.state}`,
          prediction: {
            yieldPerHectare: 5.5,
            totalProduction: 5.5 * form.area,
            confidence: 90,
          },
          economicAnalysis: {
            estimatedRevenue: "$5500",
            revenuePerHectare: "$1000",
            marketPrice: "$200/ton",
            profitMargin: "30%",
          },
          productivity: {
            score: 95,
            comparison: "Above average",
            nationalAverage: "4.5 tons/ha",
          },
          factors: {
            rainfall: { impact: "Positive", score: 85 },
            soil: { impact: "Good", score: 80 },
            temperature: { impact: "Moderate", score: 70 },
          },
          recommendations: [
            "Optimize irrigation",
            "Use recommended fertilizers",
          ],
        },
      };
      if (data.success) {
        setYieldPredictionResult(data.data);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Error predicting yield. Please try again.");
      console.error("Yield prediction error:", error);
    } finally {
      setLoading((prev) => ({ ...prev, yield: false }));
    }
  };

  const fetchCropInfo = async (cropName) => {
    setLoading((prev) => ({ ...prev, cropInfo: true }));
    try {
      // Real API call to get Kaggle dataset crop information
      const { data } = await axios.get(`${API_URL}/api/crop/info`);
      
      if (data.success && data.crop_details && data.crop_details[cropName]) {
        const cropData = data.crop_details[cropName];
        
        // Transform Kaggle data to match UI structure
        const transformedData = {
          name: cropName,
          scientificName: cropData.scientific_name,
          family: "Agricultural Crops",
          season: cropData.growing_season?.join(', ') || 'Kharif',
          duration: `${cropData.days_to_harvest} days`,
          climateRequirement: {
            temperature: `${cropData.temperature_range?.[0]}-${cropData.temperature_range?.[1]}°C`,
            humidity: "60-80%",
            rainfall: `${cropData.rainfall_range?.[0]}-${cropData.rainfall_range?.[1]}mm`,
          },
          soilRequirement: {
            type: cropData.soil_types?.[0] || "Loamy",
            ph: "5.5-7.5",
            drainage: "Well-drained",
          },
          varieties: cropData.varieties || ["Hybrid-1", "Hybrid-2"],
          cultivation: {
            seedRate: "20 kg/ha",
            spacing: "20x10 cm",
            depth: "3-5 cm",
            irrigation: "Weekly",
          },
          nutritionRequirement: {
            nitrogen: `${cropData.nitrogen_needs} kg/ha`,
            phosphorus: `${cropData.phosphorus_needs} kg/ha`,
            potassium: `${cropData.potassium_needs} kg/ha`,
          },
          diseases: cropData.diseases || ["Blast", "Rust"],
          pests: cropData.pests || ["Aphids", "Stem Borer"],
          yield: `${cropData.yield_potential} tons/ha`,
          marketPrice: `₹${cropData.market_price}/quintal`,
          nutritionalValue: {
            protein: "7g/100g",
            carbs: "75g/100g",
            fiber: "2g/100g",
          },
          // Additional Kaggle data
          production_2021: cropData.production_million_tonnes,
          area_2021: cropData.area_million_hectares,
          yield_2021: cropData.yield_2021,
          growth_rate: cropData.growth_rate,
          export_potential: cropData.export_potential,
          major_states: cropData.states,
        };
        
        setSelectedCropInfo(transformedData);
      } else {
        // Fallback to basic structure if crop not found
        setSelectedCropInfo({
          name: cropName,
          scientificName: `${cropName} scientificus`,
          family: "Poaceae",
          season: "Kharif",
          duration: "120 days",
          climateRequirement: {
            temperature: "20-35°C",
            humidity: "60-80%",
            rainfall: "1000-1500 mm",
          },
          soilRequirement: {
            type: "Loamy",
            ph: "5.5-7.5",
            drainage: "Well-drained",
          },
          varieties: ["Hybrid-1", "Hybrid-2"],
          cultivation: {
            seedRate: "20 kg/ha",
            spacing: "20x10 cm",
            depth: "3-5 cm",
            irrigation: "Weekly",
          },
          nutritionRequirement: {
            nitrogen: "120 kg/ha",
            phosphorus: "50 kg/ha",
            potassium: "80 kg/ha",
          },
          diseases: ["Blast", "Rust"],
          pests: ["Aphids", "Stem Borer"],
          yield: "5 tons/ha",
          marketPrice: "₹2000/quintal",
          nutritionalValue: {
            protein: "7g/100g",
            carbs: "75g/100g",
            fiber: "2g/100g",
          },
        });
      }
    } catch (error) {
      console.error("Crop info error:", error);
      alert("Error fetching crop information. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, cropInfo: false }));
    }
  };

  const fetchAllCrops = async () => {
    try {
      // Real API call to get Kaggle dataset crops
      const { data } = await axios.get(`${API_URL}/api/crop/info`);
      
      if (data.success) {
        // Transform Kaggle data to match UI structure
        const transformedData = {
          crops: data.available_crops?.map(crop => ({ 
            name: crop,
            category: data.crop_details?.[crop]?.category || 'general'
          })) || crops.map(crop => ({ name: crop })),
          totalCrops: data.total_crops || crops.length,
          categories: data.crop_categories || { 
            cereals: 8, 
            cash_crops: 4, 
            pulses: 3 
          },
          // Additional Kaggle dataset info
          dataset_statistics: data.dataset_statistics,
          production_by_category: data.production_by_category,
          top_producing_states: data.top_producing_states,
          market_analysis: data.market_analysis,
          crop_details: data.crop_details,
          metadata: data.dataset_metadata,
        };
        
        setAllCrops(transformedData);
      } else {
        // Fallback to static data
        setAllCrops({
          crops: crops.map((crop) => ({ name: crop })),
          totalCrops: crops.length,
          categories: { cereals: 8, cashCrops: 4, pulses: 3 },
        });
      }
    } catch (error) {
      console.error("Error fetching crops:", error);
      // Fallback to static data on error
      setAllCrops({
        crops: crops.map((crop) => ({ name: crop })),
        totalCrops: crops.length,
        categories: { cereals: 8, cashCrops: 4, pulses: 3 },
      });
    }
  };

  useEffect(() => {
    fetchAllCrops();
  }, []);

  return (
    <div className="crops-container">
      <div className="container">
        <div className="crops-header text-center">
          <div style={{flexDirection:'row',display:'flex'}} >
          <div className="container">
            <h1 className="crops-header">Intelligent Crop Management System</h1>
            <p className="lead">
              AI-powered crop prediction, recommendation, and management with
              comprehensive crop information
            </p>
           
          </div>
          <div className="header-actions">
              {/* <button className="btn btn-success rounded-3">
                <i className="bi bi-download me-2"></i>Export Results
              </button> */}
              <button 
                className="btn btn-success rounded-3"
                onClick={() => setShowDataset(true)}
              >
                <i className="bi bi-database me-2"></i>View Dataset
              </button>
            </div>
          </div>
          
        </div>

  
        <div className="d-flex justify-content-center m-2">
          <div className="d-flex bg-light rounded-3 shadow-sm w-100" style={{}}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-fill btn border-0 fw-semibold py-2 ${
                  activeTab === tab
                    ? "bg-white text-success shadow-sm rounded-3"
                    : "text-muted"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="tab-content" style={{ marginTop: "20px" }}>
          {/* Crop Prediction Tab */}
          {activeTab === "Crop Prediction" && (
            <div className="tab-pane fade show active" id="crop-prediction">
              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="crops-card fade-in">
                    <div style={{ marginLeft: "20px", marginTop: "20px" }}>
                      <h5 className="card-title d-flex align-items-center">
                        <i className="bi bi-search  text-success"></i>
                        Location-Based Crop Prediction
                      </h5>
                      <p className="card-text">
                        Input your location and season to get AI-powered crop
                        predictions
                      </p>
                    </div>
                    <div className="card-body">
                      <div className="mb-2">
                        <label
                          htmlFor="prediction-state"
                          className="form-label"
                        >
                          State Name
                        </label>
                        <select
                          className="form-select"
                          value={cropPredictionForm.state}
                          // style={{height:"40px"}}
                          onChange={(e) =>
                            setCropPredictionForm({
                              ...cropPredictionForm,
                              state: e.target.value,
                              district: "",
                            })
                          }
                        >
                          <option value="">Select state</option>
                          {Object.keys(statesAndDistricts).map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label
                          htmlFor="prediction-district"
                          className="form-label"
                        >
                          District Name
                        </label>
                        <select
                          className="form-select"
                          value={cropPredictionForm.district}
                          onChange={(e) =>
                            setCropPredictionForm({
                              ...cropPredictionForm,
                              district: e.target.value,
                            })
                          }
                          disabled={!cropPredictionForm.state}
                        >
                          <option value="">Select district</option>
                          {cropPredictionForm.state &&
                            statesAndDistricts[cropPredictionForm.state]?.map(
                              (district) => (
                                <option key={district} value={district}>
                                  {district}
                                </option>
                              )
                            )}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label
                          htmlFor="prediction-season"
                          className="form-label"
                        >
                          Season
                        </label>
                        <select
                          className="form-select"
                          value={cropPredictionForm.season}
                          onChange={(e) =>
                            setCropPredictionForm({
                              ...cropPredictionForm,
                              season: e.target.value,
                            })
                          }
                        >
                          <option value="">Select season</option>
                          {seasons.map((season) => (
                            <option key={season} value={season}>
                              {season}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        className="btn btn-success w-100"
                        onClick={handleCropPrediction}
                        disabled={loading.prediction}
                      >
                        {loading.prediction ? (
                          <>
                            <i className="bi bi-arrow-repeat me-2"></i>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-cpu"></i>Predict Crop
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="crops-card fade-in">
                    <div style={{ marginLeft: "20px", marginTop: "20px" }}>
                      <h5 className="card-title d-flex align-items-center">
                        <i className="bi bi-bullseye me-2 text-primary"></i>ML
                        Prediction Results
                      </h5>
                    </div>
                    <div className="card-body">
                      {loading.prediction ? (
                        <div className="placeholder-glow">
                          <div
                            className="placeholder col-12 mb-2"
                            style={{ height: "1rem" }}
                          ></div>
                          <div
                            className="placeholder col-8 mb-2"
                            style={{ height: "1rem" }}
                          ></div>
                          <div
                            className="placeholder col-6"
                            style={{ height: "2rem" }}
                          ></div>
                        </div>
                      ) : cropPredictionResult ? (
                        <div>
                          <div className="alert alert-success d-flex align-items-center">
                            <i className="bi bi-check-circle me-2"></i>
                            <div>
                              <div className="fw-medium mb-2">
                                Location: {cropPredictionResult.location}
                              </div>
                              <div className="fw-medium">
                                Season: {cropPredictionResult.season}
                              </div>
                            </div>
                          </div>
                          <h6 className="fw-bold mt-3">Recommended Crops:</h6>
                          {cropPredictionResult.predictions?.map(
                            (prediction, index) => (
                              <div key={index} className="result-card">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <h6 className="mb-0">{prediction.crop}</h6>
                                  <span className="badge badge-success">
                                    {prediction.confidence}% Confidence
                                  </span>
                                </div>
                                <p className="text-muted small mb-2">
                                  Suitability: {prediction.suitability}
                                </p>
                                <div className="small">
                                  {prediction.reasons?.map((reason, idx) => (
                                    <div key={idx} className="d-flex">
                                      <i className="bi bi-check-circle text-success me-2"></i>
                                      <span>{reason}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-5 text-muted">
                          <i className="bi bi-search display-4 mb-3 opacity-50"></i>
                          <p>
                            Select location and season to get AI-powered crop
                            predictions
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Crop Recommendation Tab */}
          {activeTab === "crop-recommendation" && (
            <div className="tab-pane fade show active" id="crop-recommendation">
              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="crops-card fade-in">
                    <div style={{ marginLeft: "20px", marginTop: "20px" }}>
                      <h5 className="card-title d-flex align-items-center">
                        <i className="bi bi-calculator me-2 text-primary"></i>
                        Soil & Environment Analysis
                      </h5>
                      <p className="card-text ms-2">
                        Input soil nutrients and environmental conditions for
                        ML-based crop recommendations
                      </p>
                    </div>
                    <div className="card-body">
                      <div className="row mb-3">
                        <div className="col">
                          <label htmlFor="nitrogen" className="form-label">
                            Nitrogen (N) mg/kg
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="0-140"
                            value={cropRecommendationForm.nitrogen}
                            onChange={(e) =>
                              setCropRecommendationForm({
                                ...cropRecommendationForm,
                                nitrogen: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="col">
                          <label htmlFor="phosphorus" className="form-label">
                            Phosphorus (P) mg/kg
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="5-145"
                            value={cropRecommendationForm.phosphorus}
                            onChange={(e) =>
                              setCropRecommendationForm({
                                ...cropRecommendationForm,
                                phosphorus: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="col">
                          <label htmlFor="potassium" className="form-label">
                            Potassium (K) mg/kg
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="5-205"
                            value={cropRecommendationForm.potassium}
                            onChange={(e) =>
                              setCropRecommendationForm({
                                ...cropRecommendationForm,
                                potassium: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col">
                          <label htmlFor="temperature" className="form-label">
                            Temperature (°C)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="8.8-43.7"
                            value={cropRecommendationForm.temperature}
                            onChange={(e) =>
                              setCropRecommendationForm({
                                ...cropRecommendationForm,
                                temperature: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="col">
                          <label htmlFor="humidity" className="form-label">
                            Humidity (%)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="14-100"
                            value={cropRecommendationForm.humidity}
                            onChange={(e) =>
                              setCropRecommendationForm({
                                ...cropRecommendationForm,
                                humidity: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col">
                          <label htmlFor="ph" className="form-label">
                            pH Level
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            className="form-control"
                            placeholder="3.5-10"
                            value={cropRecommendationForm.ph}
                            onChange={(e) =>
                              setCropRecommendationForm({
                                ...cropRecommendationForm,
                                ph: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="col">
                          <label htmlFor="rainfall" className="form-label">
                            Rainfall (mm)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="20-300"
                            value={cropRecommendationForm.rainfall}
                            onChange={(e) =>
                              setCropRecommendationForm({
                                ...cropRecommendationForm,
                                rainfall: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <button
                        className="btn btn-primary w-100"
                        onClick={handleCropRecommendation}
                        disabled={loading.recommendation}
                      >
                        {loading.recommendation ? (
                          <>
                            <i className="bi bi-arrow-repeat me-2"></i>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-stars me-2"></i>Get AI
                            Recommendations
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="crops-card fade-in">
                    <div style={{ marginLeft: "20px", marginTop: "20px" }}>
                      <h5 className="card-title d-flex align-items-center">
                        <i className="bi bi-award me-2 text-primary"></i>ML Crop
                        Recommendations
                      </h5>
                    </div>
                    <div className="card-body">
                      {loading.recommendation ? (
                        <div className="placeholder-glow">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="border rounded p-3 mb-2">
                              <div
                                className="placeholder col-8 mb-2"
                                style={{ height: "1rem" }}
                              ></div>
                              <div
                                className="placeholder col-12 mb-1"
                                style={{ height: "0.75rem" }}
                              ></div>
                              <div
                                className="placeholder col-9"
                                style={{ height: "0.75rem" }}
                              ></div>
                            </div>
                          ))}
                        </div>
                      ) : cropRecommendationResult ? (
                        <div>
                          <div className="alert alert-info d-flex align-items-center">
                            <i className="bi bi-info-circle me-2"></i>
                            <div className="row w-100">
                              <div className="col">
                                <div className="fw-medium">Soil Analysis:</div>
                                <div>
                                  N:{" "}
                                  {
                                    cropRecommendationResult.soilAnalysis
                                      ?.nitrogen?.value
                                  }{" "}
                                  (
                                  {
                                    cropRecommendationResult.soilAnalysis
                                      ?.nitrogen?.status
                                  }
                                  )
                                </div>
                                <div>
                                  P:{" "}
                                  {
                                    cropRecommendationResult.soilAnalysis
                                      ?.phosphorus?.value
                                  }{" "}
                                  (
                                  {
                                    cropRecommendationResult.soilAnalysis
                                      ?.phosphorus?.status
                                  }
                                  )
                                </div>
                                <div>
                                  K:{" "}
                                  {
                                    cropRecommendationResult.soilAnalysis
                                      ?.potassium?.value
                                  }{" "}
                                  (
                                  {
                                    cropRecommendationResult.soilAnalysis
                                      ?.potassium?.status
                                  }
                                  )
                                </div>
                              </div>
                              <div className="col">
                                <div className="fw-medium">Environment:</div>
                                <div>
                                  pH:{" "}
                                  {
                                    cropRecommendationResult.soilAnalysis?.ph
                                      ?.value
                                  }{" "}
                                  (
                                  {
                                    cropRecommendationResult.soilAnalysis?.ph
                                      ?.status
                                  }
                                  )
                                </div>
                                <div>
                                  Temp:{" "}
                                  {
                                    cropRecommendationResult
                                      .environmentalConditions?.temperature
                                      ?.value
                                  }
                                  °C
                                </div>
                                <div>
                                  Humidity:{" "}
                                  {
                                    cropRecommendationResult
                                      .environmentalConditions?.humidity?.value
                                  }
                                  %
                                </div>
                              </div>
                            </div>
                          </div>
                          <h6 className="fw-bold mt-3">Recommended Crops:</h6>
                          {cropRecommendationResult.recommendations?.map(
                            (result, index) => (
                              <div
                                key={index}
                                className={`result-card ${
                                  result.suitability >= 80
                                    ? ""
                                    : result.suitability >= 60
                                    ? "warning"
                                    : "danger"
                                }`}
                              >
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <div>
                                    <h6 className="mb-0">{result.crop}</h6>
                                    <p className="text-muted small mb-0">
                                      <em>{result.scientificName}</em>
                                    </p>
                                  </div>
                                  <span
                                    className={`badge ${
                                      result.suitability >= 80
                                        ? "badge-success"
                                        : result.suitability >= 60
                                        ? "badge-warning"
                                        : "badge-danger"
                                    }`}
                                  >
                                    {result.suitability.toFixed(1)}% Match
                                  </span>
                                </div>
                                <div className="row small mb-2">
                                  <div className="col">
                                    Expected Yield: {result.expectedYield}
                                  </div>
                                  <div className="col">
                                    Duration: {result.duration}
                                  </div>
                                  <div className="col">
                                    Season: {result.season}
                                  </div>
                                </div>
                                <div className="progress mb-2">
                                  <div
                                    className="progress-bar"
                                    style={{ width: `${result.suitability}%` }}
                                  ></div>
                                </div>
                                <div className="small">
                                  <div className="fw-medium">Analysis:</div>
                                  {result.reasons?.map((reason, idx) => (
                                    <div key={idx} className="d-flex">
                                      <i className="bi bi-check-circle text-success me-2"></i>
                                      <span>{reason}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-5 text-muted">
                          <i className="bi bi-calculator display-4 mb-3 opacity-50"></i>
                          <p>
                            Input soil and environmental data to get ML-powered
                            crop recommendations
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fertilizer Guide Tab */}
          {activeTab === "fertilizer" && (
            <div className="tab-pane fade show active" id="fertilizer">
              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="crops-card fade-in">
                    <div style={{ marginLeft: "20px", marginTop: "20px" }}>
                      <h5 className="card-title d-flex align-items-center">
                        <i className="bi bi-flask me-2 text-warning"></i>Smart
                        Fertilizer Recommendation
                      </h5>
                      <p className="card-text ms-2">
                        Comprehensive farm data analysis for precise fertilizer
                        recommendations
                      </p>
                    </div>
                    <div className="card-body">
                      <div className="row mb-3">
                        <div className="col">
                          <label
                            htmlFor="fertilizer-temperature"
                            className="form-label"
                          >
                            Temperature (°C)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={fertilizerForm.temperature}
                            onChange={(e) =>
                              setFertilizerForm({
                                ...fertilizerForm,
                                temperature: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="col">
                          <label
                            htmlFor="fertilizer-humidity"
                            className="form-label"
                          >
                            Humidity (%)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={fertilizerForm.humidity}
                            onChange={(e) =>
                              setFertilizerForm({
                                ...fertilizerForm,
                                humidity: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="soil-moisture" className="form-label">
                          Soil Moisture (%)
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          value={fertilizerForm.soilMoisture}
                          onChange={(e) =>
                            setFertilizerForm({
                              ...fertilizerForm,
                              soilMoisture: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="row mb-3">
                        <div className="col">
                          <label htmlFor="soil-type" className="form-label">
                            Soil Type
                          </label>
                          <select
                            className="form-select"
                            value={fertilizerForm.soilType}
                            onChange={(e) =>
                              setFertilizerForm({
                                ...fertilizerForm,
                                soilType: e.target.value,
                              })
                            }
                          >
                            <option value="">Select soil type</option>
                            {soilTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col">
                          <label htmlFor="crop-type" className="form-label">
                            Crop Type
                          </label>
                          <select
                            className="form-select"
                            value={fertilizerForm.cropType}
                            onChange={(e) =>
                              setFertilizerForm({
                                ...fertilizerForm,
                                cropType: e.target.value,
                              })
                            }
                          >
                            <option value="">Select crop</option>
                            {crops.map((crop) => (
                              <option key={crop} value={crop}>
                                {crop}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col">
                          <label
                            htmlFor="fertilizer-nitrogen"
                            className="form-label"
                          >
                            Current Nitrogen
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={fertilizerForm.nitrogen}
                            onChange={(e) =>
                              setFertilizerForm({
                                ...fertilizerForm,
                                nitrogen: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="col">
                          <label
                            htmlFor="fertilizer-phosphorous"
                            className="form-label"
                          >
                            Current Phosphorous
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={fertilizerForm.phosphorous}
                            onChange={(e) =>
                              setFertilizerForm({
                                ...fertilizerForm,
                                phosphorous: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="col">
                          <label
                            htmlFor="fertilizer-potassium"
                            className="form-label"
                          >
                            Current Potassium
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={fertilizerForm.potassium}
                            onChange={(e) =>
                              setFertilizerForm({
                                ...fertilizerForm,
                                potassium: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <button
                        className="btn btn-warning w-100"
                        onClick={handleFertilizerRecommendation}
                        disabled={loading.fertilizer}
                      >
                        {loading.fertilizer ? (
                          <>
                            <i className="bi bi-arrow-repeat me-2"></i>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-flask me-2"></i>Get Fertilizer
                            Recommendation
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="crops-card fade-in">
                    <div style={{ marginLeft: "20px", marginTop: "20px" }}>
                      <h5 className="card-title d-flex align-items-center">
                        <i className="bi bi-flask me-2 text-warning"></i>
                        Fertilizer Recommendations
                      </h5>
                    </div>
                    <div className="card-body">
                      {loading.fertilizer ? (
                        <div className="placeholder-glow">
                          <div
                            className="placeholder col-12 mb-2"
                            style={{ height: "4rem" }}
                          ></div>
                          <div
                            className="placeholder col-12 mb-2"
                            style={{ height: "3rem" }}
                          ></div>
                          <div
                            className="placeholder col-8"
                            style={{ height: "2rem" }}
                          ></div>
                        </div>
                      ) : fertilizerResult ? (
                        <div className="d-flex flex-column gap-4">
                          <div className="alert alert-warning d-flex align-items-center">
                            <i className="bi bi-search-heart me-2"></i>
                            <div>
                              <div className="fw-medium mb-2">
                                Crop: {fertilizerResult.cropType}
                              </div>
                              <div className="row small">
                                <div className="col">
                                  <div className="fw-medium">Current NPK:</div>
                                  <div>
                                    N:{" "}
                                    {
                                      fertilizerResult.soilAnalysis?.currentNPK
                                        ?.nitrogen
                                    }
                                  </div>
                                  <div>
                                    P:{" "}
                                    {
                                      fertilizerResult.soilAnalysis?.currentNPK
                                        ?.phosphorous
                                    }
                                  </div>
                                  <div>
                                    K:{" "}
                                    {
                                      fertilizerResult.soilAnalysis?.currentNPK
                                        ?.potassium
                                    }
                                  </div>
                                </div>
                                <div className="col">
                                  <div className="fw-medium">Required NPK:</div>
                                  <div>
                                    N:{" "}
                                    {
                                      fertilizerResult.soilAnalysis?.requiredNPK
                                        ?.nitrogen
                                    }
                                  </div>
                                  <div>
                                    P:{" "}
                                    {
                                      fertilizerResult.soilAnalysis?.requiredNPK
                                        ?.phosphorous
                                    }
                                  </div>
                                  <div>
                                    K:{" "}
                                    {
                                      fertilizerResult.soilAnalysis?.requiredNPK
                                        ?.potassium
                                    }
                                  </div>
                                </div>
                                <div className="col">
                                  <div className="fw-medium">Deficit:</div>
                                  <div>
                                    N:{" "}
                                    {
                                      fertilizerResult.soilAnalysis?.deficit
                                        ?.nitrogen
                                    }
                                  </div>
                                  <div>
                                    P:{" "}
                                    {
                                      fertilizerResult.soilAnalysis?.deficit
                                        ?.phosphorous
                                    }
                                  </div>
                                  <div>
                                    K:{" "}
                                    {
                                      fertilizerResult.soilAnalysis?.deficit
                                        ?.potassium
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h6 className="fw-bold">
                              Recommended Fertilizers:
                            </h6>
                            {fertilizerResult.recommendations?.map(
                              (rec, index) => (
                                <div
                                  key={index}
                                  className="border rounded p-3 mb-2 bg-light"
                                >
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h6 className="mb-0">{rec.name}</h6>
                                    <span className="badge badge-warning">
                                      {rec.quantity}
                                    </span>
                                  </div>
                                  <div className="small">
                                    <div>
                                      <span className="fw-medium">
                                        Application Method:
                                      </span>{" "}
                                      {rec.application}
                                    </div>
                                    <div>
                                      <span className="fw-medium">
                                        Best Timing:
                                      </span>{" "}
                                      {rec.timing}
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                          <div>
                            <h6 className="fw-bold">Application Schedule:</h6>
                            {fertilizerResult.applicationSchedule?.map(
                              (schedule, index) => (
                                <div
                                  key={index}
                                  className="d-flex align-items-center p-3 border rounded mb-2"
                                >
                                  <div className="w-8 h-8 bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3">
                                    <span className="text-warning fw-bold">
                                      {schedule.days}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="fw-medium">
                                      {schedule.stage}
                                    </div>
                                    <div className="text-muted small">
                                      {schedule.action}
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                          <div className="alert alert-success d-flex align-items-center">
                            <i className="bi bi-currency-dollar me-2"></i>
                            <div className="fw-medium">
                              Estimated Cost: {fertilizerResult.estimatedCost}
                            </div>
                          </div>
                          <div className="bg-info bg-opacity-10 rounded p-3">
                            <h6 className="fw-bold text-info mb-2">
                              💡 Expert Tips
                            </h6>
                            <ul className="list-unstyled small text-info">
                              {fertilizerResult.additionalTips?.map(
                                (tip, index) => (
                                  <li key={index} className="d-flex">
                                    <i className="bi bi-check-circle text-info me-2"></i>
                                    {tip}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-5 text-muted">
                          <i className="bi bi-flask display-4 mb-3 opacity-50"></i>
                          <p>
                            Complete the form to get AI-powered fertilizer
                            recommendations
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Yield Prediction Tab */}
          {activeTab === "yield-prediction" && (
            <div className="tab-pane fade show active" id="yield-prediction">
              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="crops-card fade-in">
                    <div style={{ marginLeft: "20px", marginTop: "20px" }}>
                      <h5 className="card-title d-flex align-items-center">
                        <i className="bi bi-graph-up me-2 text-primary"></i>ML
                        Yield Prediction
                      </h5>
                      <p className="card-text ms-2">
                        Advanced machine learning model for accurate yield
                        forecasting
                      </p>
                    </div>
                    <div className="card-body">
                      <div className="row mb-3">
                        <div className="col">
                          <label htmlFor="yield-state" className="form-label">
                            State Name
                          </label>
                          <select
                            className="form-select"
                            value={yieldPredictionForm.state}
                            onChange={(e) =>
                              setYieldPredictionForm({
                                ...yieldPredictionForm,
                                state: e.target.value,
                                district: "",
                              })
                            }
                          >
                            <option value="">Select state</option>
                            {Object.keys(statesAndDistricts).map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col">
                          <label
                            htmlFor="yield-district"
                            className="form-label"
                          >
                            District Name
                          </label>
                          <select
                            className="form-select"
                            value={yieldPredictionForm.district}
                            onChange={(e) =>
                              setYieldPredictionForm({
                                ...yieldPredictionForm,
                                district: e.target.value,
                              })
                            }
                            disabled={!yieldPredictionForm.state}
                          >
                            <option value="">Select district</option>
                            {yieldPredictionForm.state &&
                              statesAndDistricts[
                                yieldPredictionForm.state
                              ]?.map((district) => (
                                <option key={district} value={district}>
                                  {district}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col">
                          <label htmlFor="crop-year" className="form-label">
                            Crop Year
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            min="2020"
                            max="2030"
                            value={yieldPredictionForm.cropYear}
                            onChange={(e) =>
                              setYieldPredictionForm({
                                ...yieldPredictionForm,
                                cropYear: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="col">
                          <label htmlFor="yield-season" className="form-label">
                            Season
                          </label>
                          <select
                            className="form-select"
                            value={yieldPredictionForm.season}
                            onChange={(e) =>
                              setYieldPredictionForm({
                                ...yieldPredictionForm,
                                season: e.target.value,
                              })
                            }
                          >
                            <option value="">Select season</option>
                            {seasons.map((season) => (
                              <option key={season} value={season}>
                                {season}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col">
                          <label htmlFor="yield-crop" className="form-label">
                            Crop
                          </label>
                          <select
                            className="form-select"
                            value={yieldPredictionForm.crop}
                            onChange={(e) =>
                              setYieldPredictionForm({
                                ...yieldPredictionForm,
                                crop: e.target.value,
                              })
                            }
                          >
                            <option value="">Select crop</option>
                            {crops.map((crop) => (
                              <option key={crop} value={crop}>
                                {crop}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col">
                          <label htmlFor="area" className="form-label">
                            Area (Hectares)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={yieldPredictionForm.area}
                            onChange={(e) =>
                              setYieldPredictionForm({
                                ...yieldPredictionForm,
                                area: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="col">
                          <label
                            htmlFor="production"
                            className="form-label"
                            style={{ fontWeight: 400 }}
                          >
                            Previous Production (Tons) - Optional
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={yieldPredictionForm.production}
                            onChange={(e) =>
                              setYieldPredictionForm({
                                ...yieldPredictionForm,
                                production: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <button
                        className="btn btn-primary w-100"
                        onClick={handleYieldPrediction}
                        disabled={loading.yield}
                      >
                        {loading.yield ? (
                          <>
                            <i className="bi bi-arrow-repeat me-2"></i>
                            Predicting...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-graph-up me-2"></i>Predict Yield
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="crops-card fade-in">
                    <div style={{ marginLeft: "20px", marginTop: "20px" }}>
                      <h5 className="card-title d-flex align-items-center">
                        <i className="bi bi-bar-chart me-2 text-primary"></i>ML
                        Yield Prediction Results
                      </h5>
                    </div>
                    <div className="card-body">
                      {loading.yield ? (
                        <div className="placeholder-glow">
                          <div
                            className="placeholder col-12 mb-2"
                            style={{ height: "4rem" }}
                          ></div>
                          <div
                            className="placeholder col-12 mb-2"
                            style={{ height: "3rem" }}
                          ></div>
                          <div
                            className="placeholder col-8"
                            style={{ height: "2rem" }}
                          ></div>
                        </div>
                      ) : yieldPredictionResult ? (
                        <div className="d-flex flex-column gap-4">
                          <div className="alert alert-info d-flex align-items-center">
                            <i className="bi bi-graph-up me-2"></i>
                            <div className="row w-100">
                              <div className="col">
                                <div className="fw-medium mb-2">
                                  Predicted Yield:{" "}
                                  {
                                    yieldPredictionResult.prediction
                                      ?.yieldPerHectare
                                  }{" "}
                                  tons/hectare
                                </div>
                                <div className="fw-medium">
                                  Total Production:{" "}
                                  {
                                    yieldPredictionResult.prediction
                                      ?.totalProduction
                                  }{" "}
                                  tons
                                </div>
                              </div>
                              <div className="col">
                                <div className="fw-medium mb-2">
                                  Confidence:{" "}
                                  {yieldPredictionResult.prediction?.confidence}
                                  %
                                </div>
                                <div className="fw-medium">
                                  Location: {yieldPredictionResult.location}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-success bg-opacity-10 rounded p-3">
                            <h6 className="fw-bold text-success mb-2">
                              💰 Economic Analysis
                            </h6>
                            <div className="row small">
                              <div className="col">
                                <div className="fw-medium">Total Revenue:</div>
                                <div className="fs-5 fw-bold text-success">
                                  {
                                    yieldPredictionResult.economicAnalysis
                                      ?.estimatedRevenue
                                  }
                                </div>
                              </div>
                              <div className="col">
                                <div className="fw-medium">
                                  Revenue/Hectare:
                                </div>
                                <div className="fs-5 fw-bold text-success">
                                  {
                                    yieldPredictionResult.economicAnalysis
                                      ?.revenuePerHectare
                                  }
                                </div>
                              </div>
                              <div className="col">
                                <div className="fw-medium">Market Price:</div>
                                <div>
                                  {
                                    yieldPredictionResult.economicAnalysis
                                      ?.marketPrice
                                  }
                                </div>
                              </div>
                              <div className="col">
                                <div className="fw-medium">Profit Margin:</div>
                                <div>
                                  {
                                    yieldPredictionResult.economicAnalysis
                                      ?.profitMargin
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-primary bg-opacity-10 rounded p-3">
                            <h6 className="fw-bold text-primary mb-2">
                              📊 Productivity Analysis
                            </h6>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span>Productivity Score:</span>
                              <span
                                className={`badge ${
                                  yieldPredictionResult.productivity?.score >
                                  100
                                    ? "badge-success"
                                    : yieldPredictionResult.productivity
                                        ?.score > 90
                                    ? "badge-warning"
                                    : "badge-danger"
                                }`}
                              >
                                {yieldPredictionResult.productivity?.score}%
                              </span>
                            </div>
                            <div className="progress mb-2">
                              <div
                                className="progress-bar"
                                style={{
                                  width: `${yieldPredictionResult.productivity?.score}%`,
                                }}
                              ></div>
                            </div>
                            <div className="small">
                              <div>
                                <strong>Comparison:</strong>{" "}
                                {yieldPredictionResult.productivity?.comparison}
                              </div>
                              <div>
                                <strong>National Average:</strong>{" "}
                                {
                                  yieldPredictionResult.productivity
                                    ?.nationalAverage
                                }
                              </div>
                            </div>
                          </div>
                          <div>
                            <h6 className="fw-bold">🎯 Impact Factors</h6>
                            {yieldPredictionResult.factors &&
                              Object.entries(yieldPredictionResult.factors).map(
                                ([factor, data]) => (
                                  <div
                                    key={factor}
                                    className="d-flex justify-content-between align-items-center p-3 border rounded mb-2"
                                  >
                                    <div className="d-flex align-items-center">
                                      <div
                                        className={`w-3 h-3 rounded-circle me-3 ${
                                          data.impact === "Positive"
                                            ? "bg-success"
                                            : data.impact === "Good"
                                            ? "bg-primary"
                                            : "bg-warning"
                                        }`}
                                      ></div>
                                      <div>
                                        <div className="fw-medium text-capitalize">
                                          {factor}
                                        </div>
                                        <div className="text-muted small">
                                          {data.impact}
                                        </div>
                                      </div>
                                    </div>
                                    <span className="badge border">
                                      {data.score}%
                                    </span>
                                  </div>
                                )
                              )}
                          </div>
                          <div className="bg-warning bg-opacity-10 rounded p-3">
                            <h6 className="fw-bold text-warning mb-2">
                              💡 Recommendations
                            </h6>
                            <ul className="list-unstyled small text-warning">
                              {yieldPredictionResult.recommendations?.map(
                                (rec, index) => (
                                  <li key={index} className="d-flex">
                                    <i className="bi bi-check-circle text-warning me-2"></i>
                                    {rec}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-5 text-muted">
                          <i className="bi bi-bar-chart display-4 mb-3 opacity-50"></i>
                          <p>
                            Input crop and location data to get ML-powered yield
                            predictions
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Crop Information Tab */}
          {activeTab === "crop-info" && (
            <div className="tab-pane fade show active" id="crop-info">
              <div className="row g-4">
                <div className="col-lg-4">
                  <div className="crops-card fade-in">
                    <div style={{ marginLeft: "20px", marginTop: "20px" }}>
                      <h5 className="card-title d-flex align-items-center">
                        <i className="bi bi-book me-2 text-success"></i>Crop
                        Information
                      </h5>
                      <p className="card-text ms-2">
                        Comprehensive database of crop information
                      </p>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <label htmlFor="crop-select" className="form-label">
                          Select Crop
                        </label>
                        <select
                          className="form-select"
                          onChange={(e) => fetchCropInfo(e.target.value)}
                        >
                          <option value="">Choose a crop to learn about</option>
                          {allCrops?.crops?.map((crop) => (
                            <option key={crop.name} value={crop.name}>
                              {crop.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {allCrops && (
                        <div className="row">
                          <h6 className="fw-bold">Database Overview</h6>
                          <div className="crop-stats">
                            <div className="stat-card">
                              <div className="stat-label">Total Crops</div>
                              <div className="stat-value text-success">
                                {allCrops.totalCrops}
                              </div>
                            </div>
                            <div className="stat-card">
                              <div className="stat-label">Cereals</div>
                              <div className="stat-value text-primary">
                                {allCrops.categories?.cereals}
                              </div>
                            </div>
                            <div className="stat-card">
                              <div className="stat-label">Cash Crops</div>
                              <div className="stat-value text-purple">
                                {allCrops.categories?.cashCrops}
                              </div>
                            </div>
                            <div className="stat-card">
                              <div className="stat-label">Pulses</div>
                              <div className="stat-value text-warning">
                                {allCrops.categories?.pulses}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-lg-8">
                  <div className="crops-card fade-in">
                    {loading.cropInfo ? (
                      <div className="card-body placeholder-glow">
                        <div
                          className="placeholder col-8 mb-2"
                          style={{ height: "2rem" }}
                        ></div>
                        <div
                          className="placeholder col-6 mb-2"
                          style={{ height: "1rem" }}
                        ></div>
                        <div
                          className="placeholder col-12 mb-2"
                          style={{ height: "8rem" }}
                        ></div>
                        <div
                          className="placeholder col-12 mb-2"
                          style={{ height: "6rem" }}
                        ></div>
                        <div
                          className="placeholder col-8"
                          style={{ height: "4rem" }}
                        ></div>
                      </div>
                    ) : selectedCropInfo ? (
                      <>
                        <div style={{ marginLeft: "20px", marginTop: "20px" }}>
                          <h5 className="card-title d-flex align-items-center">
                            <i className="bi bi-tree me-2 text-success"></i>
                            {selectedCropInfo.name}
                          </h5>
                          <p className="card-text ms-2">
                            <em>{selectedCropInfo.scientificName}</em> • Family:{" "}
                            {selectedCropInfo.family}
                          </p>
                        </div>
                        <div className="card-body">
                          <ul className="nav nav-tabs crop-info-tabs mb-3">
                            <div className="d-flex justify-content-center m-2 w-100">
                              <div
                                className="d-flex bg-light rounded-3 shadow-sm w-100"
                                // style={{width:"1000px" }}
                              >
                                {[
                                  "overview",
                                  "cultivation",
                                  "health",
                                  "economics",
                                ].map((tab) => (
                                  <button
                                    key={tab}
                                    onClick={() => setActiveSubTab(tab)}
                                    className={`flex-fill btn border-0 fw-semibold py-2 ${
                                      activeSubTab === tab
                                        ? "bg-white text-success shadow-sm rounded-3"
                                        : "text-muted"
                                    }`}
                                  >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* {['overview', 'cultivation', 'health', 'economics'].map(tab => (
                            <li className="nav-item" key={tab}>
                              <button
                                className={`nav-link ${activeSubTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveSubTab(tab)}
                              >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                              </button>
                            </li>
                          ))} */}
                          </ul>
                          <div className="tab-content">
                            <div
                              className={`tab-pane fade ${
                                activeSubTab === "overview" ? "show active" : ""
                              }`}
                              id="crop-overview"
                            >
                              <div className="row g-4">
                                <div className="col-md-6">
                                  <h6 className="fw-bold text-success">
                                    Growing Conditions
                                  </h6>
                                  <div className="d-flex align-items-center mb-2">
                                    <i className="bi bi-calendar me-2 text-muted"></i>
                                    <div>
                                      <p className="fw-medium mb-0">
                                        Season & Duration
                                      </p>
                                      <p className="text-muted">
                                        {selectedCropInfo.season} •{" "}
                                        {selectedCropInfo.duration}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center mb-2">
                                    <i className="bi bi-thermometer-sun me-2 text-muted"></i>
                                    <div>
                                      <p className="fw-medium mb-0">
                                        Temperature
                                      </p>
                                      <p className="text-muted">
                                        {
                                          selectedCropInfo.climateRequirement
                                            ?.temperature
                                        }
                                      </p>
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <i className="bi bi-droplet me-2 text-muted"></i>
                                    <div>
                                      <p className="fw-medium mb-0">
                                        Humidity & Rainfall
                                      </p>
                                      <p className="text-muted">
                                        {
                                          selectedCropInfo.climateRequirement
                                            ?.humidity
                                        }{" "}
                                        •{" "}
                                        {
                                          selectedCropInfo.climateRequirement
                                            ?.rainfall
                                        }
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <h6 className="fw-bold text-success">
                                    Soil Requirements
                                  </h6>
                                  <div className="d-flex align-items-center mb-2">
                                    <i className="bi bi-geo-alt me-2 text-muted"></i>
                                    <div>
                                      <p className="fw-medium mb-0">
                                        Soil Type
                                      </p>
                                      <p className="text-muted">
                                        {selectedCropInfo.soilRequirement?.type}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center mb-2">
                                    <i className="bi bi-flask me-2 text-muted"></i>
                                    <div>
                                      <p className="fw-medium mb-0">pH Range</p>
                                      <p className="text-muted">
                                        {selectedCropInfo.soilRequirement?.ph}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <i className="bi bi-eye me-2 text-muted"></i>
                                    <div>
                                      <p className="fw-medium mb-0">Drainage</p>
                                      <p className="text-muted">
                                        {
                                          selectedCropInfo.soilRequirement
                                            ?.drainage
                                        }
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-primary bg-opacity-10 rounded p-3 mt-3">
                                <h6 className="fw-bold text-primary mb-2">
                                  Popular Varieties
                                </h6>
                                <div className="d-flex flex-wrap gap-2">
                                  {selectedCropInfo.varieties?.map(
                                    (variety, index) => (
                                      <span
                                        key={index}
                                        className="badge border"
                                        style={{ color: "black" }}
                                      >
                                        {variety}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                            <div
                              className={`tab-pane fade ${
                                activeSubTab === "cultivation"
                                  ? "show active"
                                  : ""
                              }`}
                              id="crop-cultivation"
                            >
                              <div className="row g-4">
                                <div className="col-md-6">
                                  <h6 className="fw-bold text-success">
                                    Cultivation Details
                                  </h6>
                                  <div className="small">
                                    <div>
                                      <span className="fw-medium">
                                        Seed Rate:
                                      </span>{" "}
                                      {selectedCropInfo.cultivation?.seedRate}
                                    </div>
                                    <div>
                                      <span className="fw-medium">
                                        Spacing:
                                      </span>{" "}
                                      {selectedCropInfo.cultivation?.spacing}
                                    </div>
                                    <div>
                                      <span className="fw-medium">
                                        Planting Depth:
                                      </span>{" "}
                                      {selectedCropInfo.cultivation?.depth}
                                    </div>
                                    <div>
                                      <span className="fw-medium">
                                        Irrigation:
                                      </span>{" "}
                                      {selectedCropInfo.cultivation?.irrigation}
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <h6 className="fw-bold text-success">
                                    Nutrition Requirements
                                  </h6>
                                  <div className="bg-success bg-opacity-10 p-3 rounded mb-2">
                                    <p className="fw-medium mb-0">
                                      Nitrogen (N)
                                    </p>
                                    <p className="text-success fw-bold">
                                      {
                                        selectedCropInfo.nutritionRequirement
                                          ?.nitrogen
                                      }
                                    </p>
                                  </div>
                                  <div className="bg-warning bg-opacity-10 p-3 rounded mb-2">
                                    <p className="fw-medium mb-0">
                                      Phosphorus (P)
                                    </p>
                                    <p className="text-warning fw-bold">
                                      {
                                        selectedCropInfo.nutritionRequirement
                                          ?.phosphorus
                                      }
                                    </p>
                                  </div>
                                  <div className="bg-primary bg-opacity-10 p-3 rounded">
                                    <p className="fw-medium mb-0">
                                      Potassium (K)
                                    </p>
                                    <p className="text-primary fw-bold">
                                      {
                                        selectedCropInfo.nutritionRequirement
                                          ?.potassium
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div
                              className={`tab-pane fade ${
                                activeSubTab === "health" ? "show active" : ""
                              }`}
                              id="crop-health"
                            >
                              <div className="row g-4">
                                <div className="col-md-6">
                                  <h6 className="fw-bold text-danger">
                                    Common Diseases
                                  </h6>
                                  {selectedCropInfo.diseases?.map(
                                    (disease, index) => (
                                      <div
                                        key={index}
                                        className="d-flex align-items-center p-2 border border-danger bg-opacity-10 rounded bg-danger mb-2"
                                      >
                                        <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
                                        <span className="text-danger">
                                          {disease}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                                <div className="col-md-6">
                                  <h6 className="fw-bold text-warning">
                                    Common Pests
                                  </h6>
                                  {selectedCropInfo.pests?.map(
                                    (pest, index) => (
                                      <div
                                        key={index}
                                        className="d-flex align-items-center p-2 border border-warning bg-opacity-10 rounded bg-warning mb-2"
                                      >
                                        <i className="bi bi-bug me-2 text-warning"></i>
                                        <span className="text-warning">
                                          {pest}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                            <div
                              className={`tab-pane fade ${
                                activeSubTab === "economics"
                                  ? "show active"
                                  : ""
                              }`}
                              id="crop-economics"
                            >
                              <div className="row g-4">
                                <div className="col-md-4">
                                  <div className="bg-success bg-opacity-10 p-3 rounded">
                                    <h6 className="fw-bold text-success mb-2">
                                      Expected Yield
                                    </h6>
                                    <div className="fs-4 fw-bold text-success">
                                      {selectedCropInfo.yield}
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="bg-primary bg-opacity-10 p-3 rounded">
                                    <h6 className="fw-bold text-primary mb-2">
                                      Market Price
                                    </h6>
                                    <div className="fs-4 fw-bold text-primary">
                                      {selectedCropInfo.marketPrice}
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="bg-info bg-opacity-10 p-3 rounded">
                                    <h6 className="fw-bold text-info mb-2">
                                      Nutritional Value
                                    </h6>
                                    <div className="small">
                                      {selectedCropInfo.nutritionalValue &&
                                        Object.entries(
                                          selectedCropInfo.nutritionalValue
                                        ).map(([key, value]) => (
                                          <div
                                            key={key}
                                            className="d-flex justify-content-between"
                                          >
                                            <span className="text-capitalize">
                                              {key}:
                                            </span>
                                            <span className="fw-medium">
                                              {value}
                                            </span>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="card-body text-center py-5 text-muted">
                        <i className="bi bi-book display-4 mb-3 opacity-50"></i>
                        <p className="fs-5">
                          Select a crop to view detailed information
                        </p>
                        <p>
                          Comprehensive cultivation guide, requirements, and
                          economic data
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {/* {activeTab === 'analytics' && (
          <div className="tab-pane fade show active" id="analytics">
            <div className="row g-4">
              {[
                { title: 'Dataset Summary', icon: 'database', color: 'success', items: [
                  { label: 'Crop Prediction Records', value: '2,00,000+' },
                  { label: 'Crop Recommendation Data', value: '2,200' },
                  { label: 'Fertilizer Records', value: '50,000+' },
                  { label: 'Yield Prediction Data', value: '2,46,091' }
                ]},
                { title: 'Model Accuracy', icon: 'activity', color: 'primary', items: [
                  { label: 'Crop Prediction', value: '92.5%', valueColor: 'success' },
                  { label: 'Crop Recommendation', value: '89.8%', valueColor: 'success' },
                  { label: 'Fertilizer Recommendation', value: '91.2%', valueColor: 'success' },
                  { label: 'Yield Prediction', value: '87.6%', valueColor: 'success' }
                ]},
                { title: 'Coverage', icon: 'geo-alt', color: 'purple', items: [
                  { label: 'States Covered', value: '10' },
                  { label: 'Districts', value: '120+' },
                  { label: 'Crop Types', value: '15+' },
                  { label: 'Soil Types', value: '5' }
                ]},
                { title: 'API Performance', icon: 'clock', color: 'warning', items: [
                  { label: 'Daily Predictions', value: '1,500+' },
                  { label: 'Response Time', value: '< 2 sec' },
                  { label: 'Success Rate', value: '99.2%', valueColor: 'success' },
                  { label: 'User Satisfaction', value: '4.8/5', valueColor: 'success' }
                ]}
              ].map((section, index) => (
                <div key={index} className="col-md-6 col-lg-3">
                  <div className="crops-card fade-in">
                    <div style={{marginLeft:"20px",marginTop:'20px'}} >
                      <h5 className="card-title d-flex align-items-center">
                        <i className={`bi bi-${section.icon} me-2 text-${section.color}`}></i>{section.title}
                      </h5>
                    </div>
                    <div className="card-body">
                      {section.items.map((item, idx) => (
                        <div key={idx} className="d-flex justify-content-between mb-2">
                          <span>{item.label}</span>
                          <span className={`fw-medium ${item.valueColor ? `text-${item.valueColor}` : ''}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )} */}
        </div>

        {/* Dataset Modal */}
        {showDataset && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title">
                    <i className="bi bi-database me-2"></i>
                    Kaggle Dataset - Agriculture Crop Production in India
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => setShowDataset(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {/* Kaggle Link */}
                  <div className="alert alert-info mb-4">
                    <h6 className="fw-bold">
                      <i className="bi bi-link-45deg me-2"></i>
                      Dataset Source
                    </h6>
                    <p className="mb-2">
                      This dataset is sourced from Kaggle - Agriculture Crop Production in India
                    </p>
                    <a 
                      href="https://www.kaggle.com/datasets/srinivas1/agricuture-crops-production-in-india" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary btn-sm"
                    >
                      <i className="bi bi-box-arrow-up-right me-1"></i>
                      View on Kaggle
                    </a>
                  </div>

                  {/* Dataset Statistics */}
                  {allCrops?.dataset_statistics && (
                    <div className="row g-3 mb-4">
                      <div className="col-md-3">
                        <div className="card text-center bg-success bg-opacity-10">
                          <div className="card-body">
                            <h4 className="text-success">{allCrops.totalCrops}</h4>
                            <small className="text-muted">Total Crops</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card text-center bg-primary bg-opacity-10">
                          <div className="card-body">
                            <h4 className="text-primary">{allCrops.dataset_statistics.total_production}</h4>
                            <small className="text-muted">Total Production</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card text-center bg-info bg-opacity-10">
                          <div className="card-body">
                            <h4 className="text-info">{allCrops.dataset_statistics.total_area}</h4>
                            <small className="text-muted">Total Area</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card text-center bg-warning bg-opacity-10">
                          <div className="card-body">
                            <h4 className="text-warning">{allCrops.dataset_statistics.average_yield}</h4>
                            <small className="text-muted">Avg Yield</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  {allCrops?.categories && (
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">📊 Crop Categories</h6>
                      <div className="row g-2">
                        {Object.entries(allCrops.categories).map(([category, count]) => (
                          <div key={category} className="col-md-4">
                            <div className="d-flex justify-content-between p-2 bg-light rounded">
                              <span className="text-capitalize">{category.replace('_', ' ')}</span>
                              <span className="badge bg-success">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available Crops */}
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3">🌾 Available Crops in Dataset</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {allCrops?.crops?.map((crop, index) => (
                        <span key={index} className="badge bg-primary">
                          {crop.name || crop}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  {allCrops?.metadata && (
                    <div className="alert alert-secondary">
                      <h6 className="fw-bold">📋 Dataset Metadata</h6>
                      <div className="small">
                        <div><strong>Source:</strong> {allCrops.metadata.source}</div>
                        <div><strong>Data Points:</strong> {allCrops.metadata.data_points}</div>
                        <div><strong>Accuracy:</strong> {allCrops.metadata.accuracy}</div>
                        <div><strong>Last Updated:</strong> {allCrops.metadata.last_updated}</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowDataset(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {errorModal.show && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {errorModal.title}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => setErrorModal({ ...errorModal, show: false })}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-danger">
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                      {errorModal.message}
                    </pre>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    onClick={() => setErrorModal({ ...errorModal, show: false })}
                  >
                    <i className="bi bi-check-lg me-1"></i>
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Crops;

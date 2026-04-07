import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050';

const CropManagement = () => {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form states
  const [locationForm, setLocationForm] = useState({
    subdivision: '',
    year: new Date().getFullYear().toString()
  });
  
  // Data states
  const [cropRecommendations, setCropRecommendations] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [managementPlan, setManagementPlan] = useState(null);
  const [seasonalCalendar, setSeasonalCalendar] = useState(null);
  const [cropInfo, setCropInfo] = useState(null);
  const [subdivisions, setSubdivisions] = useState([
    'Andaman & Nicobar Islands', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh',
    'Chhattisgarh', 'Dadra & Nagar Haveli', 'Daman & Diu', 'Delhi', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand',
    'Karnataka', 'Kerala', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra',
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry',
    'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ]);
  
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadCropInfo();
  }, []);

  const loadCropInfo = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/crop/info`);
      setCropInfo(data);
    } catch (err) {
      console.error('Failed to load crop info:', err);
    }
  };

  const handleLocationChange = (field, value) => {
    setLocationForm(prev => ({ ...prev, [field]: value }));
  };

  const generateRecommendations = async () => {
    if (!locationForm.subdivision || !locationForm.year) {
      setError('Please select subdivision and year');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data } = await axios.post(`${API_URL}/api/crop/recommendations`, {
        subdivision: locationForm.subdivision,
        year: parseInt(locationForm.year)
      });

      setCropRecommendations(data.recommendations);
      setActiveTab('recommendations');
    } catch (err) {
      setError('Failed to generate recommendations');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const getManagementPlan = async (cropName) => {
    if (!locationForm.subdivision || !locationForm.year) {
      setError('Please select subdivision and year first');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/crop/management-plan`, {
        crop: cropName,
        subdivision: locationForm.subdivision,
        year: parseInt(locationForm.year)
      });

      setManagementPlan(data.management_plan);
      setSelectedCrop(cropName);
      setActiveTab('management');
    } catch (err) {
      setError('Failed to load management plan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSeasonalCalendar = async () => {
    if (!locationForm.subdivision || !locationForm.year) {
      setError('Please select subdivision and year first');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/crop/seasonal-calendar`, {
        subdivision: locationForm.subdivision,
        year: parseInt(locationForm.year)
      });

      setSeasonalCalendar(data);
      setActiveTab('calendar');
    } catch (err) {
      setError('Failed to load seasonal calendar');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSuitabilityColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  const getRiskColor = (score) => {
    if (score <= 30) return 'success';
    if (score <= 60) return 'warning';
    return 'danger';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <style>
        {`
          .card-hover:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
          }
          .suitability-high { border-left: 4px solid #28a745; }
          .suitability-medium { border-left: 4px solid #ffc107; }
          .suitability-low { border-left: 4px solid #dc3545; }
          .crop-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-radius: 15px;
            overflow: hidden;
          }
        `}
      </style>

      <div className="container py-4">
        {/* Header */}
        <div className="text-center text-white mb-4">
          <h1 className="display-5 fw-bold mb-3">
            🌾 Intelligent Crop Management System
          </h1>
          <p className="lead">
            AI-powered crop recommendations, management planning, and profitability analysis
          </p>
        </div>

        {/* Location Selection */}
        <div className="card card-hover mb-4">
          <div className="card-body">
            <h3 className="card-title">📍 Location & Year Selection</h3>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">Subdivision</label>
                <select
                  className="form-select"
                  value={locationForm.subdivision}
                  onChange={(e) => handleLocationChange('subdivision', e.target.value)}
                >
                  <option value="">Select your subdivision</option>
                  {subdivisions.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Year</label>
                <input
                  type="number"
                  className="form-control"
                  min="2020"
                  max="2030"
                  value={locationForm.year}
                  onChange={(e) => handleLocationChange('year', e.target.value)}
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button
                  className="btn btn-primary w-100"
                  onClick={generateRecommendations}
                  disabled={isGenerating || !locationForm.subdivision || !locationForm.year}
                >
                  {isGenerating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Analyzing...
                    </>
                  ) : (
                    '🚀 Generate'
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="alert alert-danger mt-3">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="card mb-4">
          <div className="card-body">
            <ul className="nav nav-pills nav-fill">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'recommendations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('recommendations')}
                >
                  📊 Recommendations
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'management' ? 'active' : ''}`}
                  onClick={() => setActiveTab('management')}
                  disabled={!selectedCrop}
                >
                  📋 Management Plan
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'calendar' ? 'active' : ''}`}
                  onClick={loadSeasonalCalendar}
                >
                  📅 Seasonal Calendar
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'info' ? 'active' : ''}`}
                  onClick={() => setActiveTab('info')}
                >
                  ℹ️ System Info
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'recommendations' && (
          <div className="row g-4">
            {cropRecommendations.length > 0 ? (
              cropRecommendations.map((crop, index) => (
                <div key={index} className="col-lg-6">
                  <div className={`card card-hover crop-card suitability-${crop.suitability}`}>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h4 className="card-title mb-0">{crop.crop}</h4>
                        <span className={`badge bg-${getSuitabilityColor(crop.suitability_score)}`}>
                          {crop.suitability.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="row g-3 mb-3">
                        <div className="col-6">
                          <div className="text-center">
                            <div className="fs-2 fw-bold text-primary">{crop.suitability_score}%</div>
                            <div className="small text-muted">Suitability</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="text-center">
                            <div className="fs-2 fw-bold text-success">{crop.predicted_yield}</div>
                            <div className="small text-muted">Yield (tons/ha)</div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span>💰 Revenue</span>
                          <strong>{formatCurrency(crop.estimated_revenue)}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>💸 Cost</span>
                          <strong>{formatCurrency(crop.estimated_cost)}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>📈 Profit</span>
                          <strong className={crop.estimated_profit > 0 ? 'text-success' : 'text-danger'}>
                            {formatCurrency(crop.estimated_profit)}
                          </strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>📊 ROI</span>
                          <strong>{crop.roi_percentage}%</strong>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <span className="badge bg-secondary me-1">{crop.water_needs} water</span>
                          <span className="badge bg-info me-1">{crop.days_to_harvest} days</span>
                          <span className={`badge bg-${getRiskColor(crop.risk_score)}`}>
                            Risk: {crop.risk_score}%
                          </span>
                        </div>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => getManagementPlan(crop.crop)}
                        >
                          📋 Plan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12">
                <div className="text-center py-5">
                  <div className="fs-1 mb-3">🌾</div>
                  <h4>No Recommendations Yet</h4>
                  <p className="text-muted">Select your location and click "Generate" to get personalized crop recommendations</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'management' && selectedCrop && managementPlan && (
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card card-hover">
                <div className="card-body">
                  <h4 className="card-title">📅 Planting Schedule</h4>
                  {managementPlan.planting_schedule.map((schedule, index) => (
                    <div key={index} className="alert alert-info">
                      <strong>{schedule.season}</strong>
                      <p className="mb-1">Plant: Month {schedule.planting_month} | Harvest: Month {schedule.harvest_month}</p>
                      <small>{schedule.optimal_conditions}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card card-hover">
                <div className="card-body">
                  <h4 className="card-title">💧 Irrigation Plan</h4>
                  <div className="mb-3">
                    <strong>Water Needs:</strong> {managementPlan.irrigation_plan.water_needs_level}
                  </div>
                  <div className="mb-3">
                    <strong>Frequency:</strong> {managementPlan.irrigation_plan.irrigation_frequency}
                  </div>
                  <div className="mb-3">
                    <strong>Method:</strong> {managementPlan.irrigation_plan.irrigation_method}
                  </div>
                  <div>
                    <strong>Conservation Tips:</strong>
                    <ul className="small mt-2">
                      {managementPlan.irrigation_plan.water_conservation_tips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card card-hover">
                <div className="card-body">
                  <h4 className="card-title">🌱 Fertilizer Schedule</h4>
                  <div className="mb-3">
                    <strong>Nitrogen (N):</strong> {managementPlan.fertilizer_schedule.nitrogen.total_dosage} kg/ha
                  </div>
                  <div className="mb-3">
                    <strong>Phosphorus (P):</strong> {managementPlan.fertilizer_schedule.phosphorus.total_dosage} kg/ha
                  </div>
                  <div className="mb-3">
                    <strong>Potassium (K):</strong> {managementPlan.fertilizer_schedule.potassium.total_dosage} kg/ha
                  </div>
                  <div>
                    <strong>Application Stages:</strong>
                    <ul className="small mt-2">
                      {managementPlan.fertilizer_schedule.nitrogen.application_schedule.map((stage, index) => (
                        <li key={index}>{stage.stage}: {stage.dosage} kg at {stage.timing}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card card-hover">
                <div className="card-body">
                  <h4 className="card-title">🐛 Pest Management</h4>
                  <div className="mb-3">
                    <strong>Disease Risk:</strong> 
                    <span className={`badge bg-${managementPlan.pest_management.disease_risk_level === 'high' ? 'danger' : 
                                             managementPlan.pest_management.disease_risk_level === 'medium' ? 'warning' : 'success'} ms-2`}>
                      {managementPlan.pest_management.disease_risk_level}
                    </span>
                  </div>
                  <div className="mb-3">
                    <strong>Common Pests:</strong>
                    <ul className="small mt-2">
                      {managementPlan.pest_management.common_pests.map((pest, index) => (
                        <li key={index}>{pest}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>Treatment Schedule:</strong>
                    <ul className="small mt-2">
                      {managementPlan.pest_management.treatment_schedule.map((treatment, index) => (
                        <li key={index}>{treatment.stage}: {treatment.timing}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && seasonalCalendar && (
          <div className="row g-4">
            <div className="col-12">
              <div className="card card-hover">
                <div className="card-body">
                  <h4 className="card-title">📅 Seasonal Calendar - {seasonalCalendar.location} ({seasonalCalendar.year})</h4>
                  <p className="text-muted">Rainfall Outlook: {seasonalCalendar.rainfall_outlook}mm</p>
                  
                  <div className="row g-4">
                    <div className="col-md-4">
                      <div className="card border-success">
                        <div className="card-body">
                          <h5 className="card-title text-success">🌱 Kharif Season</h5>
                          <p className="small text-muted">Months: Jun-Sep</p>
                          <div className="d-flex flex-wrap gap-2">
                            {seasonalCalendar.seasonal_calendar.kharif.crops.map((crop, index) => (
                              <span key={index} className="badge bg-success">{crop}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-4">
                      <div className="card border-primary">
                        <div className="card-body">
                          <h5 className="card-title text-primary">🌾 Rabi Season</h5>
                          <p className="small text-muted">Months: Oct-Feb</p>
                          <div className="d-flex flex-wrap gap-2">
                            {seasonalCalendar.seasonal_calendar.rabi.crops.map((crop, index) => (
                              <span key={index} className="badge bg-primary">{crop}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-4">
                      <div className="card border-warning">
                        <div className="card-body">
                          <h5 className="card-title text-warning">☀️ Summer Season</h5>
                          <p className="small text-muted">Months: Mar-May</p>
                          <div className="d-flex flex-wrap gap-2">
                            {seasonalCalendar.seasonal_calendar.summer.crops.map((crop, index) => (
                              <span key={index} className="badge bg-warning">{crop}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'info' && cropInfo && (
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card card-hover">
                <div className="card-body">
                  <h4 className="card-title">🌾 Available Crops ({cropInfo.total_crops})</h4>
                  <div className="row g-2">
                    {cropInfo.available_crops.map((crop, index) => (
                      <div key={index} className="col-6">
                        <div className="p-2 bg-light rounded text-center">
                          {crop}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6">
              <div className="card card-hover">
                <div className="card-body">
                  <h4 className="card-title">🤖 System Features</h4>
                  <ul className="list-unstyled">
                    {cropInfo.system_features.map((feature, index) => (
                      <li key={index} className="mb-2">
                        <span className="text-primary">✓</span> {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="col-12">
              <div className="card card-hover">
                <div className="card-body">
                  <h4 className="card-title">📊 Crop Categories</h4>
                  <div className="row g-3">
                    {Object.entries(cropInfo.crop_categories).map(([category, crops]) => (
                      <div key={category} className="col-md-3">
                        <div className="card border-secondary h-100">
                          <div className="card-body text-center">
                            <h6 className="card-title text-capitalize">{category.replace('_', ' ')}</h6>
                            <div className="d-flex flex-wrap gap-1 justify-content-center">
                              {crops.map((crop, index) => (
                                <span key={index} className="badge bg-secondary small">{crop}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CropManagement;

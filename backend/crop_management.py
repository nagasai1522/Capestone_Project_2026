# Intelligent Crop Management System
import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_absolute_error
import pickle
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class CropManagementSystem:
    def __init__(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.rainfall_csv = os.path.join(base_dir, "Sub_Division_IMD_2017.csv")
        
        if not os.path.exists(self.rainfall_csv):
            raise FileNotFoundError(f"Rainfall dataset not found at {self.rainfall_csv}")
        
        print("[CropManagementSystem] Initializing with rainfall data...")
        self.models = {}
        self.encoders = {}
        self.scalers = {}
        self.crop_data = self._create_crop_database()
        self._load_and_train()
    
    def _create_crop_database(self):
        """Create comprehensive crop database with requirements"""
        crops = {
            'Rice': {
                'water_needs': 'high',
                'temperature_range': (20, 35),
                'rainfall_range': (800, 1500),
                'growing_season': ['kharif'],
                'soil_type': ['clay', 'loamy'],
                'fertilizer_npk': (120, 60, 40),
                'days_to_harvest': 120,
                'drought_tolerance': 'low',
                'flood_tolerance': 'high',
                'market_price': 2500,  # per quintal
                'yield_potential': 3.5,  # tons per hectare
                'disease_risk': 'medium'
            },
            'Wheat': {
                'water_needs': 'medium',
                'temperature_range': (15, 25),
                'rainfall_range': (400, 800),
                'growing_season': ['rabi'],
                'soil_type': ['loamy', 'clay'],
                'fertilizer_npk': (150, 60, 40),
                'days_to_harvest': 110,
                'drought_tolerance': 'medium',
                'flood_tolerance': 'low',
                'market_price': 2200,
                'yield_potential': 3.0,
                'disease_risk': 'medium'
            },
            'Cotton': {
                'water_needs': 'medium',
                'temperature_range': (25, 35),
                'rainfall_range': (600, 1200),
                'growing_season': ['kharif'],
                'soil_type': ['black', 'loamy'],
                'fertilizer_npk': (100, 50, 50),
                'days_to_harvest': 150,
                'drought_tolerance': 'medium',
                'flood_tolerance': 'medium',
                'market_price': 6000,
                'yield_potential': 1.8,
                'disease_risk': 'high'
            },
            'Sugarcane': {
                'water_needs': 'very_high',
                'temperature_range': (20, 35),
                'rainfall_range': (1000, 2000),
                'growing_season': ['perennial'],
                'soil_type': ['loamy', 'clay'],
                'fertilizer_npk': (200, 80, 80),
                'days_to_harvest': 365,
                'drought_tolerance': 'low',
                'flood_tolerance': 'medium',
                'market_price': 3000,
                'yield_potential': 70.0,
                'disease_risk': 'low'
            },
            'Maize': {
                'water_needs': 'medium',
                'temperature_range': (18, 32),
                'rainfall_range': (500, 1000),
                'growing_season': ['kharif', 'rabi'],
                'soil_type': ['loamy', 'sandy'],
                'fertilizer_npk': (120, 60, 40),
                'days_to_harvest': 90,
                'drought_tolerance': 'medium',
                'flood_tolerance': 'low',
                'market_price': 1800,
                'yield_potential': 2.5,
                'disease_risk': 'medium'
            },
            'Pulses': {
                'water_needs': 'low',
                'temperature_range': (20, 30),
                'rainfall_range': (300, 700),
                'growing_season': ['rabi', 'kharif'],
                'soil_type': ['loamy', 'sandy'],
                'fertilizer_npk': (40, 40, 20),
                'days_to_harvest': 75,
                'drought_tolerance': 'high',
                'flood_tolerance': 'low',
                'market_price': 4500,
                'yield_potential': 1.2,
                'disease_risk': 'low'
            },
            'Millets': {
                'water_needs': 'very_low',
                'temperature_range': (25, 35),
                'rainfall_range': (200, 500),
                'growing_season': ['kharif'],
                'soil_type': ['sandy', 'loamy'],
                'fertilizer_npk': (40, 20, 20),
                'days_to_harvest': 60,
                'drought_tolerance': 'very_high',
                'flood_tolerance': 'very_low',
                'market_price': 2000,
                'yield_potential': 1.0,
                'disease_risk': 'very_low'
            },
            'Vegetables': {
                'water_needs': 'medium',
                'temperature_range': (15, 30),
                'rainfall_range': (600, 1200),
                'growing_season': ['year_round'],
                'soil_type': ['loamy', 'sandy'],
                'fertilizer_npk': (100, 50, 50),
                'days_to_harvest': 45,
                'drought_tolerance': 'medium',
                'flood_tolerance': 'medium',
                'market_price': 15000,
                'yield_potential': 8.0,
                'disease_risk': 'high'
            },
            'Soybean': {
                'water_needs': 'medium',
                'temperature_range': (20, 30),
                'rainfall_range': (500, 900),
                'growing_season': ['kharif'],
                'soil_type': ['loamy', 'clay'],
                'fertilizer_npk': (40, 60, 20),
                'days_to_harvest': 100,
                'drought_tolerance': 'medium',
                'flood_tolerance': 'medium',
                'market_price': 4000,
                'yield_potential': 1.5,
                'disease_risk': 'medium'
            },
            'Groundnut': {
                'water_needs': 'low',
                'temperature_range': (22, 35),
                'rainfall_range': (400, 800),
                'growing_season': ['kharif'],
                'soil_type': ['sandy', 'loamy'],
                'fertilizer_npk': (40, 40, 20),
                'days_to_harvest': 90,
                'drought_tolerance': 'high',
                'flood_tolerance': 'low',
                'market_price': 5500,
                'yield_potential': 1.8,
                'disease_risk': 'medium'
            }
        }
        return crops
    
    def _load_and_train(self):
        """Load rainfall data and train ML models"""
        df = pd.read_csv(self.rainfall_csv)
        
        # Clean data
        required_cols = ["SUBDIVISION", "YEAR", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", 
                      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "ANNUAL"]
        
        df_clean = df.dropna(subset=required_cols).copy()
        print(f"[CropManagementSystem] Training on {len(df_clean)} data points")
        
        # Train crop suitability model
        self._train_crop_suitability_model(df_clean)
        
        # Train yield prediction model
        self._train_yield_prediction_model(df_clean)
        
        print(f"[CropManagementSystem] ✅ ML models trained successfully")
    
    def _train_crop_suitability_model(self, df):
        """Train model to predict crop suitability based on rainfall patterns"""
        # Create training data
        training_data = []
        
        for _, row in df.iterrows():
            annual_rainfall = row['ANNUAL']
            monsoon = row['JUN'] + row['JUL'] + row['AUG'] + row['SEP']
            
            for crop_name, crop_info in self.crop_data.items():
                # Calculate suitability score based on rainfall match
                rain_min, rain_max = crop_info['rainfall_range']
                
                if rain_min <= annual_rainfall <= rain_max:
                    suitability = 'high'
                elif (rain_min * 0.7) <= annual_rainfall <= (rain_max * 1.3):
                    suitability = 'medium'
                else:
                    suitability = 'low'
                
                training_data.append({
                    'crop': crop_name,
                    'annual_rainfall': annual_rainfall,
                    'monsoon_rainfall': monsoon,
                    'water_needs': crop_info['water_needs'],
                    'suitability': suitability
                })
        
        train_df = pd.DataFrame(training_data)
        
        # Features and target
        features = ['annual_rainfall', 'monsoon_rainfall']
        X = train_df[features]
        
        # Encode categorical variables
        le_water = LabelEncoder()
        X['water_needs_encoded'] = le_water.fit_transform(train_df['water_needs'])
        self.encoders['water_needs'] = le_water
        
        # Target
        le_suitability = LabelEncoder()
        y = le_suitability.fit_transform(train_df['suitability'])
        self.encoders['suitability'] = le_suitability
        
        # Train model
        self.models['suitability'] = RandomForestClassifier(n_estimators=100, random_state=42)
        self.models['suitability'].fit(X, y)
    
    def _train_yield_prediction_model(self, df):
        """Train model to predict crop yields based on conditions"""
        training_data = []
        
        for _, row in df.iterrows():
            annual_rainfall = row['ANNUAL']
            monsoon = row['JUN'] + row['JUL'] + row['AUG'] + row['SEP']
            
            for crop_name, crop_info in self.crop_data.items():
                # Simulate yield based on conditions
                base_yield = crop_info['yield_potential']
                
                # Adjust yield based on rainfall match
                rain_min, rain_max = crop_info['rainfall_range']
                if rain_min <= annual_rainfall <= rain_max:
                    rain_factor = 1.0
                elif annual_rainfall < rain_min:
                    rain_factor = 0.7 + (annual_rainfall / rain_min) * 0.3
                else:
                    rain_factor = 1.0 - ((annual_rainfall - rain_max) / rain_max) * 0.3
                
                # Add some randomness for realistic variation
                yield_amount = base_yield * rain_factor * np.random.uniform(0.8, 1.2)
                
                training_data.append({
                    'crop': crop_name,
                    'annual_rainfall': annual_rainfall,
                    'monsoon_rainfall': monsoon,
                    'water_needs': crop_info['water_needs'],
                    'yield': yield_amount
                })
        
        train_df = pd.DataFrame(training_data)
        
        # Features
        features = ['annual_rainfall', 'monsoon_rainfall']
        X = train_df[features]
        
        # Encode water needs
        X['water_needs_encoded'] = self.encoders['water_needs'].transform(train_df['water_needs'])
        
        # Target
        y = train_df['yield']
        
        # Train model
        self.models['yield'] = GradientBoostingRegressor(n_estimators=100, random_state=42)
        self.models['yield'].fit(X, y)
    
    def get_crop_recommendations(self, subdivision, year, rainfall_data=None):
        """Get crop recommendations for given conditions"""
        if rainfall_data is None:
            # Get rainfall prediction
            from enhanced_rainfall_model import get_enhanced_predictor
            try:
                predictor = get_enhanced_predictor()
                rainfall_data = predictor.predict(subdivision, year)
            except:
                # Fallback to historical average
                df = pd.read_csv(self.rainfall_csv)
                sub_data = df[df['SUBDIVISION'] == subdivision]
                if len(sub_data) > 0:
                    rainfall_data = {
                        'ANNUAL': sub_data['ANNUAL'].mean(),
                        'JUN': sub_data['JUN'].mean(),
                        'JUL': sub_data['JUL'].mean(),
                        'AUG': sub_data['AUG'].mean(),
                        'SEP': sub_data['SEP'].mean()
                    }
                else:
                    rainfall_data = {'ANNUAL': 1000, 'JUN': 200, 'JUL': 250, 'AUG': 200, 'SEP': 150}
        
        annual_rainfall = rainfall_data.get('ANNUAL', 1000)
        monsoon_rainfall = rainfall_data.get('JUN', 0) + rainfall_data.get('JUL', 0) + \
                          rainfall_data.get('AUG', 0) + rainfall_data.get('SEP', 0)
        
        recommendations = []
        
        for crop_name, crop_info in self.crop_data.items():
            # Predict suitability
            features = pd.DataFrame({
                'annual_rainfall': [annual_rainfall],
                'monsoon_rainfall': [monsoon_rainfall],
                'water_needs_encoded': [self.encoders['water_needs'].transform([crop_info['water_needs']])[0]]
            })
            
            suitability_pred = self.models['suitability'].predict(features)[0]
            suitability_label = self.encoders['suitability'].inverse_transform([suitability_pred])[0]
            
            # Predict yield
            yield_pred = self.models['yield'].predict(features)[0]
            
            # Calculate profitability
            revenue = yield_pred * crop_info['market_price']
            estimated_cost = (crop_info['fertilizer_npk'][0] * 15 + 
                             crop_info['fertilizer_npk'][1] * 25 + 
                             crop_info['fertilizer_npk'][2] * 20 +
                             yield_pred * 5000)  # cultivation cost
            
            profit = revenue - estimated_cost
            roi = (profit / estimated_cost) * 100 if estimated_cost > 0 else 0
            
            # Risk assessment
            risk_score = self._calculate_risk_score(crop_info, annual_rainfall)
            
            recommendation = {
                'crop': crop_name,
                'suitability': suitability_label,
                'suitability_score': int(suitability_pred * 100) if suitability_label == 'high' else 
                                  int(suitability_pred * 50) if suitability_label == 'medium' else 25,
                'predicted_yield': round(yield_pred, 2),
                'market_price': crop_info['market_price'],
                'estimated_revenue': round(revenue, 0),
                'estimated_cost': round(estimated_cost, 0),
                'estimated_profit': round(profit, 0),
                'roi_percentage': round(roi, 1),
                'risk_score': risk_score,
                'water_needs': crop_info['water_needs'],
                'growing_season': crop_info['growing_season'],
                'days_to_harvest': crop_info['days_to_harvest'],
                'drought_tolerance': crop_info['drought_tolerance'],
                'flood_tolerance': crop_info['flood_tolerance'],
                'fertilizer_npk': crop_info['fertilizer_npk'],
                'disease_risk': crop_info['disease_risk']
            }
            
            recommendations.append(recommendation)
        
        # Sort by suitability and profitability
        recommendations.sort(key=lambda x: (x['suitability_score'], x['roi_percentage']), reverse=True)
        
        return recommendations[:10]  # Return top 10 recommendations
    
    def _calculate_risk_score(self, crop_info, annual_rainfall):
        """Calculate risk score for crop"""
        risk_score = 50  # Base risk
        
        # Rainfall risk
        rain_min, rain_max = crop_info['rainfall_range']
        if annual_rainfall < rain_min * 0.7:
            risk_score += 30  # Drought risk
        elif annual_rainfall > rain_max * 1.3:
            risk_score += 20  # Flood risk
        
        # Disease risk
        disease_risk_map = {'low': -10, 'medium': 0, 'high': 15}
        risk_score += disease_risk_map.get(crop_info['disease_risk'], 0)
        
        # Market risk (based on price volatility)
        if crop_info['market_price'] < 2000:
            risk_score += 10  # Low price crops have higher risk
        
        return min(100, max(0, risk_score))
    
    def get_crop_management_plan(self, crop_name, subdivision, year, rainfall_data=None):
        """Get detailed management plan for specific crop"""
        if crop_name not in self.crop_data:
            return None
        
        crop_info = self.crop_data[crop_name]
        
        # Get rainfall data
        if rainfall_data is None:
            from enhanced_rainfall_model import get_enhanced_predictor
            try:
                predictor = get_enhanced_predictor()
                rainfall_data = predictor.predict(subdivision, year)
            except:
                rainfall_data = {'ANNUAL': 1000}
        
        # Create management plan
        plan = {
            'crop': crop_name,
            'planting_schedule': self._get_planting_schedule(crop_info, rainfall_data),
            'irrigation_plan': self._get_irrigation_plan(crop_info, rainfall_data),
            'fertilizer_schedule': self._get_fertilizer_schedule(crop_info),
            'pest_management': self._get_pest_management(crop_info),
            'harvesting_timeline': self._get_harvesting_timeline(crop_info),
            'risk_mitigation': self._get_risk_mitigation(crop_info, rainfall_data),
            'market_opportunities': self._get_market_opportunities(crop_info)
        }
        
        return plan
    
    def _get_planting_schedule(self, crop_info, rainfall_data):
        """Get optimal planting schedule"""
        seasons = crop_info['growing_season']
        current_month = datetime.now().month
        
        schedule = []
        for season in seasons:
            if season == 'kharif':
                planting_month = 6  # June
                harvest_month = 10  # October
            elif season == 'rabi':
                planting_month = 10  # October
                harvest_month = 2  # February
            elif season == 'perennial':
                planting_month = 2  # February
                harvest_month = 2  # February next year
            else:  # year_round
                planting_month = current_month
                harvest_month = current_month + 2
            
            schedule.append({
                'season': season,
                'planting_month': planting_month,
                'harvest_month': harvest_month,
                'optimal_conditions': f"Temperature {crop_info['temperature_range'][0]}-{crop_info['temperature_range'][1]}°C"
            })
        
        return schedule
    
    def _get_irrigation_plan(self, crop_info, rainfall_data):
        """Get irrigation recommendations"""
        water_needs = crop_info['water_needs']
        annual_rainfall = rainfall_data.get('ANNUAL', 1000)
        
        irrigation_plan = {
            'water_needs_level': water_needs,
            'irrigation_frequency': self._get_irrigation_frequency(water_needs),
            'irrigation_method': self._get_irrigation_method(water_needs),
            'supplemental_watering': annual_rainfall < 800,
            'water_conservation_tips': [
                'Use drip irrigation for better efficiency',
                'Mulch to reduce evaporation',
                'Irrigate during early morning or evening'
            ]
        }
        
        return irrigation_plan
    
    def _get_irrigation_frequency(self, water_needs):
        """Get irrigation frequency based on water needs"""
        frequency_map = {
            'very_low': 'Every 10-15 days',
            'low': 'Every 7-10 days',
            'medium': 'Every 4-6 days',
            'high': 'Every 2-3 days',
            'very_high': 'Daily or alternate days'
        }
        return frequency_map.get(water_needs, 'Every 5-7 days')
    
    def _get_irrigation_method(self, water_needs):
        """Get recommended irrigation method"""
        method_map = {
            'very_low': 'Rainfed with occasional supplemental',
            'low': 'Furrow irrigation',
            'medium': 'Drip or sprinkler',
            'high': 'Drip irrigation',
            'very_high': 'Flood irrigation with drip supplement'
        }
        return method_map.get(water_needs, 'Drip irrigation')
    
    def _get_fertilizer_schedule(self, crop_info):
        """Get fertilizer application schedule"""
        n, p, k = crop_info['fertilizer_npk']
        
        return {
            'nitrogen': {
                'total_dosage': n,
                'application_schedule': [
                    {'stage': 'Basal', 'dosage': n * 0.3, 'timing': 'At planting'},
                    {'stage': 'Active Growth', 'dosage': n * 0.4, 'timing': '30-45 days'},
                    {'stage': 'Reproductive', 'dosage': n * 0.3, 'timing': '60-75 days'}
                ]
            },
            'phosphorus': {
                'total_dosage': p,
                'application_schedule': [
                    {'stage': 'Basal', 'dosage': p, 'timing': 'At planting'}
                ]
            },
            'potassium': {
                'total_dosage': k,
                'application_schedule': [
                    {'stage': 'Basal', 'dosage': k * 0.5, 'timing': 'At planting'},
                    {'stage': 'Active Growth', 'dosage': k * 0.5, 'timing': '30-45 days'}
                ]
            }
        }
    
    def _get_pest_management(self, crop_info):
        """Get pest management recommendations"""
        disease_risk = crop_info['disease_risk']
        
        management = {
            'disease_risk_level': disease_risk,
            'preventive_measures': [
                'Use disease-resistant varieties',
                'Maintain proper spacing',
                'Monitor regularly for early detection'
            ],
            'common_pests': self._get_common_pests(crop_info),
            'treatment_schedule': [
                {'stage': 'Seed treatment', 'timing': 'Before sowing'},
                {'stage': 'Seedling', 'timing': '2-3 weeks after germination'},
                {'stage': 'Vegetative', 'timing': '4-6 weeks'},
                {'stage': 'Flowering', 'timing': 'At flowering stage'},
                {'stage': 'Fruit development', 'timing': 'As needed'}
            ]
        }
        
        if disease_risk == 'high':
            management['preventive_measures'].extend([
                'Apply prophylactic fungicides',
                'Increase monitoring frequency',
                'Use integrated pest management'
            ])
        
        return management
    
    def _get_common_pests(self, crop_info):
        """Get common pests for crop type"""
        crop_name = crop_info
        
        pest_map = {
            'Rice': ['Brown planthopper', 'Rice blast', 'Stem borer'],
            'Wheat': ['Aphids', 'Rust', 'Powdery mildew'],
            'Cotton': ['Bollworm', 'Whitefly', 'Aphids'],
            'Sugarcane': ['Borers', 'Whitefly', 'Red rot'],
            'Maize': ['Fall armyworm', 'Corn borer', 'Aflatoxin'],
            'Pulses': ['Pod borer', 'Aphids', 'Powdery mildew'],
            'Vegetables': ['Various insects', 'Fungal diseases', 'Nematodes']
        }
        
        return pest_map.get(crop_name, ['General pests', 'Fungal diseases', 'Nutrient deficiencies'])
    
    def _get_harvesting_timeline(self, crop_info):
        """Get harvesting timeline"""
        days_to_harvest = crop_info['days_to_harvest']
        
        return {
            'total_days': days_to_harvest,
            'harvesting_indicators': self._get_harvest_indicators(crop_info),
            'post_harvest_handling': self._get_post_harvest_handling(crop_info),
            'storage_requirements': self._get_storage_requirements(crop_info)
        }
    
    def _get_harvest_indicators(self, crop_info):
        """Get indicators for harvest readiness"""
        crop_name = crop_info
        
        indicators_map = {
            'Rice': ['Grain hardness', 'Moisture content < 20%', 'Golden color'],
            'Wheat': ['Straw color change', 'Grain hardness', 'Moisture < 14%'],
            'Cotton': ['Boll opening', 'Fiber maturity', 'Leaf drop'],
            'Maize': ['Kernel denting', 'Husk dryness', 'Cob maturity'],
            'Vegetables': ['Size and color', 'Firmness', 'Maturity indicators']
        }
        
        return indicators_map.get(crop_name, ['Visual maturity', 'Size development', 'Color change'])
    
    def _get_post_harvest_handling(self, crop_info):
        """Get post-harvest handling instructions"""
        return {
            'drying_method': 'Field drying for 2-3 days',
            'cleaning': 'Remove debris and foreign material',
            'grading': 'Sort by quality and size',
            'packaging': 'Use appropriate packaging material'
        }
    
    def _get_storage_requirements(self, crop_info):
        """Get storage requirements"""
        return {
            'temperature': 'Cool and dry conditions',
            'humidity': '< 12% moisture content',
            'pest_control': 'Regular monitoring',
            'storage_duration': '6-12 months depending on conditions'
        }
    
    def _get_risk_mitigation(self, crop_info, rainfall_data):
        """Get risk mitigation strategies"""
        strategies = []
        
        # Drought mitigation
        if crop_info['drought_tolerance'] in ['low', 'medium']:
            strategies.extend([
                'Install drip irrigation system',
                'Maintain soil moisture through mulching',
                'Choose drought-resistant varieties',
                'Implement water harvesting techniques'
            ])
        
        # Flood mitigation
        if crop_info['flood_tolerance'] in ['low', 'medium']:
            strategies.extend([
                'Ensure proper field drainage',
                'Create raised beds for waterlogging prevention',
                'Plant on higher ground if possible',
                'Have emergency drainage plan'
            ])
        
        # Disease mitigation
        if crop_info['disease_risk'] == 'high':
            strategies.extend([
                'Regular crop monitoring',
                'Use disease-resistant varieties',
                'Implement crop rotation',
                'Maintain proper plant spacing'
            ])
        
        return strategies
    
    def _get_market_opportunities(self, crop_info):
        """Get market opportunities for the crop"""
        return {
            'best_marketing_time': 'Post-harvest period',
            'price_trends': 'Monitor market prices regularly',
            'storage_strategy': 'Store until prices improve if possible',
            'value_addition': [
                'Processing opportunities',
                'Direct marketing to consumers',
                'Contract farming options',
                'Organic certification potential'
            ],
            'market_channels': [
                'Local markets',
                'Mandi markets',
                'Cooperative societies',
                'Direct contracts with companies'
            ]
        }

# Global instance
crop_system = None

def get_crop_system():
    """Get or create crop management system instance"""
    global crop_system
    if crop_system is None:
        crop_system = CropManagementSystem()
    return crop_system

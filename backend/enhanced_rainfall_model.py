# Enhanced rainfall prediction with multiple ML models
import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import pickle
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class EnhancedRainfallPredictor:
    def __init__(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.csv_path = os.path.join(base_dir, "Sub_Division_IMD_2017.csv")
        
        if not os.path.exists(self.csv_path):
            raise FileNotFoundError(
                f"Rainfall CSV not found at:\n  {self.csv_path}\n"
                "→ Please place 'Sub_Division_IMD_2017.csv' in the backend folder."
            )
        
        print(f"[EnhancedRainfallPredictor] Loading data from: {self.csv_path}")
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.subdivisions = []
        self._load_and_train()
    
    def _load_and_train(self):
        """Load data and train multiple models"""
        df = pd.read_csv(self.csv_path)
        
        # Clean data - remove rows with NA values in key columns
        required_cols = ["SUBDIVISION", "YEAR", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", 
                      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "ANNUAL"]
        
        if not all(col in df.columns for col in required_cols):
            missing = set(required_cols) - set(df.columns)
            raise ValueError(f"CSV missing required columns: {missing}")
        
        # Remove rows with NA in rainfall columns
        df_clean = df.dropna(subset=required_cols).copy()
        print(f"[EnhancedRainfallPredictor] Training on {len(df_clean)} complete rows")
        
        # Store unique subdivisions
        self.subdivisions = sorted(df_clean['SUBDIVISION'].unique())
        
        # Prepare features
        df_clean = self._create_features(df_clean)
        
        # Train models for each month and annual
        target_cols = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC","ANNUAL"]
        
        for target in target_cols:
            self._train_model_for_target(df_clean, target)
        
        print(f"[EnhancedRainfallPredictor] ✅ Trained {len(self.models)} models successfully")
    
    def _create_features(self, df):
        """Create enhanced features for better prediction"""
        df_features = df.copy()
        
        # Cyclical features for months
        df_features['YEAR_SIN'] = np.sin(2 * np.pi * df_features['YEAR'] / 10)
        df_features['YEAR_COS'] = np.cos(2 * np.pi * df_features['YEAR'] / 10)
        
        # Moving averages (trend features)
        df_features = df_features.sort_values(['SUBDIVISION', 'YEAR'])
        for target in ["ANNUAL"]:
            df_features[f'{target}_MA3'] = df_features.groupby('SUBDIVISION')[target].transform(
                lambda x: x.rolling(3, min_periods=1).mean()
            )
            df_features[f'{target}_MA5'] = df_features.groupby('SUBDIVISION')[target].transform(
                lambda x: x.rolling(5, min_periods=1).mean()
            )
        
        # Year-over-year change
        df_features = df_features.sort_values(['SUBDIVISION', 'YEAR'])
        for target in ["ANNUAL"]:
            df_features[f'{target}_YOY_CHANGE'] = df_features.groupby('SUBDIVISION')[target].transform(
                lambda x: x.pct_change()
            ).fillna(0)
        
        # Encode subdivision
        le = LabelEncoder()
        df_features['SUBDIVISION_ENCODED'] = le.fit_transform(df_features['SUBDIVISION'])
        self.encoders['SUBDIVISION'] = le
        
        return df_features
    
    def _train_model_for_target(self, df, target):
        """Train multiple models for a specific target"""
        # Feature columns
        feature_cols = ['SUBDIVISION_ENCODED', 'YEAR', 'YEAR_SIN', 'YEAR_COS', 
                     'ANNUAL_MA3', 'ANNUAL_MA5', 'ANNUAL_YOY_CHANGE']
        
        # Remove rows where target is NA
        df_target = df.dropna(subset=[target])
        
        X = df_target[feature_cols]
        y = df_target[target]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train multiple models
        models = {
            'linear': LinearRegression(),
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'gradient_boost': GradientBoostingRegressor(n_estimators=100, random_state=42)
        }
        
        best_model = None
        best_score = -np.inf
        
        for name, model in models.items():
            if name == 'linear':
                model.fit(X_train_scaled, y_train)
                pred = model.predict(X_test_scaled)
            else:
                model.fit(X_train, y_train)
                pred = model.predict(X_test)
            
            score = r2_score(y_test, pred)
            print(f"[EnhancedRainfallPredictor] {target} - {name}: R² = {score:.3f}")
            
            if score > best_score:
                best_score = score
                best_model = model
        
        # Store best model and scaler
        self.models[target] = best_model
        self.scalers[target] = scaler
        
        print(f"[EnhancedRainfallPredictor] {target}: Best model R² = {best_score:.3f}")
    
    def predict(self, subdivision: str, year: int) -> dict:
        """Predict rainfall for given subdivision and year"""
        if subdivision not in self.subdivisions:
            raise ValueError(f"Subdivision '{subdivision}' not found. Available: {self.subdivisions[:5]}...")
        
        # Create features for prediction
        features = self._create_prediction_features(subdivision, year)
        
        result = {}
        
        # Predict for each month and annual
        for target in ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC","ANNUAL"]:
            if target in self.models:
                # Prepare features
                feature_cols = ['SUBDIVISION_ENCODED', 'YEAR', 'YEAR_SIN', 'YEAR_COS', 
                             'ANNUAL_MA3', 'ANNUAL_MA5', 'ANNUAL_YOY_CHANGE']
                
                X = features[feature_cols]
                
                # Scale if needed
                if isinstance(self.models[target], (LinearRegression,)):
                    X_scaled = self.scalers[target].transform(X)
                    pred = self.models[target].predict(X_scaled)[0]
                else:
                    pred = self.models[target].predict(X)[0]
                
                result[target] = round(float(pred), 1)
            else:
                result[target] = 0.0
        
        # Add seasonal totals
        result["Jan-Feb"] = round(result["JAN"] + result["FEB"], 1)
        result["Mar-May"] = round(result["MAR"] + result["APR"] + result["MAY"], 1)
        result["Jun-Sep"] = round(result["JUN"] + result["JUL"] + result["AUG"] + result["SEP"], 1)
        result["Oct-Dec"] = round(result["OCT"] + result["NOV"] + result["DEC"], 1)
        
        # Add confidence and metadata
        result['_metadata'] = {
            'subdivision': subdivision,
            'year': year,
            'model_type': 'ensemble',
            'confidence': self._calculate_confidence(subdivision, year)
        }
        
        return result
    
    def _create_prediction_features(self, subdivision, year):
        """Create features for prediction"""
        # Get historical data for trend calculation
        df = pd.read_csv(self.csv_path)
        sub_data = df[df['SUBDIVISION'] == subdivision].sort_values('YEAR')
        
        # Calculate recent trends
        recent_years = sub_data.tail(10)
        annual_ma3 = recent_years['ANNUAL'].rolling(3).mean().iloc[-1] if len(recent_years) >= 3 else recent_years['ANNUAL'].mean()
        annual_ma5 = recent_years['ANNUAL'].rolling(5).mean().iloc[-1] if len(recent_years) >= 5 else recent_years['ANNUAL'].mean()
        
        # Year-over-year change
        if len(recent_years) >= 2:
            yoy_change = (recent_years['ANNUAL'].iloc[-1] - recent_years['ANNUAL'].iloc[-2]) / recent_years['ANNUAL'].iloc[-2]
        else:
            yoy_change = 0
        
        # Encode subdivision
        subdivision_encoded = self.encoders['SUBDIVISION'].transform([subdivision])[0]
        
        # Create feature dataframe
        features = pd.DataFrame({
            'SUBDIVISION_ENCODED': [subdivision_encoded],
            'YEAR': [year],
            'YEAR_SIN': [np.sin(2 * np.pi * year / 10)],
            'YEAR_COS': [np.cos(2 * np.pi * year / 10)],
            'ANNUAL_MA3': [annual_ma3],
            'ANNUAL_MA5': [annual_ma5],
            'ANNUAL_YOY_CHANGE': [yoy_change]
        })
        
        return features
    
    def _calculate_confidence(self, subdivision, year):
        """Calculate prediction confidence based on data availability and year range"""
        df = pd.read_csv(self.csv_path)
        sub_data = df[df['SUBDIVISION'] == subdivision]
        
        # Base confidence on data points
        data_confidence = min(len(sub_data) / 100, 1.0)
        
        # Reduce confidence for years far from training range
        max_year = sub_data['YEAR'].max()
        if year > max_year:
            year_diff = year - max_year
            year_confidence = max(0.5, 1.0 - (year_diff / 50))
        else:
            year_confidence = 1.0
        
        return round(data_confidence * year_confidence, 2)
    
    def get_subdivisions(self):
        """Get list of available subdivisions"""
        return self.subdivisions
    
    def get_model_info(self):
        """Get information about trained models"""
        return {
            'total_models': len(self.models),
            'subdivisions': len(self.subdivisions),
            'features': ['YEAR', 'SUBDIVISION', 'MOVING_AVERAGES', 'TRENDS', 'CYCLICAL'],
            'model_types': ['Linear Regression', 'Random Forest', 'Gradient Boosting']
        }

# Global instance
enhanced_predictor = None

def get_enhanced_predictor():
    """Get or create enhanced predictor instance"""
    global enhanced_predictor
    if enhanced_predictor is None:
        enhanced_predictor = EnhancedRainfallPredictor()
    return enhanced_predictor

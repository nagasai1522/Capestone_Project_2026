"""
Real Plant Disease Image Analysis Module
Processes uploaded images with strict validation
"""

import os
import json
import base64
import numpy as np
from PIL import Image
from io import BytesIO
from pathlib import Path

class DiseaseImageAnalyzer:
    def __init__(self, data_dir='data/disease'):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
    def decode_image(self, image_data):
        """Decode base64 image data"""
        try:
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            image_bytes = base64.b64decode(image_data)
            image = Image.open(BytesIO(image_bytes))
            return image
        except Exception as e:
            print(f"Error decoding image: {e}")
            return None
    
    def validate_image(self, image_data):
        """Strict validation to reject non-plant images"""
        try:
            image = self.decode_image(image_data)
            if not image:
                return False, "Invalid image format"
            
            width, height = image.size
            if width < 100 or height < 100:
                return False, "Image too small"
            
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            img_array = np.array(image.resize((224, 224)))
            mean_color = np.mean(img_array, axis=(0, 1))
            green_ratio = mean_color[1] / 255
            
            # STRICT: Must have 35%+ green
            if green_ratio < 0.35:
                return False, f"NOT A PLANT: Only {green_ratio:.1%} green color found (need 35%+). Upload a plant leaf photo."
            
            # STRICT: Green must be dominant
            if not (mean_color[1] > mean_color[0] and mean_color[1] > mean_color[2]):
                return False, "NOT A PLANT: Green not dominant color. Upload a plant leaf photo."
            
            # STRICT: Check for edges (screens/text have sharp edges)
            gray = np.mean(img_array, axis=2)
            grad_x = np.abs(np.diff(gray, axis=1))
            grad_y = np.abs(np.diff(gray, axis=0))
            edge_ratio = (np.sum(grad_x > 50) + np.sum(grad_y > 50)) / (gray.size * 2)
            
            if edge_ratio > 0.08:
                return False, "NOT A PLANT: Sharp edges detected (text/screens/objects). Upload a plant leaf photo."
            
            # STRICT: Color variation
            avg_std = np.mean(np.std(img_array, axis=(0, 1)))
            if avg_std < 25:
                return False, "NOT A PLANT: Image too uniform (artificial). Upload a plant leaf photo."
            
            # STRICT: Brightness check
            if np.mean(gray) / 255 > 0.85:
                return False, "NOT A PLANT: Too bright (likely screen). Upload a plant leaf photo."
            
            return True, "Valid plant image"
            
        except Exception as e:
            return False, f"Validation error: {str(e)}"
    
    def extract_features(self, image):
        """Extract features from image"""
        try:
            if image.mode != 'RGB':
                image = image.convert('RGB')
            image = image.resize((224, 224))
            img_array = np.array(image)
            
            mean_color = np.mean(img_array, axis=(0, 1))
            gray = np.mean(img_array, axis=2)
            
            return {
                'mean_r': float(mean_color[0]),
                'mean_g': float(mean_color[1]),
                'mean_b': float(mean_color[2]),
                'dark_spots': int(np.sum(gray < 80)),
                'total_pixels': 224 * 224
            }
        except:
            return None
    
    def analyze_image(self, image_data, crop_type):
        """Analyze image with strict validation first"""
        # VALIDATE FIRST
        is_valid, message = self.validate_image(image_data)
        if not is_valid:
            return {
                'error': message,
                'is_valid_image': False,
                'diseases': [],
                'recommendations': ['Upload a clear plant leaf photo']
            }
        
        image = self.decode_image(image_data)
        if not image:
            return {'error': 'Invalid image', 'is_valid_image': False}
        
        features = self.extract_features(image)
        if not features:
            return {'error': 'Feature extraction failed', 'is_valid_image': False}
        
        diseases = []
        dark_ratio = features['dark_spots'] / features['total_pixels']
        
        # HIGH green value indicates healthy leaf - check this FIRST
        # Green leaves typically have mean_g > 120
        if features['mean_g'] > 120 and features['mean_g'] > features['mean_r'] and features['mean_g'] > features['mean_b']:
            # Strong green dominant - likely healthy
            diseases.append({
                'name': 'Healthy',
                'confidence': min(98, int(features['mean_g'] * 0.8)),
                'severity': 'None'
            })
        elif dark_ratio > 0.12:  # Increased threshold from 0.05 to 0.12 (12% dark spots)
            # Only flag as disease if significant dark area AND not strongly green
            diseases.append({
                'name': 'Leaf Spot / Blight',
                'confidence': min(90, int(dark_ratio * 400)),
                'severity': 'High' if dark_ratio > 0.25 else 'Moderate'
            })
        elif not diseases and features['mean_g'] > 100:
            # Moderate green - likely healthy
            diseases.append({
                'name': 'Healthy',
                'confidence': 92,
                'severity': 'None'
            })
        
        # Generate recommendations based on disease detected
        recommendations = []
        preventive_measures = []
        
        if diseases and diseases[0]['name'] == 'Healthy':
            recommendations = [
                'Continue current care routine',
                'Monitor for any changes in leaf color',
                'Maintain optimal soil moisture'
            ]
            preventive_measures = [
                'Regular field inspections',
                'Proper nutrient management',
                'Integrated pest management'
            ]
        elif diseases:
            recommendations = [
                f'Apply appropriate treatment for {diseases[0]["name"]}',
                'Remove and destroy affected plant parts',
                'Improve air circulation around plants',
                'Monitor nearby plants for spread'
            ]
            preventive_measures = [
                'Practice crop rotation',
                'Use disease-resistant varieties',
                'Maintain proper spacing between plants',
                'Avoid overhead watering'
            ]
        
        return {
            'crop': crop_type,
            'diseases': diseases[:3],
            'is_valid_image': True,
            'recommendations': recommendations,
            'preventive_measures': preventive_measures,
            'image_features': features
        }

# Global instance
analyzer = DiseaseImageAnalyzer()

def analyze_image(image_data, crop_type):
    return analyzer.analyze_image(image_data, crop_type)

def validate_plant_image(image_data):
    return analyzer.validate_image(image_data)

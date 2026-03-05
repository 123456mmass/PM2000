#!/usr/bin/env python3
"""
Predictive Maintenance Module
ใช้ AI ในการทำนายการบำรุงรักษา
"""

from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os

# ตั้งค่า Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PredictiveMaintenance:
    """
    Predictive Maintenance Module
    ใช้ AI ในการทำนายการบำรุงรักษา
    """
    
    def __init__(self, model_path: str = "predictive_maintenance_model.pkl"):
        """
        Initialize Predictive Maintenance Module
        
        Args:
            model_path: Path to the trained model file
        """
        self.model_path = model_path
        self.model = self._load_model()
        self.scaler = StandardScaler()
        
    def _load_model(self):
        """
        Load the trained model from file
        
        Returns:
            Trained model or None if file not found
        """
        if os.path.exists(self.model_path):
            try:
                model = joblib.load(self.model_path)
                logger.info(f"Loaded predictive maintenance model from {self.model_path}")
                return model
            except Exception as e:
                logger.error(f"Error loading model: {e}")
                return None
        else:
            logger.info("No trained model found. Creating a new one.")
            return self._train_new_model()
    
    def _train_new_model(self):
        """
        Train a new model using sample data
        
        Returns:
            Trained model
        """
        # Sample data for training
        np.random.seed(42)
        n_samples = 1000
        
        # Features: V_LN_avg, I_avg, Freq, PF_Total, THDv_avg, THDi_avg
        X = np.random.rand(n_samples, 6)
        
        # Add some anomalies (5% of data)
        anomaly_indices = np.random.choice(n_samples, int(0.05 * n_samples), replace=False)
        X[anomaly_indices] += np.random.rand(*X[anomaly_indices].shape) * 5
        
        # Train Isolation Forest model
        model = IsolationForest(contamination=0.05, random_state=42)
        model.fit(X)
        
        # Save the model
        try:
            joblib.dump(model, self.model_path)
            logger.info(f"Saved new predictive maintenance model to {self.model_path}")
        except Exception as e:
            logger.error(f"Error saving model: {e}")
        
        return model
    
    def preprocess_data(self, data: Dict) -> Optional[np.ndarray]:
        """
        Preprocess the input data for prediction
        
        Args:
            data: Input data dictionary
            
        Returns:
            Preprocessed data as numpy array or None if error
        """
        try:
            # Extract relevant features
            features = [
                data.get("V_LN_avg", 0),
                data.get("I_avg", 0),
                data.get("Freq", 0),
                data.get("PF_Total", 0),
                np.mean([data.get("THDv_L1", 0), data.get("THDv_L2", 0), data.get("THDv_L3", 0)]),
                np.mean([data.get("THDi_L1", 0), data.get("THDi_L2", 0), data.get("THDi_L3", 0)])
            ]
            
            # Convert to numpy array and reshape
            features_array = np.array(features).reshape(1, -1)
            
            # Scale the features
            features_scaled = self.scaler.transform(features_array)
            
            return features_scaled
        except Exception as e:
            logger.error(f"Error preprocessing data: {e}")
            return None
    
    def predict_maintenance(self, data: Dict) -> Dict:
        """
        Predict maintenance needs based on input data
        
        Args:
            data: Input data dictionary
            
        Returns:
            Prediction result as dictionary
        """
        if self.model is None:
            return {
                "status": "error",
                "message": "Model not loaded",
                "maintenance_needed": False,
                "confidence": 0.0
            }
        
        # Preprocess the data
        processed_data = self.preprocess_data(data)
        if processed_data is None:
            return {
                "status": "error",
                "message": "Data preprocessing failed",
                "maintenance_needed": False,
                "confidence": 0.0
            }
        
        # Make prediction
        try:
            prediction = self.model.predict(processed_data)
            anomaly_score = self.model.decision_function(processed_data)
            
            # Prediction is -1 for anomalies (maintenance needed) and 1 for normal
            maintenance_needed = prediction[0] == -1
            confidence = float(np.abs(anomaly_score[0]))
            
            return {
                "status": "success",
                "maintenance_needed": bool(maintenance_needed),
                "confidence": confidence,
                "message": "Maintenance needed" if maintenance_needed else "No maintenance needed"
            }
        except Exception as e:
            logger.error(f"Error making prediction: {e}")
            return {
                "status": "error",
                "message": str(e),
                "maintenance_needed": False,
                "confidence": 0.0
            }
    
    def train_model(self, historical_data: List[Dict]):
        """
        Train the model using historical data
        
        Args:
            historical_data: List of historical data dictionaries
            
        Returns:
            Training result as dictionary
        """
        try:
            # Extract features from historical data
            features_list = []
            for data in historical_data:
                features = [
                    data.get("V_LN_avg", 0),
                    data.get("I_avg", 0),
                    data.get("Freq", 0),
                    data.get("PF_Total", 0),
                    np.mean([data.get("THDv_L1", 0), data.get("THDv_L2", 0), data.get("THDv_L3", 0)]),
                    np.mean([data.get("THDi_L1", 0), data.get("THDi_L2", 0), data.get("THDi_L3", 0)])
                ]
                features_list.append(features)
            
            # Convert to numpy array
            X = np.array(features_list)
            
            # Train Isolation Forest model
            model = IsolationForest(contamination=0.05, random_state=42)
            model.fit(X)
            
            # Save the model
            joblib.dump(model, self.model_path)
            logger.info(f"Trained and saved new predictive maintenance model to {self.model_path}")
            
            return {
                "status": "success",
                "message": "Model trained successfully",
                "samples_used": len(historical_data)
            }
        except Exception as e:
            logger.error(f"Error training model: {e}")
            return {
                "status": "error",
                "message": str(e)
            }

# Example usage
if __name__ == "__main__":
    # Initialize the predictive maintenance module
    pm = PredictiveMaintenance()
    
    # Example data
    example_data = {
        "V_LN_avg": 230.0,
        "I_avg": 10.0,
        "Freq": 50.0,
        "PF_Total": 0.95,
        "THDv_L1": 2.0,
        "THDv_L2": 2.1,
        "THDv_L3": 2.2,
        "THDi_L1": 5.0,
        "THDi_L2": 5.1,
        "THDi_L3": 5.2
    }
    
    # Make prediction
    result = pm.predict_maintenance(example_data)
    print("Prediction Result:", result)

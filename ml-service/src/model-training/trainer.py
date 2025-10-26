import tensorflow as tf
import torch
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import mlflow
import mlflow.tensorflow
import logging
import json
import os
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelTrainer:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        mlflow.set_tracking_uri(os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5000'))
        
    def train_recommendation_model(self, user_data, product_data, interactions):
        """Train product recommendation model"""
        logger.info("Training recommendation model...")
        
        # Feature engineering
        user_features = self._extract_user_features(user_data)
        product_features = self._extract_product_features(product_data)
        interaction_features = self._extract_interaction_features(interactions)
        
        # Prepare training data
        X, y = self._prepare_training_data(user_features, product_features, interaction_features)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        self.scalers['recommendation'] = scaler
        
        # Build model
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(128, activation='relu', input_shape=(X_train_scaled.shape[1],)),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])
        
        model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy', 'precision', 'recall']
        )
        
        # Start MLflow run
        with mlflow.start_run(run_name="recommendation_model"):
            # Train model
            history = model.fit(
                X_train_scaled, y_train,
                epochs=50,
                batch_size=32,
                validation_data=(X_test_scaled, y_test),
                verbose=1
            )
            
            # Log metrics
            test_loss, test_accuracy, test_precision, test_recall = model.evaluate(X_test_scaled, y_test)
            mlflow.log_metrics({
                'test_accuracy': test_accuracy,
                'test_precision': test_precision,
                'test_recall': test_recall,
                'test_loss': test_loss
            })
            
            # Log model
            mlflow.tensorflow.log_model(model, "recommendation_model")
            
            # Log parameters
            mlflow.log_params({
                'epochs': 50,
                'batch_size': 32,
                'optimizer': 'adam'
            })
        
        self.models['recommendation'] = model
        logger.info("Recommendation model training completed")
        
        return {
            'model_id': 'recommendation_model',
            'performance': {
                'accuracy': test_accuracy,
                'precision': test_precision,
                'recall': test_recall,
                'loss': test_loss
            },
            'training_history': history.history
        }
    
    def train_fraud_detection_model(self, transaction_data):
        """Train fraud detection model"""
        logger.info("Training fraud detection model...")
        
        # Prepare features
        X = self._extract_transaction_features(transaction_data)
        y = transaction_data['is_fraud'].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        # Handle class imbalance
        from imblearn.over_sampling import SMOTE
        smote = SMOTE(random_state=42)
        X_train_balanced, y_train_balanced = smote.fit_resample(X_train, y_train)
        
        # Build model
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(64, activation='relu', input_shape=(X_train_balanced.shape[1],)),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(16, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])
        
        model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy', 'precision', 'recall', 'auc']
        )
        
        # Train model
        history = model.fit(
            X_train_balanced, y_train_balanced,
            epochs=100,
            batch_size=32,
            validation_data=(X_test, y_test),
            class_weight={0: 1, 1: 10},  # Higher weight for fraud class
            verbose=1
        )
        
        self.models['fraud_detection'] = model
        logger.info("Fraud detection model training completed")
        
        return {
            'model_id': 'fraud_detection',
            'performance': history.history
        }
    
    def _extract_user_features(self, user_data):
        """Extract features from user data"""
        # Implementation for user feature extraction
        return np.random.rand(len(user_data), 10)  # Placeholder
    
    def _extract_product_features(self, product_data):
        """Extract features from product data"""
        # Implementation for product feature extraction
        return np.random.rand(len(product_data), 15)  # Placeholder
    
    def _extract_interaction_features(self, interactions):
        """Extract features from user-product interactions"""
        # Implementation for interaction feature extraction
        return np.random.rand(len(interactions), 8)  # Placeholder
    
    def _extract_transaction_features(self, transaction_data):
        """Extract features from transaction data"""
        # Implementation for transaction feature extraction
        return np.random.rand(len(transaction_data), 12)  # Placeholder
    
    def _prepare_training_data(self, user_features, product_features, interaction_features):
        """Prepare training data for recommendation model"""
        # Implementation for training data preparation
        X = np.random.rand(1000, 20)  # Placeholder
        y = np.random.randint(0, 2, 1000)  # Placeholder
        return X, y

# Feature Engineering Class
class FeatureEngineer:
    def __init__(self):
        self.feature_config = {}
    
    def engineer_user_features(self, user_data):
        """Engineer features from user data"""
        features = {}
        
        # Demographic features
        features['age_group'] = self._categorize_age(user_data.get('age'))
        features['location_score'] = self._calculate_location_score(user_data.get('location'))
        
        # Behavioral features
        features['purchase_frequency'] = user_data.get('purchase_frequency', 0)
        features['avg_order_value'] = user_data.get('avg_order_value', 0)
        features['preferred_categories'] = user_data.get('preferred_categories', [])
        
        return features
    
    def engineer_product_features(self, product_data):
        """Engineer features from product data"""
        features = {}
        
        # Product characteristics
        features['price_tier'] = self._categorize_price(product_data.get('price', 0))
        features['category_encoding'] = self._encode_category(product_data.get('category'))
        features['popularity_score'] = product_data.get('popularity', 0)
        
        # Temporal features
        features['seasonality'] = self._calculate_seasonality(product_data.get('category'))
        
        return features
    
    def _categorize_age(self, age):
        """Categorize age into groups"""
        if age < 25:
            return 'young'
        elif age < 45:
            return 'adult'
        else:
            return 'senior'
    
    def _categorize_price(self, price):
        """Categorize price into tiers"""
        if price < 50:
            return 'budget'
        elif price < 200:
            return 'mid-range'
        else:
            return 'premium'
    
    def _encode_category(self, category):
        """Encode product category"""
        category_mapping = {
            'electronics': 1,
            'clothing': 2,
            'home': 3,
            'beauty': 4,
            'sports': 5
        }
        return category_mapping.get(category, 0)
    
    def _calculate_location_score(self, location):
        """Calculate location-based score"""
        # Simplified implementation
        return hash(location) % 100 if location else 50
    
    def _calculate_seasonality(self, category):
        """Calculate seasonality score for product category"""
        season_mapping = {
            'clothing': 0.8,
            'electronics': 0.3,
            'home': 0.5,
            'beauty': 0.6,
            'sports': 0.7
        }
        return season_mapping.get(category, 0.5)

if __name__ == "__main__":
    trainer = ModelTrainer()
    
    # Example training
    user_data = [{'age': 25, 'location': 'NYC', 'purchase_frequency': 5}]
    product_data = [{'price': 100, 'category': 'electronics', 'popularity': 80}]
    interactions = [{'user_id': 1, 'product_id': 1, 'interaction_type': 'purchase'}]
    
    result = trainer.train_recommendation_model(user_data, product_data, interactions)
    print("Training completed:", result)

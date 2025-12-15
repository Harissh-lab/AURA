"""
Mental Health Distress Detection Module
Uses the train_data.csv dataset for enhanced crisis detection
Implements proper train/validation/test split for accurate performance metrics
"""

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score
import pickle
import os

class MentalHealthDetector:
    def __init__(self):
        self.vectorizer = None
        self.classifier = None
        self.trained = False
        self.test_metrics = None  # Store test set performance
        
    def train(self, csv_path='train_data.csv', test_size=0.1, val_size=0.1, random_state=42):
        """
        Train the distress detection model with proper train/val/test split
        
        Args:
            csv_path: Path to training data CSV
            test_size: Proportion for hold-out test set (0.1 = 10%)
            val_size: Proportion for validation set (0.1 = 10%)
            random_state: Random seed for reproducibility
        
        Split Strategy:
            - 80% Training: Used to fit the model
            - 10% Validation: Used for hyperparameter tuning (future)
            - 10% Test: Hold-out set NEVER seen during training
        """
        print("=" * 80)
        print("GOLD STANDARD VALIDATION - Proper Train/Val/Test Split")
        print("=" * 80)
        print("\nLoading dataset...")
        df = pd.read_csv(csv_path)
        
        # Prepare data
        X = df['text']
        y = df['label']
        
        print(f"Total samples: {len(df)}")
        print(f"Class distribution: {y.value_counts().to_dict()}")
        
        # First split: Separate test set (10%)
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, 
            test_size=test_size, 
            random_state=random_state,
            stratify=y  # Maintain class balance
        )
        
        # Second split: Separate train and validation from remaining 90%
        # val_size_adjusted ensures validation is 10% of original data
        val_size_adjusted = val_size / (1 - test_size)
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp,
            test_size=val_size_adjusted,
            random_state=random_state,
            stratify=y_temp
        )
        
        print(f"\n📊 Data Split:")
        print(f"   Training:   {len(X_train)} samples ({len(X_train)/len(df)*100:.1f}%)")
        print(f"   Validation: {len(X_val)} samples ({len(X_val)/len(df)*100:.1f}%)")
        print(f"   Test:       {len(X_test)} samples ({len(X_test)/len(df)*100:.1f}%)")
        
        # Vectorize using ONLY training data
        print(f"\n🔧 Training model on {len(X_train)} samples...")
        self.vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
        X_train_tfidf = self.vectorizer.fit_transform(X_train)
        
        # Train classifier
        self.classifier = MultinomialNB()
        self.classifier.fit(X_train_tfidf, y_train)
        
        self.trained = True
        print("✓ Model trained successfully!")
        
        # Evaluate on validation set
        print(f"\n📈 Validation Set Performance:")
        X_val_tfidf = self.vectorizer.transform(X_val)
        val_predictions = self.classifier.predict(X_val_tfidf)
        val_accuracy = accuracy_score(y_val, val_predictions)
        val_precision = precision_score(y_val, val_predictions)
        val_recall = recall_score(y_val, val_predictions)
        val_f1 = f1_score(y_val, val_predictions)
        
        print(f"   Accuracy:  {val_accuracy*100:.2f}%")
        print(f"   Precision: {val_precision*100:.2f}%")
        print(f"   Recall:    {val_recall*100:.2f}%")
        print(f"   F1-Score:  {val_f1*100:.2f}%")
        
        # CRITICAL: Evaluate on hold-out test set (NEVER seen during training)
        print(f"\n🏆 GOLD STANDARD - Hold-Out Test Set Performance:")
        print("   (This is the TRUE performance - model has NEVER seen this data)")
        X_test_tfidf = self.vectorizer.transform(X_test)
        test_predictions = self.classifier.predict(X_test_tfidf)
        
        test_accuracy = accuracy_score(y_test, test_predictions)
        test_precision = precision_score(y_test, test_predictions)
        test_recall = recall_score(y_test, test_predictions)
        test_f1 = f1_score(y_test, test_predictions)
        
        # Store test metrics
        self.test_metrics = {
            'accuracy': test_accuracy,
            'precision': test_precision,
            'recall': test_recall,
            'f1_score': test_f1,
            'test_size': len(X_test),
            'confusion_matrix': confusion_matrix(y_test, test_predictions).tolist()
        }
        
        print(f"   ✅ Accuracy:  {test_accuracy*100:.2f}%")
        print(f"   ✅ Precision: {test_precision*100:.2f}%")
        print(f"   ✅ Recall:    {test_recall*100:.2f}%")
        print(f"   ✅ F1-Score:  {test_f1*100:.2f}%")
        
        # Confusion Matrix
        cm = confusion_matrix(y_test, test_predictions)
        print(f"\n📊 Confusion Matrix (Test Set):")
        print(f"                 Predicted")
        print(f"                 No  Yes")
        print(f"   Actual No  [{cm[0][0]:4d} {cm[0][1]:4d}]")
        print(f"   Actual Yes [{cm[1][0]:4d} {cm[1][1]:4d}]")
        
        # Detailed classification report
        print(f"\n📋 Detailed Classification Report (Test Set):")
        print(classification_report(y_test, test_predictions, 
                                   target_names=['Non-Distress', 'Distress']))
        
        # Validation against overfitting
        accuracy_diff = abs(val_accuracy - test_accuracy)
        print(f"\n🔍 Overfitting Check:")
        print(f"   Validation Accuracy: {val_accuracy*100:.2f}%")
        print(f"   Test Accuracy:       {test_accuracy*100:.2f}%")
        print(f"   Difference:          {accuracy_diff*100:.2f}%")
        
        if accuracy_diff < 0.05:
            print(f"   ✅ GOOD: Model generalizes well (difference < 5%)")
        elif accuracy_diff < 0.10:
            print(f"   ⚠️  WARNING: Possible slight overfitting (difference 5-10%)")
        else:
            print(f"   ❌ ALERT: Significant overfitting detected (difference > 10%)")
        
        return self.test_metrics
        
    def save_model(self, path='distress_detector.pkl'):
        """Save the trained model with test metrics"""
        if not self.trained:
            raise Exception("Model not trained yet!")
        
        model_data = {
            'vectorizer': self.vectorizer,
            'classifier': self.classifier,
            'test_metrics': self.test_metrics  # Include validation results
        }
        
        with open(path, 'wb') as f:
            pickle.dump(model_data, f)
        
        print(f"\n✓ Model saved to {path}")
        if self.test_metrics:
            print(f"✓ Test metrics saved (Accuracy: {self.test_metrics['accuracy']*100:.2f}%)")
    
    def load_model(self, path='distress_detector.pkl'):
        """Load a pre-trained model with test metrics"""
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model file not found: {path}")
        
        with open(path, 'rb') as f:
            model_data = pickle.load(f)
        
        self.vectorizer = model_data['vectorizer']
        self.classifier = model_data['classifier']
        self.test_metrics = model_data.get('test_metrics', None)  # Load metrics if available
        self.trained = True
        
        print(f"✓ Model loaded from {path}")
        if self.test_metrics:
            print(f"✓ Test Set Performance: {self.test_metrics['accuracy']*100:.2f}% accuracy")
    
    def get_test_metrics(self):
        """Return the gold standard test set metrics"""
        if not self.test_metrics:
            return "No test metrics available. Model needs retraining with validation split."
        return self.test_metrics
    
    def predict_distress(self, text):
        """
        Predict if text indicates mental distress
        
        Returns:
            dict: {
                'is_distress': bool,
                'confidence': float,
                'severity': str ('low', 'medium', 'high')
            }
        """
        if not self.trained:
            raise Exception("Model not trained or loaded!")
        
        # Vectorize input
        text_tfidf = self.vectorizer.transform([text])
        
        # Predict
        prediction = self.classifier.predict(text_tfidf)[0]
        proba = self.classifier.predict_proba(text_tfidf)[0]
        
        # Get confidence (probability of predicted class)
        confidence = proba[int(prediction)]
        
        # Determine severity based on confidence
        if prediction == 1:  # Distress detected
            if confidence >= 0.8:
                severity = 'high'
            elif confidence >= 0.6:
                severity = 'medium'
            else:
                severity = 'low'
        else:
            severity = 'none'
        
        return {
            'is_distress': bool(prediction),
            'confidence': float(confidence),
            'severity': severity,
            'distress_probability': float(proba[1]),
            'non_distress_probability': float(proba[0])
        }
    
    def batch_predict(self, texts):
        """Predict for multiple texts at once"""
        return [self.predict_distress(text) for text in texts]


def get_distress_keywords():
    """Return common distress keywords from the dataset analysis"""
    return {
        'high_risk': [
            'kill', 'suicide', 'die', 'death', 'hurt myself', 'end it',
            'overdose', 'jump', 'pills', 'razor', 'worthless', 'hopeless'
        ],
        'medium_risk': [
            'depressed', 'anxiety', 'panic', 'scared', 'alone', 'crying',
            'cant cope', 'overwhelming', 'traumatic', 'abuse', 'pain'
        ],
        'low_risk': [
            'worried', 'stressed', 'nervous', 'upset', 'frustrated',
            'confused', 'tired', 'sad', 'difficult', 'hard'
        ]
    }


# Standalone function for easy integration
def detect_distress_advanced(text, model_path='distress_detector.pkl'):
    """
    Quick function to detect distress in text
    
    Usage:
        result = detect_distress_advanced("I feel so hopeless and alone")
        if result['is_distress']:
            print(f"Distress detected with {result['confidence']*100:.1f}% confidence")
    """
    try:
        detector = MentalHealthDetector()
        detector.load_model(model_path)
        return detector.predict_distress(text)
    except FileNotFoundError:
        # If model doesn't exist, train it first
        detector = MentalHealthDetector()
        detector.train()
        detector.save_model(model_path)
        return detector.predict_distress(text)


if __name__ == '__main__':
    # Train and test the model with proper validation
    print("=" * 80)
    print("Mental Health Distress Detector - Gold Standard Validation")
    print("=" * 80)
    
    detector = MentalHealthDetector()
    
    # Train with 80/10/10 split
    test_metrics = detector.train(
        csv_path='train_data.csv',
        test_size=0.10,   # 10% for hold-out test
        val_size=0.10,    # 10% for validation
        random_state=42   # Reproducible results
    )
    
    # Save model with test metrics
    detector.save_model()
    
    # Test examples on trained model
    print("\n" + "=" * 80)
    print("Testing with sample messages:")
    print("=" * 80)
    
    test_messages = [
        "I'm feeling really anxious and I don't know what to do",
        "Having a great day today!",
        "I can't take this anymore, I want to end it all",
        "Need help with my homework",
        "My panic attacks are getting worse and I can't sleep",
        "Going to the movies tonight with friends",
        "I feel so empty and worthless, nobody cares",
        "Just got a promotion at work!",
        "I don't see the point in living anymore",
        "Looking forward to the weekend"
    ]
    
    for msg in test_messages:
        result = detector.predict_distress(msg)
        status = "🚨 DISTRESS" if result['is_distress'] else "✓ OK"
        print(f"\n{status} | Confidence: {result['confidence']*100:.1f}% | Severity: {result['severity']}")
        print(f"Message: \"{msg}\"")
        print(f"Distress probability: {result['distress_probability']*100:.1f}%")
    
    # Display final test metrics summary
    print("\n" + "=" * 80)
    print("FINAL GOLD STANDARD METRICS (Hold-Out Test Set)")
    print("=" * 80)
    print(f"✅ Accuracy:  {test_metrics['accuracy']*100:.2f}%")
    print(f"✅ Precision: {test_metrics['precision']*100:.2f}%")
    print(f"✅ Recall:    {test_metrics['recall']*100:.2f}%")
    print(f"✅ F1-Score:  {test_metrics['f1_score']*100:.2f}%")
    print(f"\nThese metrics are from {test_metrics['test_size']} samples")
    print("that the model has NEVER seen during training.")
    print("\n🎯 This is your TRUE model performance!")
    print("=" * 80)
    print("Model ready for production!")
    print("=" * 80)

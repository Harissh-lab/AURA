"""
Enhanced Mental Health Distress Detection Module - Version 2
Leverages psychological features (LIWC), social features, and sentiment analysis
Target: 75-80% accuracy (up from 67% baseline)
"""

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score
import pickle
import os
import warnings
warnings.filterwarnings('ignore')

class EnhancedMentalHealthDetector:
    """
    Enhanced distress detector using:
    1. TF-IDF text features (baseline)
    2. LIWC psychological features (anxiety, negative emotion, death mentions, etc.)
    3. Social engagement features (karma, comments, upvote ratio)
    4. Sentiment analysis features
    5. Ensemble model (RandomForest + Logistic Regression)
    """
    
    def __init__(self, model_type='random_forest'):
        """
        Args:
            model_type: 'random_forest', 'logistic', or 'ensemble'
        """
        self.vectorizer = None
        self.scaler = None
        self.classifier = None
        self.model_type = model_type
        self.trained = False
        self.test_metrics = None
        self.feature_importance = None
        
        # Key LIWC features for mental health distress
        self.liwc_features = [
            'lex_liwc_negemo',      # Negative emotions (strong predictor)
            'lex_liwc_anx',         # Anxiety words
            'lex_liwc_anger',       # Anger words
            'lex_liwc_sad',         # Sadness words
            'lex_liwc_death',       # Death-related words
            'lex_liwc_i',           # First-person singular (self-focus)
            'lex_liwc_Tone',        # Emotional tone
            'lex_liwc_Authentic',   # Authenticity score
            'lex_liwc_affect',      # Overall affect
            'lex_liwc_posemo',      # Positive emotions (inverse predictor)
            'lex_liwc_social',      # Social processes
            'lex_liwc_focuspast',   # Past focus (rumination)
            'lex_liwc_cogproc',     # Cognitive processes
            'lex_liwc_discrep',     # Discrepancy words (should/would)
            'lex_liwc_tentat',      # Tentative language (maybe/perhaps)
        ]
        
        # Social engagement features
        self.social_features = [
            'social_karma',
            'social_num_comments',
            'social_upvote_ratio'
        ]
        
        # Sentiment feature
        self.sentiment_features = ['sentiment']
        
    def extract_features(self, df, fit_vectorizer=False):
        """Extract and combine all feature types"""
        
        # 1. TF-IDF text features (primary signal)
        if fit_vectorizer:
            self.vectorizer = TfidfVectorizer(
                max_features=3000,  # Reduced from 5000 to avoid overfitting
                min_df=2,           # Ignore rare words
                max_df=0.8,         # Ignore very common words
                stop_words='english',
                ngram_range=(1, 2)  # Include bigrams for context
            )
            text_features = self.vectorizer.fit_transform(df['text']).toarray()
        else:
            text_features = self.vectorizer.transform(df['text']).toarray()
        
        # 2. LIWC psychological features
        liwc_data = df[self.liwc_features].fillna(0).values
        
        # 3. Social engagement features (normalized)
        social_data = df[self.social_features].fillna(0).values
        
        # 4. Sentiment features
        sentiment_data = df[self.sentiment_features].fillna(0).values
        
        # Combine all features
        combined_features = np.hstack([
            text_features,      # TF-IDF (3000 features)
            liwc_data,          # LIWC (15 features)
            social_data,        # Social (3 features)
            sentiment_data      # Sentiment (1 feature)
        ])
        
        return combined_features
    
    def train(self, csv_path='train_data.csv', test_size=0.1, val_size=0.1, random_state=42):
        """
        Train enhanced model with feature engineering
        """
        print("=" * 80)
        print("ENHANCED ML MODEL - Feature Engineering + Advanced Classifier")
        print("=" * 80)
        print("\nLoading dataset...")
        df = pd.read_csv(csv_path)
        
        # Check for required columns
        missing_features = []
        for feat in self.liwc_features + self.social_features + self.sentiment_features:
            if feat not in df.columns:
                missing_features.append(feat)
        
        if missing_features:
            print(f"⚠️  Warning: Missing features: {missing_features[:5]}...")
            print("   Using available features only.")
            # Filter to available features
            self.liwc_features = [f for f in self.liwc_features if f in df.columns]
            self.social_features = [f for f in self.social_features if f in df.columns]
            self.sentiment_features = [f for f in self.sentiment_features if f in df.columns]
        
        print(f"\n📊 Feature Groups:")
        print(f"   Text features:      3000 (TF-IDF with bigrams)")
        print(f"   LIWC features:      {len(self.liwc_features)} (psychological)")
        print(f"   Social features:    {len(self.social_features)} (engagement)")
        print(f"   Sentiment features: {len(self.sentiment_features)}")
        print(f"   TOTAL:              {3000 + len(self.liwc_features) + len(self.social_features) + len(self.sentiment_features)}")
        
        # Prepare labels
        y = df['label']
        
        print(f"\nTotal samples: {len(df)}")
        print(f"Class distribution: Distress={sum(y==1)} ({sum(y==1)/len(y)*100:.1f}%), Non-Distress={sum(y==0)} ({sum(y==0)/len(y)*100:.1f}%)")
        
        # Train/Val/Test split
        X_temp, X_test_df, y_temp, y_test = train_test_split(
            df, y, 
            test_size=test_size, 
            random_state=random_state,
            stratify=y
        )
        
        val_size_adjusted = val_size / (1 - test_size)
        X_train_df, X_val_df, y_train, y_val = train_test_split(
            X_temp, y_temp,
            test_size=val_size_adjusted,
            random_state=random_state,
            stratify=y_temp
        )
        
        print(f"\n📊 Data Split:")
        print(f"   Training:   {len(X_train_df)} samples ({len(X_train_df)/len(df)*100:.1f}%)")
        print(f"   Validation: {len(X_val_df)} samples ({len(X_val_df)/len(df)*100:.1f}%)")
        print(f"   Test:       {len(X_test_df)} samples ({len(X_test_df)/len(df)*100:.1f}%)")
        
        # Extract features
        print(f"\n🔧 Extracting features from training data...")
        X_train = self.extract_features(X_train_df, fit_vectorizer=True)
        
        # Scale numerical features (LIWC, social, sentiment)
        print("🔧 Scaling numerical features...")
        self.scaler = StandardScaler()
        # Only scale non-text features (last 19 columns)
        text_feat_count = 3000
        X_train[:, text_feat_count:] = self.scaler.fit_transform(X_train[:, text_feat_count:])
        
        # Train classifier
        print(f"\n🔧 Training {self.model_type} model...")
        if self.model_type == 'random_forest':
            self.classifier = RandomForestClassifier(
                n_estimators=200,       # More trees for stability
                max_depth=20,           # Prevent overfitting
                min_samples_split=5,    # Require minimum samples to split
                min_samples_leaf=2,     # Require minimum samples in leaf
                max_features='sqrt',    # Use sqrt(n_features) per tree
                class_weight='balanced', # Handle class imbalance
                random_state=random_state,
                n_jobs=-1               # Use all CPU cores
            )
        elif self.model_type == 'logistic':
            self.classifier = LogisticRegression(
                max_iter=1000,
                class_weight='balanced',
                C=0.1,  # Strong regularization
                random_state=random_state,
                n_jobs=-1
            )
        else:
            raise ValueError(f"Unknown model_type: {self.model_type}")
        
        self.classifier.fit(X_train, y_train)
        self.trained = True
        print("✓ Model trained successfully!")
        
        # Feature importance (for RandomForest)
        if self.model_type == 'random_forest':
            feature_names = (
                [f'tfidf_{i}' for i in range(3000)] +
                self.liwc_features +
                self.social_features +
                self.sentiment_features
            )
            importances = self.classifier.feature_importances_
            self.feature_importance = sorted(
                zip(feature_names, importances),
                key=lambda x: x[1],
                reverse=True
            )[:20]  # Top 20
            
            print("\n🔍 Top 10 Most Important Features:")
            for i, (feat, imp) in enumerate(self.feature_importance[:10], 1):
                print(f"   {i:2d}. {feat:30s} {imp:.4f}")
        
        # Validation set evaluation
        print(f"\n📈 Validation Set Performance:")
        X_val = self.extract_features(X_val_df, fit_vectorizer=False)
        X_val[:, text_feat_count:] = self.scaler.transform(X_val[:, text_feat_count:])
        
        val_predictions = self.classifier.predict(X_val)
        val_proba = self.classifier.predict_proba(X_val)[:, 1]
        
        val_accuracy = accuracy_score(y_val, val_predictions)
        val_precision = precision_score(y_val, val_predictions)
        val_recall = recall_score(y_val, val_predictions)
        val_f1 = f1_score(y_val, val_predictions)
        
        print(f"   Accuracy:  {val_accuracy*100:.2f}%")
        print(f"   Precision: {val_precision*100:.2f}%")
        print(f"   Recall:    {val_recall*100:.2f}%")
        print(f"   F1-Score:  {val_f1*100:.2f}%")
        
        # Test set evaluation (GOLD STANDARD)
        print(f"\n🏆 GOLD STANDARD - Hold-Out Test Set Performance:")
        print("   (This is the TRUE performance - model has NEVER seen this data)")
        
        X_test = self.extract_features(X_test_df, fit_vectorizer=False)
        X_test[:, text_feat_count:] = self.scaler.transform(X_test[:, text_feat_count:])
        
        test_predictions = self.classifier.predict(X_test)
        test_proba = self.classifier.predict_proba(X_test)[:, 1]
        
        test_accuracy = accuracy_score(y_test, test_predictions)
        test_precision = precision_score(y_test, test_predictions)
        test_recall = recall_score(y_test, test_predictions)
        test_f1 = f1_score(y_test, test_predictions)
        
        self.test_metrics = {
            'accuracy': test_accuracy,
            'precision': test_precision,
            'recall': test_recall,
            'f1_score': test_f1,
            'test_size': len(X_test_df),
            'confusion_matrix': confusion_matrix(y_test, test_predictions).tolist(),
            'val_accuracy': val_accuracy,
            'feature_count': X_train.shape[1],
            'model_type': self.model_type
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
        
        print(f"\n📋 Detailed Classification Report (Test Set):")
        print(classification_report(y_test, test_predictions, 
                                   target_names=['Non-Distress', 'Distress']))
        
        # Performance improvement
        baseline_accuracy = 0.6696  # From v1
        improvement = (test_accuracy - baseline_accuracy) * 100
        print(f"\n🎯 Performance vs Baseline (v1):")
        print(f"   Baseline (TF-IDF + NB):     66.96%")
        print(f"   Enhanced (Features + {self.model_type.upper()}): {test_accuracy*100:.2f}%")
        print(f"   Improvement:                {improvement:+.2f} percentage points")
        
        if test_accuracy >= 0.75:
            print(f"   ✅ TARGET ACHIEVED: {test_accuracy*100:.2f}% >= 75% goal!")
        else:
            print(f"   ⚠️  Below target: {test_accuracy*100:.2f}% < 75% goal")
        
        # Overfitting check
        accuracy_diff = abs(val_accuracy - test_accuracy)
        print(f"\n🔍 Overfitting Check:")
        print(f"   Validation Accuracy: {val_accuracy*100:.2f}%")
        print(f"   Test Accuracy:       {test_accuracy*100:.2f}%")
        print(f"   Difference:          {accuracy_diff*100:.2f}%")
        
        if accuracy_diff < 0.03:
            print(f"   ✅ EXCELLENT: Model generalizes very well (difference < 3%)")
        elif accuracy_diff < 0.05:
            print(f"   ✅ GOOD: Model generalizes well (difference < 5%)")
        else:
            print(f"   ⚠️  WARNING: Check for overfitting (difference >= 5%)")
        
        return self.test_metrics
    
    def save_model(self, path='distress_detector_v2.pkl'):
        """Save enhanced model"""
        if not self.trained:
            raise Exception("Model not trained yet!")
        
        model_data = {
            'vectorizer': self.vectorizer,
            'scaler': self.scaler,
            'classifier': self.classifier,
            'model_type': self.model_type,
            'liwc_features': self.liwc_features,
            'social_features': self.social_features,
            'sentiment_features': self.sentiment_features,
            'test_metrics': self.test_metrics,
            'feature_importance': self.feature_importance
        }
        
        with open(path, 'wb') as f:
            pickle.dump(model_data, f)
        
        print(f"\n✓ Enhanced model saved to {path}")
        if self.test_metrics:
            print(f"✓ Test accuracy: {self.test_metrics['accuracy']*100:.2f}%")
    
    def load_model(self, path='distress_detector_v2.pkl'):
        """Load enhanced model"""
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model file not found: {path}")
        
        with open(path, 'rb') as f:
            model_data = pickle.load(f)
        
        self.vectorizer = model_data['vectorizer']
        self.scaler = model_data['scaler']
        self.classifier = model_data['classifier']
        self.model_type = model_data['model_type']
        self.liwc_features = model_data['liwc_features']
        self.social_features = model_data['social_features']
        self.sentiment_features = model_data['sentiment_features']
        self.test_metrics = model_data.get('test_metrics', None)
        self.feature_importance = model_data.get('feature_importance', None)
        self.trained = True
        
        print(f"✓ Enhanced model loaded from {path}")
        if self.test_metrics:
            print(f"✓ Test accuracy: {self.test_metrics['accuracy']*100:.2f}%")
    
    def predict_distress(self, text, liwc_features=None, social_features=None, sentiment=None):
        """
        Predict distress with enhanced features
        
        Args:
            text: Input text
            liwc_features: Dict of LIWC features (optional, will use defaults if missing)
            social_features: Dict of social features (optional, will use defaults if missing)
            sentiment: Sentiment score (optional, will use default if missing)
        
        Returns:
            dict with 'is_distress', 'confidence', 'probability'
        """
        if not self.trained:
            raise Exception("Model not trained yet!")
        
        # Create dataframe for feature extraction
        df = pd.DataFrame({
            'text': [text]
        })
        
        # Add LIWC features (use defaults if not provided)
        for feat in self.liwc_features:
            if liwc_features and feat in liwc_features:
                df[feat] = [liwc_features[feat]]
            else:
                df[feat] = [0.0]  # Default
        
        # Add social features
        for feat in self.social_features:
            if social_features and feat in social_features:
                df[feat] = [social_features[feat]]
            else:
                df[feat] = [0.0]  # Default
        
        # Add sentiment
        for feat in self.sentiment_features:
            if sentiment is not None:
                df[feat] = [sentiment]
            else:
                df[feat] = [0.0]  # Default
        
        # Extract and scale features
        features = self.extract_features(df, fit_vectorizer=False)
        text_feat_count = 3000
        features[:, text_feat_count:] = self.scaler.transform(features[:, text_feat_count:])
        
        # Predict
        prediction = self.classifier.predict(features)[0]
        probability = self.classifier.predict_proba(features)[0]
        
        return {
            'is_distress': bool(prediction),
            'confidence': float(max(probability)),
            'probability': float(probability[1]),  # Probability of distress
            'requires_crisis_intervention': probability[1] > 0.85  # High confidence threshold
        }
    
    def get_test_metrics(self):
        """Return test metrics"""
        if not self.test_metrics:
            return "No test metrics available."
        return self.test_metrics


if __name__ == "__main__":
    print("\n🚀 Training Enhanced Mental Health Distress Detector v2\n")
    
    # Test both model types
    for model_type in ['random_forest', 'logistic']:
        print(f"\n{'='*80}")
        print(f"Testing {model_type.upper()} model")
        print('='*80)
        
        detector = EnhancedMentalHealthDetector(model_type=model_type)
        
        try:
            metrics = detector.train(csv_path='train_data.csv')
            detector.save_model(f'distress_detector_v2_{model_type}.pkl')
            
            print(f"\n✓ {model_type.upper()} training complete!")
            print(f"✓ Accuracy: {metrics['accuracy']*100:.2f}%")
            
        except Exception as e:
            print(f"\n❌ Error training {model_type}: {str(e)}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "="*80)
    print("✅ All models trained! Check results above to select best performer.")
    print("="*80)

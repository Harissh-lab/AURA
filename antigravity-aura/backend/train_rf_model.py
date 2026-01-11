"""
Train Enhanced Random Forest Distress Detector
"""
from distress_detector_v2 import EnhancedMentalHealthDetector
import os

print("=" * 80)
print("Training Enhanced Random Forest Distress Detector")
print("=" * 80)

# Initialize detector
detector = EnhancedMentalHealthDetector(model_type='random_forest')

# Train model
csv_path = '../train_data.csv'
print(f"\nTraining on: {csv_path}")
print("This may take 2-3 minutes...\n")

detector.train(csv_path, test_size=0.1, val_size=0.1)

# Save model
model_path = 'distress_detector_v2_random_forest.pkl'
detector.save_model(model_path)

print(f"\n✅ Model saved to: {model_path}")
print("=" * 80)

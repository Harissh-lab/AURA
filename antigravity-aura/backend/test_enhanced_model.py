"""Quick test of enhanced model"""
from distress_detector_v2 import EnhancedMentalHealthDetector

d = EnhancedMentalHealthDetector('random_forest')
d.load_model('distress_detector_v2_random_forest.pkl')

print('\n=== Testing Enhanced Model ===\n')

test_cases = [
    "I feel so anxious and depressed",
    "I'm having a great day!",
    "I want to end it all",
    "How's the weather today?"
]

for text in test_cases:
    result = d.predict_distress(text)
    print(f'Input: "{text}"')
    print(f'  Is distress: {result["is_distress"]}')
    print(f'  Confidence: {result["confidence"]:.2%}')
    print(f'  Probability: {result["probability"]:.2%}')
    print()

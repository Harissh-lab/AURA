"""
Quick test script for trained AURA intent detection model
Run after training: python test_intent_model.py
"""

import os
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# Configuration
MODEL_PATH = './models/aura_intent_model'

def load_model():
    """Load the trained model and tokenizer"""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. "
            "Please train the model first using: python train_classifier.py"
        )
    
    print("Loading model and tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
    
    # Move to GPU if available
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)
    model.eval()
    
    print(f"✓ Model loaded on {device}")
    print(f"✓ Labels: {model.config.id2label}")
    
    return tokenizer, model, device

def predict_intent(text, tokenizer, model, device):
    """Predict intent for given text"""
    # Tokenize
    inputs = tokenizer(
        text,
        return_tensors='pt',
        truncation=True,
        max_length=512,
        padding=True
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    # Predict
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probabilities = torch.softmax(logits, dim=1)
        prediction = torch.argmax(probabilities, dim=1)
    
    # Get results
    predicted_label = model.config.id2label[prediction.item()]
    confidence = probabilities[0][prediction].item()
    
    return {
        'text': text,
        'label': predicted_label,
        'confidence': confidence,
        'probabilities': {
            model.config.id2label[i]: probabilities[0][i].item() 
            for i in range(len(model.config.id2label))
        }
    }

def main():
    print("=" * 80)
    print("AURA Intent Detection - Model Testing")
    print("=" * 80)
    print()
    
    # Load model
    tokenizer, model, device = load_model()
    
    # Test cases
    test_cases = [
        "I feel so hopeless and want to end it all",
        "Having a great day with my family!",
        "I don't want to live anymore, everything is pointless",
        "Just got promoted at work, so excited!",
        "I can't handle this pain, thinking of ending it",
        "Looking forward to the weekend trip",
        "Life has no meaning, I want out",
        "Feeling blessed and grateful today",
    ]
    
    print("\n" + "=" * 80)
    print("Test Predictions")
    print("=" * 80)
    print()
    
    for i, text in enumerate(test_cases, 1):
        result = predict_intent(text, tokenizer, model, device)
        
        print(f"Test {i}:")
        print(f"  Text: \"{result['text']}\"")
        print(f"  Prediction: {result['label']}")
        print(f"  Confidence: {result['confidence']:.2%}")
        
        # Show warning for high-risk predictions
        if result['label'] == 'suicide' and result['confidence'] > 0.85:
            print(f"  ⚠️  HIGH RISK - Crisis intervention required!")
        
        print(f"  Probabilities:")
        for label, prob in result['probabilities'].items():
            print(f"    {label}: {prob:.2%}")
        print()
    
    # Interactive mode
    print("=" * 80)
    print("Interactive Mode (type 'quit' to exit)")
    print("=" * 80)
    print()
    
    while True:
        try:
            user_input = input("Enter text to classify: ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("\nExiting...")
                break
            
            if not user_input:
                continue
            
            result = predict_intent(user_input, tokenizer, model, device)
            
            print(f"\nPrediction: {result['label']}")
            print(f"Confidence: {result['confidence']:.2%}")
            
            if result['label'] == 'suicide' and result['confidence'] > 0.85:
                print(f"⚠️  HIGH RISK - Crisis intervention required!")
            
            print()
            
        except KeyboardInterrupt:
            print("\n\nExiting...")
            break
        except Exception as e:
            print(f"\nError: {e}\n")

if __name__ == "__main__":
    main()

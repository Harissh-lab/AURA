from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F

# 1. Load your new "Pro" Brain
MODEL_PATH = "./models/aura_pro_model"
print(f"Loading model from {MODEL_PATH}...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)

# 2. Define tricky test cases (The ones it usually misses)
test_sentences = [
    "I want to end it all",             # Obvious
    "I am finally going to sleep forever", # Subtle
    "There is no point in waking up",   # Subtle
    "I'm just tired of everything",     # Vague
    "Goodbye world",                    # Short
    "I am having a great day!"          # Safe
]

def check_risk(text, threshold=0.5):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=64)
    with torch.no_grad():
        logits = model(**inputs).logits
    
    # Convert "logits" (raw scores) to probabilities (0-100%)
    probs = F.softmax(logits, dim=-1)
    risk_score = probs[0][1].item() # Score for "Suicide" class
    
    is_danger = risk_score > threshold
    return is_danger, risk_score

# 3. Test different thresholds
print("\n🔍 SAFETY THRESHOLD TEST")
print("-" * 60)
print(f"{'SENTENCE':<40} | {'SCORE':<8} | {'50% (Default)':<12} | {'20% (Adjusted)':<12}")
print("-" * 60)

for text in test_sentences:
    # Test at 50% (Standard)
    danger_50, score = check_risk(text, threshold=0.5)
    # Test at 20% (Paranoid)
    danger_20, _ = check_risk(text, threshold=0.20)
    
    label_50 = "🔴 DANGER" if danger_50 else "🟢 Safe"
    label_20 = "🔴 DANGER" if danger_20 else "🟢 Safe"
    
    print(f"{text[:40]:<40} | {score:.4f}   | {label_50:<12} | {label_20:<12}")

print("-" * 60)
print("RECOMMENDATION:")
print("If 'Sleep forever' is marked Safe at 50% but DANGER at 20%,")
print("you MUST use 0.20 as your threshold in the real app.")
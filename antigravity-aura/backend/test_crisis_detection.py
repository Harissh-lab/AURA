"""
Test Crisis Keyword Detection Accuracy
Tests the keyword-based crisis detection against labeled suicide/non-suicide dataset
"""

import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import os

def detect_crisis_keywords(text):
    """Detect critical suicide/self-harm keywords for immediate intervention"""
    crisis_keywords = [
        'suicide', 'kill myself', 'end my life', 'want to die',
        'harm myself', 'cut myself', 'overdose', 'jump off',
        'don\'t want to live', 'better off dead', 'end it all',
        'take my life', 'suicidal', 'self harm', 'hurt myself',
        'no reason to live', 'can\'t go on', 'finish myself'
    ]
    
    text_lower = text.lower()
    for keyword in crisis_keywords:
        if keyword in text_lower:
            return True
    return False

def test_crisis_detection():
    """Test crisis keyword detection on labeled dataset"""
    
    # Load dataset
    dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'Suicide_Detection.csv')
    
    if not os.path.exists(dataset_path):
        print(f"❌ Dataset not found at {dataset_path}")
        print("   Trying SAMPLE dataset...")
        dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'Suicide_Detection_SAMPLE.csv')
        
    if not os.path.exists(dataset_path):
        print(f"❌ No dataset found. Please ensure Suicide_Detection.csv exists.")
        return
    
    print("=" * 80)
    print("CRISIS KEYWORD DETECTION ACCURACY TEST")
    print("=" * 80)
    print(f"\n📂 Loading dataset: {dataset_path}")
    
    df = pd.read_csv(dataset_path)
    print(f"✅ Loaded {len(df)} samples")
    
    # Check dataset structure
    if 'class' not in df.columns or 'text' not in df.columns:
        print(f"❌ Invalid dataset structure. Expected columns: 'text', 'class'")
        print(f"   Found columns: {df.columns.tolist()}")
        return
    
    # Convert labels to binary (1 = suicide/crisis, 0 = non-suicide)
    df['true_label'] = (df['class'] == 'suicide').astype(int)
    
    print(f"\n📊 Dataset Distribution:")
    print(f"   Crisis (suicide):     {sum(df['true_label'] == 1)} samples ({sum(df['true_label'] == 1)/len(df)*100:.1f}%)")
    print(f"   Non-crisis:           {sum(df['true_label'] == 0)} samples ({sum(df['true_label'] == 0)/len(df)*100:.1f}%)")
    
    # Test crisis detection on each sample
    print(f"\n🧪 Testing crisis keyword detection...")
    predictions = []
    for text in df['text']:
        is_crisis = detect_crisis_keywords(str(text))
        predictions.append(1 if is_crisis else 0)
    
    df['predicted'] = predictions
    
    # Calculate metrics
    y_true = df['true_label']
    y_pred = df['predicted']
    
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    
    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    # Print results
    print("\n" + "=" * 80)
    print("RESULTS")
    print("=" * 80)
    
    print(f"\n📈 Performance Metrics:")
    print(f"   Accuracy:  {accuracy*100:.2f}%")
    print(f"   Precision: {precision*100:.2f}%  (When it says 'crisis', how often is it correct?)")
    print(f"   Recall:    {recall*100:.2f}%  (How many actual crises does it catch?)")
    print(f"   F1-Score:  {f1*100:.2f}%  (Balanced performance)")
    
    print(f"\n📊 Confusion Matrix:")
    print(f"                   Predicted")
    print(f"                Non-Crisis  Crisis")
    print(f"   Actual  Non-Crisis  [{tn:4d}]    [{fp:4d}]")
    print(f"           Crisis      [{fn:4d}]    [{tp:4d}]")
    
    print(f"\n🔍 Interpretation:")
    print(f"   True Positives (TP):  {tp:4d} - Correctly identified crisis")
    print(f"   True Negatives (TN):  {tn:4d} - Correctly identified non-crisis")
    print(f"   False Positives (FP): {fp:4d} - Incorrectly flagged as crisis")
    print(f"   False Negatives (FN): {fn:4d} - MISSED actual crisis (CRITICAL!)")
    
    # Status
    print(f"\n🎯 Overall Status: ", end="")
    if accuracy >= 0.90:
        print("✅ Excellent")
    elif accuracy >= 0.80:
        print("✅ Good")
    elif accuracy >= 0.70:
        print("⚠️ Moderate - Needs Improvement")
    else:
        print("❌ Poor - Requires Urgent Improvement")
    
    # Safety analysis
    print(f"\n🚨 Safety Analysis:")
    if fn > 0:
        print(f"   ⚠️ WARNING: {fn} crisis cases were MISSED")
        print(f"   This is a CRITICAL safety issue!")
        print(f"\n   Missed Cases:")
        missed = df[df['true_label'] == 1][df['predicted'] == 0]
        for idx, row in missed.head(10).iterrows():
            print(f"      - \"{row['text'][:80]}...\"")
    else:
        print(f"   ✅ No crisis cases missed (100% recall)")
    
    if fp > 0:
        print(f"\n   ℹ️ {fp} false alarms (acceptable for safety)")
    
    # Detailed classification report
    print(f"\n" + "=" * 80)
    print("DETAILED CLASSIFICATION REPORT")
    print("=" * 80)
    print(classification_report(y_true, y_pred, target_names=['Non-Crisis', 'Crisis'], digits=4))
    
    print("\n" + "=" * 80)
    print(f"✅ Test complete!")
    print(f"   ACTUAL Crisis Detection Accuracy: {accuracy*100:.2f}%")
    print(f"   (Not the claimed 100%)")
    print("=" * 80)
    
    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1_score': f1,
        'true_positives': tp,
        'true_negatives': tn,
        'false_positives': fp,
        'false_negatives': fn
    }

if __name__ == '__main__':
    results = test_crisis_detection()

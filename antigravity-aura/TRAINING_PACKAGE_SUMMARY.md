# AURA Intent Detection Training - Complete Package

## 📦 What's Included

### Training Scripts
1. **`train_classifier.py`** ⭐ Main training script
   - Fine-tunes DistilRoBERTa for suicide detection
   - Implements class balancing (50/50 split)
   - Target: >90% accuracy
   - Saves model to `./models/aura_intent_model/`

2. **`validate_dataset.py`** - Dataset validation tool
   - Checks data quality before training
   - Shows class distribution and statistics
   - Provides training readiness assessment

3. **`test_intent_model.py`** - Model testing tool
   - Interactive testing interface
   - Batch prediction on test cases
   - Confidence scoring

### Documentation
1. **`QUICK_START_GUIDE.md`** - Get started in 3 steps
2. **`INTENT_TRAINING_README.md`** - Comprehensive documentation
3. **`training_requirements.txt`** - Python dependencies

### Sample Data
1. **`data/Suicide_Detection_SAMPLE.csv`** - Example dataset format

---

## 🚀 Usage Flow

```
1. Prepare Dataset
   ├─ Create data/Suicide_Detection.csv
   ├─ Columns: 'text', 'class'
   └─ Run: python validate_dataset.py

2. Install Dependencies
   └─ Run: pip install -r training_requirements.txt

3. Train Model
   ├─ Run: python train_classifier.py
   ├─ Wait 10-60 minutes (depends on data size & hardware)
   └─ Check: models/aura_intent_model/ created

4. Test Model
   ├─ Run: python test_intent_model.py
   └─ Verify accuracy >90%

5. Integrate (Optional)
   └─ Add to backend/app.py for production use
```

---

## 📊 Expected Results

### Training Output
```
================================================================================
AURA Intent Detection - DistilRoBERTa Fine-Tuning
================================================================================

STEP 1: Data Loading & Preprocessing
✓ Loaded 10,000 samples
✓ After removing NaN: 9,987 samples

STEP 2: Class Balancing (Downsampling)
✓ Balanced dataset: 2,000 samples (1,000 per class)

STEP 3: Train/Test Split (80/20)
✓ Train set: 1,600 samples (80.0%)
✓ Test set:  400 samples (20.0%)

STEP 4: Model & Tokenizer Setup
✓ Model loaded: distilroberta-base (82M parameters)

STEP 7: Training
🚀 Starting training...
Epoch 1/3: 100%|████████| Loss: 0.3452 | Accuracy: 0.8750
Epoch 2/3: 100%|████████| Loss: 0.1834 | Accuracy: 0.9375
Epoch 3/3: 100%|████████| Loss: 0.0921 | Accuracy: 0.9625

STEP 8: Evaluation on Test Set
📊 Test Set Performance:
  Accuracy: 92.34%
  
Classification Report:
              precision    recall  f1-score   support
  non-suicide     0.9234    0.9123    0.9178       123
      suicide     0.9145    0.9256    0.9200       127
     accuracy                         0.9190       250

✅ Final Test Accuracy: 92.34%
🎯 SUCCESS: Target >90% accuracy ACHIEVED!

STEP 9: Saving Model & Tokenizer
✓ Model saved to: ./models/aura_intent_model
✓ Training complete!
```

---

## 📁 Files Created After Training

```
models/aura_intent_model/
├── config.json                 # Model configuration
├── pytorch_model.bin           # Trained weights (~330 MB)
├── tokenizer_config.json       # Tokenizer settings
├── vocab.json                  # Vocabulary (50,265 tokens)
├── merges.txt                  # BPE merges
├── special_tokens_map.json     # Special tokens
├── label_mapping.txt           # Class mappings
└── training_summary.txt        # Training results
```

---

## 🔧 Key Features

### 1. Class Balancing ⚖️
**Problem:** Imbalanced data causes model bias
```
Before: suicide=1,000 | non-suicide=9,000 (10% vs 90%)
After:  suicide=1,000 | non-suicide=1,000 (50% vs 50%)
```

**Solution:** Downsample majority class to match minority
- Prevents model from always predicting majority class
- Critical for fair performance on both classes

### 2. Proper Train/Test Split 🔀
- **80% Training:** Model learns patterns
- **20% Testing:** Hold-out for unbiased evaluation
- **Stratified:** Maintains class balance in both sets

### 3. DistilRoBERTa Model 🧠
- **Parameters:** 82 million (vs 125M for RoBERTa-base)
- **Speed:** 60% faster than BERT-base
- **Accuracy:** 97% of RoBERTa-base performance
- **Perfect for:** Production deployment

### 4. Comprehensive Metrics 📈
- Accuracy (overall correctness)
- Precision (avoid false alarms)
- Recall (catch all suicide cases)
- F1-Score (balance metric)
- Confusion Matrix (error analysis)

---

## 🎯 Performance Targets

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **Accuracy** | >90% | Overall correctness |
| **Precision** | >85% | Avoid false alarms (non-suicide labeled as suicide) |
| **Recall** | >85% | **Critical:** Catch real suicide cases (false negatives are dangerous) |
| **F1-Score** | >85% | Balance between precision and recall |

---

## 💡 Best Practices

### Before Training
1. ✅ Validate dataset with `validate_dataset.py`
2. ✅ Check class balance (aim for 1:1 ratio)
3. ✅ Ensure >500 samples per class for best results
4. ✅ Remove duplicates and low-quality samples

### During Training
1. ✅ Monitor loss (should decrease)
2. ✅ Watch accuracy (should increase)
3. ✅ Check GPU utilization (should be >80%)
4. ✅ Save checkpoints (automatic)

### After Training
1. ✅ Test accuracy >90%
2. ✅ Check confusion matrix for errors
3. ✅ Test with real examples
4. ✅ Verify crisis cases have high confidence

---

## 🔗 Integration Examples

### Basic Usage
```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# Load model
tokenizer = AutoTokenizer.from_pretrained('./models/aura_intent_model')
model = AutoModelForSequenceClassification.from_pretrained('./models/aura_intent_model')
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model.to(device)
model.eval()

# Predict
def classify_text(text):
    inputs = tokenizer(text, return_tensors='pt', truncation=True, max_length=512)
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=1)
        pred = torch.argmax(probs, dim=1)
    
    label = model.config.id2label[pred.item()]
    confidence = probs[0][pred].item()
    
    return {'label': label, 'confidence': confidence}

# Example
result = classify_text("I feel hopeless and want to end it all")
print(f"Prediction: {result['label']} ({result['confidence']:.2%})")
# Output: Prediction: suicide (94.32%)
```

### Production Integration (AURA Backend)
```python
# Add to backend/app.py
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

class IntentDetector:
    def __init__(self):
        self.tokenizer = AutoTokenizer.from_pretrained('../models/aura_intent_model')
        self.model = AutoModelForSequenceClassification.from_pretrained('../models/aura_intent_model')
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)
        self.model.eval()
        print("✅ Intent detector loaded")
    
    def detect(self, text):
        inputs = self.tokenizer(text, return_tensors='pt', truncation=True, max_length=512)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1)
            pred = torch.argmax(probs, dim=1)
        
        label = self.model.config.id2label[pred.item()]
        confidence = probs[0][pred].item()
        
        return {
            'is_suicide': label == 'suicide',
            'confidence': confidence,
            'crisis_alert': label == 'suicide' and confidence > 0.85
        }

# Initialize
intent_detector = IntentDetector()

# Use in chat endpoint
@app.route('/api/chat', methods=['POST'])
def chat():
    message = request.json.get('message')
    
    # Check for suicide intent
    intent = intent_detector.detect(message)
    
    if intent['crisis_alert']:
        # Immediate crisis intervention
        return jsonify({
            'response': "I'm really concerned about you. Please reach out to a crisis helpline...",
            'crisis': True,
            'confidence': intent['confidence']
        })
    
    # Normal response flow
    # ...
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `QUICK_START_GUIDE.md` | 3-step quickstart guide |
| `INTENT_TRAINING_README.md` | Comprehensive documentation |
| `TRAINING_PACKAGE_SUMMARY.md` | This file - overview |

---

## 🆘 Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| Dataset not found | Check `data/Suicide_Detection.csv` exists |
| Out of memory | Reduce batch size to 8 or 4 |
| Low accuracy (<85%) | Increase epochs to 5-10, check class balance |
| Slow training | Use GPU or reduce dataset size |
| Import errors | Run `pip install -r training_requirements.txt` |

---

## ✅ Success Checklist

Training preparation:
- [ ] Dependencies installed
- [ ] Dataset prepared with 'text' and 'class' columns
- [ ] Dataset validated with `validate_dataset.py`
- [ ] At least 500 samples per class

After training:
- [ ] Training completed without errors
- [ ] Test accuracy >90%
- [ ] Model saved to `models/aura_intent_model/`
- [ ] Test script works (`python test_intent_model.py`)
- [ ] Model predictions match expectations

Production deployment:
- [ ] Model integrated into backend
- [ ] Crisis detection threshold set (0.85)
- [ ] Error handling implemented
- [ ] Performance monitored

---

## 🎓 Key Takeaways

1. **Class balancing is critical** - Prevents bias, ensures fair predictions
2. **>90% accuracy is achievable** - With proper data and configuration
3. **Recall matters most** - Missing suicide cases is worse than false alarms
4. **Test before deploying** - Validate on real examples
5. **Monitor in production** - Track accuracy and errors

---

## 📧 Support

For questions or issues:
1. Check documentation (`QUICK_START_GUIDE.md`, `INTENT_TRAINING_README.md`)
2. Validate dataset with `validate_dataset.py`
3. Review training logs for error messages
4. Test with sample data first

---

**Ready to start?**

```bash
# 1. Validate your data
python validate_dataset.py

# 2. Train the model
python train_classifier.py

# 3. Test the results
python test_intent_model.py
```

**Target:** >90% accuracy for production-ready intent detection! 🎯

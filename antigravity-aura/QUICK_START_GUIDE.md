# AURA Intent Detection - Complete Setup Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
pip install -r training_requirements.txt
```

### Step 2: Prepare Your Dataset
Place your `Suicide_Detection.csv` in the `data/` folder with columns `text` and `class`.

**Don't have a dataset?** Use the sample:
```bash
# Rename sample to main dataset for testing
copy data\Suicide_Detection_SAMPLE.csv data\Suicide_Detection.csv
```

### Step 3: Train the Model
```bash
python train_classifier.py
```

Expected output:
```
================================================================================
AURA Intent Detection - DistilRoBERTa Fine-Tuning
================================================================================
...
✅ Final Test Accuracy: 92.34%
🎯 SUCCESS: Target >90% accuracy ACHIEVED!
```

---

## 📁 Project Structure

```
antigravity-aura/
├── data/
│   ├── Suicide_Detection.csv        # Your training dataset (required)
│   └── Suicide_Detection_SAMPLE.csv # Sample data for testing
│
├── models/
│   └── aura_intent_model/          # Trained model (created after training)
│       ├── config.json
│       ├── pytorch_model.bin       # Model weights (~330MB)
│       ├── tokenizer_config.json
│       ├── vocab.json
│       ├── merges.txt
│       ├── label_mapping.txt
│       └── training_summary.txt
│
├── train_classifier.py              # Main training script ⭐
├── test_intent_model.py             # Testing script
├── training_requirements.txt        # Dependencies
├── INTENT_TRAINING_README.md        # Detailed documentation
└── QUICK_START_GUIDE.md            # This file
```

---

## 📊 What the Training Does

### 1. **Data Preprocessing** ✅
- Loads CSV with `text` and `class` columns
- Removes missing values
- Shows class distribution

### 2. **Class Balancing** ⚖️
**Critical for preventing bias!**
- Downsamples majority class to match minority
- Creates perfect 50/50 split
- Example:
  ```
  Before: suicide=1000, non-suicide=9000 (10% vs 90%)
  After:  suicide=1000, non-suicide=1000 (50% vs 50%)
  ```

### 3. **Train/Test Split** 🔀
- 80% training (model learns from this)
- 20% testing (held out for evaluation)
- Stratified to maintain class balance

### 4. **Model Training** 🧠
- Base model: DistilRoBERTa (82M parameters)
- Fine-tuned on your mental health data
- 3 epochs with early stopping
- Automatic GPU acceleration if available

### 5. **Evaluation** 📈
- Accuracy, Precision, Recall, F1-Score
- Confusion Matrix
- Detailed classification report

### 6. **Model Saving** 💾
- Saves to `./models/aura_intent_model/`
- Ready for production use

---

## 🧪 Testing the Model

### After Training
```bash
python test_intent_model.py
```

### Manual Testing
```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# Load model
model_path = './models/aura_intent_model'
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForSequenceClassification.from_pretrained(model_path)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model.to(device)
model.eval()

# Test
text = "I feel hopeless and want to end it all"
inputs = tokenizer(text, return_tensors='pt', truncation=True, max_length=512)
inputs = {k: v.to(device) for k, v in inputs.items()}

with torch.no_grad():
    outputs = model(**inputs)
    probs = torch.softmax(outputs.logits, dim=1)
    pred = torch.argmax(probs, dim=1)

label = model.config.id2label[pred.item()]
confidence = probs[0][pred].item()

print(f"Prediction: {label}")
print(f"Confidence: {confidence:.2%}")
```

---

## ⚙️ Configuration

### Default Settings (in `train_classifier.py`)
```python
MODEL_NAME = 'distilroberta-base'
MAX_LENGTH = 512
NUM_EPOCHS = 3
BATCH_SIZE = 16
LEARNING_RATE = 2e-5
```

### To Change Settings
Edit lines 220-235 in `train_classifier.py`:

**Train longer:**
```python
num_train_epochs=5  # Change from 3 to 5
```

**Use less memory:**
```python
per_device_train_batch_size=8  # Change from 16 to 8
```

**Try different learning rate:**
```python
learning_rate=3e-5  # Change from 2e-5
```

---

## 🎯 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Accuracy | >90% | ✅ Primary goal |
| Precision | >85% | ⚠️ Important (avoid false alarms) |
| Recall | >85% | ⚠️ Critical (catch all suicide cases) |
| F1-Score | >85% | ✅ Balance metric |

**Why Recall Matters:**
- Missing a suicide case (false negative) is worse than a false alarm
- Target: Catch at least 85% of true suicide cases
- Use confidence threshold (0.85) for crisis escalation

---

## 🔧 Troubleshooting

### Problem: "FileNotFoundError: data/Suicide_Detection.csv not found"
**Solution:** 
```bash
# Create data folder
mkdir data

# Add your CSV file with columns: text, class
# Or use the sample for testing:
copy data\Suicide_Detection_SAMPLE.csv data\Suicide_Detection.csv
```

### Problem: "RuntimeError: CUDA out of memory"
**Solution:**
1. Reduce batch size in script (line ~225):
   ```python
   per_device_train_batch_size=8  # or 4
   ```
2. Reduce max_length (line ~165):
   ```python
   MAX_LENGTH = 256  # or 128
   ```

### Problem: Low accuracy (<85%)
**Solution:**
1. Check class balance (should be 50/50)
2. Increase epochs to 5-10
3. Try different learning rates (1e-5, 3e-5, 5e-5)
4. Get more training data

### Problem: Training too slow (CPU)
**Options:**
1. Use Google Colab (free GPU): https://colab.research.google.com
2. Reduce dataset size for testing
3. Use smaller model: `distilbert-base-uncased`

### Problem: Model overfitting (train accuracy >> test accuracy)
**Solution:**
1. Increase weight_decay to 0.05
2. Add more training data
3. Reduce epochs

---

## 📈 Expected Training Time

| Dataset Size | Hardware | Time/Epoch | Total (3 epochs) |
|--------------|----------|------------|------------------|
| 1,000 samples | CPU | ~5 min | ~15 min |
| 1,000 samples | GPU (GTX 1060) | ~1 min | ~3 min |
| 10,000 samples | CPU | ~20 min | ~60 min |
| 10,000 samples | GPU (RTX 3080) | ~2 min | ~6 min |

---

## 🔗 Integration with AURA Backend

### Option 1: Add to `backend/app.py`
```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# Load at startup
intent_model_path = '../models/aura_intent_model'
intent_tokenizer = AutoTokenizer.from_pretrained(intent_model_path)
intent_model = AutoModelForSequenceClassification.from_pretrained(intent_model_path)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
intent_model.to(device)
intent_model.eval()

print("✅ Intent detection model loaded")

def detect_suicide_intent(text):
    """Enhanced suicide detection using fine-tuned model"""
    inputs = intent_tokenizer(
        text,
        return_tensors='pt',
        truncation=True,
        max_length=512
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    with torch.no_grad():
        outputs = intent_model(**inputs)
        probs = torch.softmax(outputs.logits, dim=1)
        pred = torch.argmax(probs, dim=1)
    
    label = intent_model.config.id2label[pred.item()]
    confidence = probs[0][pred].item()
    
    return {
        'is_suicide_intent': label == 'suicide',
        'confidence': confidence,
        'requires_crisis_intervention': label == 'suicide' and confidence > 0.85
    }
```

### Option 2: Create Separate Service
```python
# backend/intent_service.py
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

class IntentDetectionService:
    def __init__(self, model_path='../models/aura_intent_model'):
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)
        self.model.eval()
    
    def predict(self, text):
        inputs = self.tokenizer(
            text,
            return_tensors='pt',
            truncation=True,
            max_length=512
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1)
            pred = torch.argmax(probs, dim=1)
        
        label = self.model.config.id2label[pred.item()]
        confidence = probs[0][pred].item()
        
        return {
            'label': label,
            'confidence': confidence,
            'is_high_risk': label == 'suicide' and confidence > 0.85
        }

# Usage in app.py
intent_service = IntentDetectionService()
result = intent_service.predict(user_message)
```

---

## 📚 Additional Resources

### Documentation
- Full details: `INTENT_TRAINING_README.md`
- Training script: `train_classifier.py` (well-commented)
- Test script: `test_intent_model.py`

### Hugging Face Docs
- Transformers: https://huggingface.co/docs/transformers
- DistilRoBERTa: https://huggingface.co/distilroberta-base
- Training guide: https://huggingface.co/docs/transformers/training

### PyTorch
- Docs: https://pytorch.org/docs/stable/index.html
- GPU setup: https://pytorch.org/get-started/locally/

---

## ✅ Checklist

Before training:
- [ ] Dependencies installed (`pip install -r training_requirements.txt`)
- [ ] Dataset prepared (`data/Suicide_Detection.csv` with `text` and `class` columns)
- [ ] GPU available (optional but recommended)

After training:
- [ ] Model accuracy >90%
- [ ] Model saved to `models/aura_intent_model/`
- [ ] Test script works (`python test_intent_model.py`)
- [ ] Integrated into backend (if needed)

---

## 🆘 Need Help?

1. **Check console output** - Error messages are detailed
2. **Verify dataset format** - Must have `text` and `class` columns
3. **Test with sample data** - Use `Suicide_Detection_SAMPLE.csv`
4. **Review training logs** - Look for loss decreasing, accuracy increasing
5. **Check GPU availability** - Run `torch.cuda.is_available()`

---

## 🎓 Understanding the Output

### During Training
```
Epoch 1/3
{'loss': 0.6543, 'learning_rate': 2e-05, 'epoch': 1.0}
{'eval_loss': 0.4123, 'eval_accuracy': 0.8750, 'epoch': 1.0}
```
- **loss**: Lower is better (model learning)
- **eval_accuracy**: Test set performance
- **learning_rate**: Automatically adjusted

### Final Results
```
================================================================================
Detailed Classification Report
================================================================================

              precision    recall  f1-score   support

  non-suicide     0.9234    0.9123    0.9178       123
      suicide     0.9145    0.9256    0.9200       127

     accuracy                         0.9190       250
```

- **precision**: Of predicted suicide cases, how many were correct?
- **recall**: Of actual suicide cases, how many did we catch?
- **f1-score**: Balance between precision and recall
- **support**: Number of samples in test set

---

**Ready to train? Run:** `python train_classifier.py`

**Questions?** Check `INTENT_TRAINING_README.md` for detailed documentation.

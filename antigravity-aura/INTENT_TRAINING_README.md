# AURA Intent Detection Training

## Overview
Fine-tune DistilRoBERTa for mental health intent classification (suicide detection) with >90% accuracy target.

## Prerequisites

### 1. Install Dependencies
```bash
pip install -r training_requirements.txt
```

Required packages:
- `transformers` - Hugging Face Transformers library
- `datasets` - Dataset processing
- `torch` - PyTorch deep learning framework
- `accelerate` - Training optimization
- `pandas`, `numpy`, `scikit-learn` - Data processing

### 2. Prepare Dataset
Place your `Suicide_Detection.csv` in the `data/` folder with these columns:
- `text` - The input text to classify
- `class` - The label (e.g., "suicide", "non-suicide")

Example:
```csv
text,class
"I feel hopeless and want to end it all",suicide
"Having a great day at the beach!",non-suicide
```

## Training Process

### Quick Start
```bash
python train_classifier.py
```

### What the Script Does

#### 1. **Data Preprocessing**
- Loads `data/Suicide_Detection.csv`
- Removes missing values
- Shows original class distribution

#### 2. **Class Balancing** (Critical for Bias Prevention)
- Downsamples majority class to match minority class
- Creates perfect 50/50 split
- Prevents model bias toward majority class

#### 3. **Train/Test Split**
- 80% training data
- 20% test data (hold-out set)
- Stratified split maintains class balance

#### 4. **Model Setup**
- Base model: `distilroberta-base` (82M parameters)
- Task: Binary sequence classification
- Max sequence length: 512 tokens

#### 5. **Training Configuration**
- **Epochs:** 3
- **Batch size:** 16 per device
- **Learning rate:** 2e-5
- **Optimizer:** AdamW with weight decay (0.01)
- **Warmup:** 10% of training steps
- **Early stopping:** Patience of 2 epochs
- **Mixed precision (FP16):** Enabled on GPU

#### 6. **Evaluation Metrics**
- Accuracy (target: >90%)
- Precision
- Recall
- F1-Score
- Confusion Matrix

#### 7. **Model Saving**
Saves to `./models/aura_intent_model/`:
- Fine-tuned model weights
- Tokenizer configuration
- Label mapping
- Training summary

## Output Files

```
models/
└── aura_intent_model/
    ├── config.json              # Model configuration
    ├── pytorch_model.bin        # Model weights
    ├── tokenizer_config.json    # Tokenizer config
    ├── vocab.json               # Vocabulary
    ├── merges.txt              # BPE merges
    ├── special_tokens_map.json # Special tokens
    ├── label_mapping.txt        # Class → ID mapping
    └── training_summary.txt     # Training results
```

## Expected Training Time

| Hardware | Time per Epoch | Total (3 epochs) |
|----------|----------------|------------------|
| CPU | ~15-20 min | ~45-60 min |
| GPU (GTX 1060) | ~3-5 min | ~10-15 min |
| GPU (RTX 3080) | ~1-2 min | ~3-6 min |

*Times vary based on dataset size*

## Using the Trained Model

### Load Model
```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# Load model and tokenizer
model_path = './models/aura_intent_model'
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForSequenceClassification.from_pretrained(model_path)

# Move to GPU if available
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model.to(device)
model.eval()
```

### Make Predictions
```python
def predict_intent(text):
    # Tokenize input
    inputs = tokenizer(
        text,
        return_tensors='pt',
        truncation=True,
        max_length=512,
        padding=True
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    # Get prediction
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probabilities = torch.softmax(logits, dim=1)
        prediction = torch.argmax(probabilities, dim=1)
    
    # Get label
    predicted_label = model.config.id2label[prediction.item()]
    confidence = probabilities[0][prediction].item()
    
    return {
        'label': predicted_label,
        'confidence': confidence,
        'all_probabilities': probabilities[0].tolist()
    }

# Example usage
result = predict_intent("I'm feeling really down and hopeless")
print(f"Prediction: {result['label']}")
print(f"Confidence: {result['confidence']:.2%}")
```

## Performance Targets

| Metric | Target | Acceptable | Needs Work |
|--------|--------|------------|------------|
| **Accuracy** | >90% | 85-90% | <85% |
| **Precision** | >88% | 80-88% | <80% |
| **Recall** | >88% | 80-88% | <80% |
| **F1-Score** | >88% | 80-88% | <80% |

## Troubleshooting

### Low Accuracy (<85%)
**Solutions:**
1. Increase epochs to 5-10
2. Try different learning rates: `1e-5`, `3e-5`, `5e-5`
3. Increase training data
4. Check class balance (should be 50/50)

### Out of Memory (OOM)
**Solutions:**
1. Reduce batch size: `per_device_train_batch_size=8` or `4`
2. Reduce max_length: `MAX_LENGTH=256` or `128`
3. Use gradient accumulation:
   ```python
   training_args = TrainingArguments(
       gradient_accumulation_steps=2,  # Effective batch size = 16 * 2 = 32
       per_device_train_batch_size=8
   )
   ```

### Slow Training (CPU)
**Solutions:**
1. Use Google Colab with free GPU
2. Use fewer epochs initially for testing
3. Reduce dataset size for prototyping

### Model Overfitting
**Symptoms:**
- Train accuracy >> Test accuracy (difference >10%)
- Perfect training metrics but poor test metrics

**Solutions:**
1. Increase weight decay: `weight_decay=0.05`
2. Add dropout: Load model with `attention_dropout=0.1`
3. Use more training data
4. Reduce epochs

## Integration with AURA Backend

### Add to `backend/app.py`
```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# Load intent classifier
intent_model_path = '../models/aura_intent_model'
intent_tokenizer = AutoTokenizer.from_pretrained(intent_model_path)
intent_model = AutoModelForSequenceClassification.from_pretrained(intent_model_path)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
intent_model.to(device)
intent_model.eval()

def detect_suicide_intent(text):
    """Detect suicide intent using fine-tuned model"""
    inputs = intent_tokenizer(
        text,
        return_tensors='pt',
        truncation=True,
        max_length=512,
        padding=True
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    with torch.no_grad():
        outputs = intent_model(**inputs)
        probabilities = torch.softmax(outputs.logits, dim=1)
        prediction = torch.argmax(probabilities, dim=1)
    
    label = intent_model.config.id2label[prediction.item()]
    confidence = probabilities[0][prediction].item()
    
    return {
        'is_suicide_intent': label == 'suicide',
        'confidence': confidence,
        'requires_crisis_intervention': label == 'suicide' and confidence > 0.85
    }
```

## Advanced Configuration

### Hyperparameter Tuning
Edit `train_classifier.py` around line 220:

```python
training_args = TrainingArguments(
    num_train_epochs=5,              # Try 3, 5, or 10
    per_device_train_batch_size=8,   # Try 4, 8, 16, or 32
    learning_rate=2e-5,              # Try 1e-5, 2e-5, 3e-5, 5e-5
    weight_decay=0.01,               # Try 0.01, 0.05, 0.1
    warmup_ratio=0.1,                # Try 0.05, 0.1, 0.2
)
```

### Using Different Base Models
Replace `MODEL_NAME = 'distilroberta-base'` with:
- `'roberta-base'` - More powerful but slower (125M params)
- `'distilbert-base-uncased'` - Faster but less accurate (66M params)
- `'bert-base-uncased'` - Classic choice (110M params)

## Monitoring Training

Training logs show:
```
{'loss': 0.3452, 'learning_rate': 1.8e-05, 'epoch': 1.0}
{'eval_loss': 0.2145, 'eval_accuracy': 0.9234, 'epoch': 1.0}
```

Watch for:
- **Loss decreasing** - Model is learning
- **Accuracy increasing** - Performance improving
- **Eval vs Train gap** - Check for overfitting

## License & Citation

If using in research, please cite:
```
@misc{aura-intent-detection,
  title={AURA Intent Detection System},
  author={Your Name},
  year={2025}
}
```

## Support

For issues or questions:
1. Check console output for error messages
2. Verify dataset format matches requirements
3. Ensure all dependencies are installed
4. Check GPU/CUDA compatibility for hardware issues

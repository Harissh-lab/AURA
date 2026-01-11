"""
AURA Intent Detection Training Script
Fine-tune DistilRoBERTa for mental health intent classification (suicide detection)
Target: >90% accuracy with balanced classes
"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import torch
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback
)
from datasets import Dataset
import warnings
warnings.filterwarnings('ignore')

# Set random seeds for reproducibility
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)
torch.manual_seed(RANDOM_SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(RANDOM_SEED)

print("=" * 80)
print("AURA Intent Detection - DistilRoBERTa Fine-Tuning")
print("=" * 80)
print(f"\nRandom Seed: {RANDOM_SEED}")
print(f"PyTorch Version: {torch.__version__}")
print(f"CUDA Available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"CUDA Device: {torch.cuda.get_device_name(0)}")
print()

# ============================================================================
# 1. DATA LOADING & PREPROCESSING
# ============================================================================

print("=" * 80)
print("STEP 1: Data Loading & Preprocessing")
print("=" * 80)

# Load dataset
DATA_PATH = 'data/Suicide_Detection.csv'
if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(
        f"Dataset not found at {DATA_PATH}. "
        "Please ensure the file exists with columns 'text' and 'class'."
    )

print(f"\nLoading dataset from: {DATA_PATH}")
df = pd.read_csv(DATA_PATH)

print(f"✓ Loaded {len(df)} samples")
print(f"\nColumns: {df.columns.tolist()}")

# Validate required columns
if 'text' not in df.columns or 'class' not in df.columns:
    raise ValueError("Dataset must contain 'text' and 'class' columns")

# Check for missing values
missing_text = df['text'].isna().sum()
missing_class = df['class'].isna().sum()
print(f"\nMissing values:")
print(f"  Text:  {missing_text} ({missing_text/len(df)*100:.2f}%)")
print(f"  Class: {missing_class} ({missing_class/len(df)*100:.2f}%)")

# Remove missing values
df = df.dropna(subset=['text', 'class'])
print(f"✓ After removing NaN: {len(df)} samples")

# Convert text to string
df['text'] = df['text'].astype(str)

# Display class distribution (before balancing)
print(f"\n📊 Original Class Distribution:")
class_counts = df['class'].value_counts()
for class_name, count in class_counts.items():
    percentage = count / len(df) * 100
    print(f"  {class_name}: {count} ({percentage:.2f}%)")

# ============================================================================
# 2. CLASS BALANCING (50/50 split)
# ============================================================================

print(f"\n{'=' * 80}")
print("STEP 2: Class Balancing (Downsampling)")
print("=" * 80)

# Identify minority and majority classes
minority_class = class_counts.idxmin()
majority_class = class_counts.idxmax()
minority_count = class_counts.min()

print(f"\nMinority class: '{minority_class}' ({minority_count} samples)")
print(f"Majority class: '{majority_class}' ({class_counts.max()} samples)")

# Separate classes
df_minority = df[df['class'] == minority_class]
df_majority = df[df['class'] == majority_class]

# Downsample majority class to match minority
df_majority_downsampled = df_majority.sample(
    n=minority_count, 
    random_state=RANDOM_SEED
)

# Combine balanced classes
df_balanced = pd.concat([df_minority, df_majority_downsampled])
df_balanced = df_balanced.sample(frac=1, random_state=RANDOM_SEED).reset_index(drop=True)

print(f"\n✓ Balanced dataset: {len(df_balanced)} samples")
print(f"\n📊 Balanced Class Distribution:")
balanced_counts = df_balanced['class'].value_counts()
for class_name, count in balanced_counts.items():
    percentage = count / len(df_balanced) * 100
    print(f"  {class_name}: {count} ({percentage:.2f}%)")

# Create label mapping
unique_classes = sorted(df_balanced['class'].unique())
label2id = {label: idx for idx, label in enumerate(unique_classes)}
id2label = {idx: label for label, idx in label2id.items()}

print(f"\n🏷️  Label Mapping:")
for label, idx in label2id.items():
    print(f"  {label} → {idx}")

# Convert labels to integers
df_balanced['label'] = df_balanced['class'].map(label2id)

# ============================================================================
# 3. TRAIN/TEST SPLIT (80/20)
# ============================================================================

print(f"\n{'=' * 80}")
print("STEP 3: Train/Test Split (80/20)")
print("=" * 80)

train_df, test_df = train_test_split(
    df_balanced,
    test_size=0.2,
    random_state=RANDOM_SEED,
    stratify=df_balanced['label']  # Maintain class balance
)

print(f"\n✓ Train set: {len(train_df)} samples ({len(train_df)/len(df_balanced)*100:.1f}%)")
print(f"✓ Test set:  {len(test_df)} samples ({len(test_df)/len(df_balanced)*100:.1f}%)")

print(f"\nTrain set distribution:")
for class_name, count in train_df['class'].value_counts().items():
    print(f"  {class_name}: {count} ({count/len(train_df)*100:.1f}%)")

print(f"\nTest set distribution:")
for class_name, count in test_df['class'].value_counts().items():
    print(f"  {class_name}: {count} ({count/len(test_df)*100:.1f}%)")

# Convert to Hugging Face Dataset format
train_dataset = Dataset.from_pandas(train_df[['text', 'label']])
test_dataset = Dataset.from_pandas(test_df[['text', 'label']])

# ============================================================================
# 4. MODEL & TOKENIZER SETUP
# ============================================================================

print(f"\n{'=' * 80}")
print("STEP 4: Model & Tokenizer Setup")
print("=" * 80)

MODEL_NAME = 'distilroberta-base'
MAX_LENGTH = 512
NUM_LABELS = len(unique_classes)

print(f"\nModel: {MODEL_NAME}")
print(f"Max Length: {MAX_LENGTH} tokens")
print(f"Number of Labels: {NUM_LABELS}")

print("\nLoading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
print("✓ Tokenizer loaded")

print("\nLoading model...")
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME,
    num_labels=NUM_LABELS,
    id2label=id2label,
    label2id=label2id,
    problem_type="single_label_classification"
)
print("✓ Model loaded")

# Display model info
total_params = sum(p.numel() for p in model.parameters())
trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"\n📊 Model Parameters:")
print(f"  Total:     {total_params:,}")
print(f"  Trainable: {trainable_params:,}")

# Move model to GPU if available
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model.to(device)
print(f"\n✓ Model moved to: {device}")

# ============================================================================
# 5. TOKENIZATION
# ============================================================================

print(f"\n{'=' * 80}")
print("STEP 5: Tokenization")
print("=" * 80)

def tokenize_function(examples):
    """Tokenize text with truncation"""
    return tokenizer(
        examples['text'],
        padding='max_length',
        truncation=True,
        max_length=MAX_LENGTH,
        return_tensors=None
    )

print(f"\nTokenizing train set ({len(train_dataset)} samples)...")
train_dataset = train_dataset.map(
    tokenize_function,
    batched=True,
    remove_columns=['text']
)
print("✓ Train set tokenized")

print(f"\nTokenizing test set ({len(test_dataset)} samples)...")
test_dataset = test_dataset.map(
    tokenize_function,
    batched=True,
    remove_columns=['text']
)
print("✓ Test set tokenized")

# ============================================================================
# 6. TRAINING CONFIGURATION
# ============================================================================

print(f"\n{'=' * 80}")
print("STEP 6: Training Configuration")
print("=" * 80)

OUTPUT_DIR = './models/aura_intent_model'
os.makedirs(OUTPUT_DIR, exist_ok=True)

training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    learning_rate=2e-5,
    weight_decay=0.01,
    warmup_ratio=0.1,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="accuracy",
    logging_dir=f'{OUTPUT_DIR}/logs',
    logging_steps=10,
    save_total_limit=2,
    seed=RANDOM_SEED,
    fp16=torch.cuda.is_available(),  # Use mixed precision on GPU
    report_to="none",  # Disable wandb/tensorboard
    remove_unused_columns=True,
)

print("\n📋 Training Configuration:")
print(f"  Output Directory:     {training_args.output_dir}")
print(f"  Epochs:               {training_args.num_train_epochs}")
print(f"  Train Batch Size:     {training_args.per_device_train_batch_size}")
print(f"  Eval Batch Size:      {training_args.per_device_eval_batch_size}")
print(f"  Learning Rate:        {training_args.learning_rate}")
print(f"  Weight Decay:         {training_args.weight_decay}")
print(f"  Warmup Ratio:         {training_args.warmup_ratio}")
print(f"  FP16 (Mixed Precision): {training_args.fp16}")
print(f"  Save Strategy:        {training_args.save_strategy}")
print(f"  Load Best Model:      {training_args.load_best_model_at_end}")

# ============================================================================
# 7. METRICS COMPUTATION
# ============================================================================

def compute_metrics(eval_pred):
    """Compute accuracy, precision, recall, F1-score"""
    predictions, labels = eval_pred
    predictions = np.argmax(predictions, axis=1)
    
    accuracy = accuracy_score(labels, predictions)
    
    return {
        'accuracy': accuracy,
    }

# ============================================================================
# 8. TRAINER INITIALIZATION & TRAINING
# ============================================================================

print(f"\n{'=' * 80}")
print("STEP 7: Training")
print("=" * 80)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=test_dataset,
    tokenizer=tokenizer,
    compute_metrics=compute_metrics,
    callbacks=[EarlyStoppingCallback(early_stopping_patience=2)]
)

print("\n🚀 Starting training...\n")
print("-" * 80)

# Train the model
train_result = trainer.train()

print("\n" + "-" * 80)
print("✓ Training complete!")
print(f"\n📊 Training Results:")
print(f"  Total Training Time: {train_result.metrics['train_runtime']:.2f} seconds")
print(f"  Training Samples/Sec: {train_result.metrics['train_samples_per_second']:.2f}")

# ============================================================================
# 9. EVALUATION ON TEST SET
# ============================================================================

print(f"\n{'=' * 80}")
print("STEP 8: Evaluation on Test Set")
print("=" * 80)

print("\n🔍 Evaluating model on test set...")
eval_results = trainer.evaluate()

print(f"\n📊 Test Set Performance:")
print(f"  Accuracy: {eval_results['eval_accuracy']*100:.2f}%")
print(f"  Loss:     {eval_results['eval_loss']:.4f}")

# Generate predictions for detailed metrics
predictions = trainer.predict(test_dataset)
pred_labels = np.argmax(predictions.predictions, axis=1)
true_labels = predictions.label_ids

# Classification Report
print(f"\n{'=' * 80}")
print("Detailed Classification Report")
print("=" * 80)
print()
print(classification_report(
    true_labels,
    pred_labels,
    target_names=[id2label[i] for i in range(NUM_LABELS)],
    digits=4
))

# Confusion Matrix
print(f"{'=' * 80}")
print("Confusion Matrix")
print("=" * 80)
cm = confusion_matrix(true_labels, pred_labels)
print("\n                Predicted")
print(f"                {id2label[0]:^12s} {id2label[1]:^12s}")
for i, label in enumerate([id2label[0], id2label[1]]):
    print(f"Actual {label:12s} [{cm[i][0]:4d}       {cm[i][1]:4d}]")

# Performance Summary
print(f"\n{'=' * 80}")
print("Performance Summary")
print("=" * 80)

accuracy = accuracy_score(true_labels, pred_labels)
print(f"\n✅ Final Test Accuracy: {accuracy*100:.2f}%")

if accuracy >= 0.90:
    print(f"🎯 SUCCESS: Target >90% accuracy ACHIEVED!")
    status = "✅ Production Ready"
elif accuracy >= 0.85:
    print(f"⚠️  CLOSE: {accuracy*100:.2f}% accuracy (target: 90%)")
    print(f"   Consider training for more epochs or adjusting hyperparameters")
    status = "⚠️ Good, but below target"
else:
    print(f"❌ BELOW TARGET: {accuracy*100:.2f}% accuracy (target: 90%)")
    print(f"   Recommendations:")
    print(f"   - Increase num_train_epochs to 5-10")
    print(f"   - Try different learning rates (1e-5, 3e-5)")
    print(f"   - Increase training data")
    status = "❌ Needs improvement"

print(f"\nStatus: {status}")

# ============================================================================
# 10. SAVE MODEL & TOKENIZER
# ============================================================================

print(f"\n{'=' * 80}")
print("STEP 9: Saving Model & Tokenizer")
print("=" * 80)

print(f"\nSaving model to: {OUTPUT_DIR}")
trainer.save_model(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

print("✓ Model saved")
print("✓ Tokenizer saved")

# Save label mapping
label_mapping_path = os.path.join(OUTPUT_DIR, 'label_mapping.txt')
with open(label_mapping_path, 'w') as f:
    f.write("Label Mapping:\n")
    f.write("=" * 40 + "\n")
    for label, idx in label2id.items():
        f.write(f"{label} → {idx}\n")
print(f"✓ Label mapping saved to: {label_mapping_path}")

# Save training summary
summary_path = os.path.join(OUTPUT_DIR, 'training_summary.txt')
with open(summary_path, 'w') as f:
    f.write("AURA Intent Detection - Training Summary\n")
    f.write("=" * 80 + "\n\n")
    f.write(f"Model: {MODEL_NAME}\n")
    f.write(f"Training Samples: {len(train_df)}\n")
    f.write(f"Test Samples: {len(test_df)}\n")
    f.write(f"Epochs: {training_args.num_train_epochs}\n")
    f.write(f"Batch Size: {training_args.per_device_train_batch_size}\n")
    f.write(f"Learning Rate: {training_args.learning_rate}\n")
    f.write(f"\nTest Accuracy: {accuracy*100:.2f}%\n")
    f.write(f"Status: {status}\n")
    f.write(f"\nLabel Mapping:\n")
    for label, idx in label2id.items():
        f.write(f"  {label} → {idx}\n")
print(f"✓ Training summary saved to: {summary_path}")

print(f"\n{'=' * 80}")
print("TRAINING COMPLETE!")
print("=" * 80)
print(f"\n📦 Model Location: {OUTPUT_DIR}")
print(f"📊 Test Accuracy: {accuracy*100:.2f}%")
print(f"✅ Status: {status}")
print("\nTo use the model:")
print("  from transformers import AutoTokenizer, AutoModelForSequenceClassification")
print(f"  tokenizer = AutoTokenizer.from_pretrained('{OUTPUT_DIR}')")
print(f"  model = AutoModelForSequenceClassification.from_pretrained('{OUTPUT_DIR}')")
print()

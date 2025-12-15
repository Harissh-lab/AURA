import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from datasets import Dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification, TrainingArguments, Trainer
import torch

# 1. CONFIGURATION
MODEL_NAME = "distilroberta-base"
DATA_FILE = "train_data.csv"  # The file you just created
OUTPUT_DIR = "./models/aura_pro_model"

print(f"INITIALIZING AURA 'PRO' TRAINING PIPELINE")
print(f"   Model: {MODEL_NAME}")
print(f"   Data:  {DATA_FILE}")

# 2. LOAD & PREPARE DATA
try:
    df = pd.read_csv(DATA_FILE)
    print(f"[OK] Loaded {len(df)} samples from {DATA_FILE}")
except FileNotFoundError:
    print(f"[ERROR] Could not find {DATA_FILE}. Did you run prepare_data.py?")
    exit()

# Split: 80% Train, 20% Test
train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df['label'])
print(f"   Training Set: {len(train_df)} samples")
print(f"   Testing Set:  {len(test_df)} samples")

# Convert to HuggingFace Dataset format
train_dataset = Dataset.from_pandas(train_df)
test_dataset = Dataset.from_pandas(test_df)

# 3. TOKENIZATION (Converting words to numbers)
print("\nTokenizing data...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

def tokenize_function(examples):
    return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=128)

tokenized_train = train_dataset.map(tokenize_function, batched=True)
tokenized_test = test_dataset.map(tokenize_function, batched=True)

# 4. INITIALIZE MODEL
print("\nLoading DistilRoBERTa model...")
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=2)

# 5. TRAINING SETUP
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    eval_strategy="epoch",        # Updated parameter name
    save_strategy="epoch",
    learning_rate=2e-5,           # Low learning rate for stability
    per_device_train_batch_size=4, # Reduced batch size for memory
    per_device_eval_batch_size=4,
    num_train_epochs=3,           # 3 loops through the data
    weight_decay=0.01,
    load_best_model_at_end=True,
    logging_steps=50,
    fp16=False,                   # Disable mixed precision for CPU
)

# 6. METRICS FUNCTION (To calculate Accuracy & Recall)
from sklearn.metrics import accuracy_score, recall_score, precision_score, f1_score

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)
    return {
        'accuracy': accuracy_score(labels, predictions),
        'precision': precision_score(labels, predictions),
        'recall': recall_score(labels, predictions),
        'f1': f1_score(labels, predictions)
    }

# 7. TRAIN!
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_train,
    eval_dataset=tokenized_test,
    compute_metrics=compute_metrics,
)

print("\nSTARTING TRAINING (This may take 15-30 minutes)...")
trainer.train()

# 8. FINAL EVALUATION
print("\nFINAL RESULTS:")
results = trainer.evaluate()
print(f"   ACCURACY:  {results['eval_accuracy']*100:.2f}%")
print(f"   RECALL:    {results['eval_recall']*100:.2f}% (Crucial for Safety)")
print(f"   F1 SCORE:  {results['eval_f1']*100:.2f}%")

# Save the final brain
model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)
print(f"\n[OK] Model saved to {OUTPUT_DIR}")
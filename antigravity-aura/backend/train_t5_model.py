"""
T5 Model Training for Empathetic Response Generation
Trains T5-small to generate supportive, empathetic responses for mental health support
"""

import pandas as pd
import numpy as np
from transformers import (
    T5Tokenizer,
    T5ForConditionalGeneration,
    Trainer,
    TrainingArguments,
    DataCollatorForSeq2Seq
)
from datasets import Dataset
from sklearn.model_selection import train_test_split
import torch
import os

def prepare_t5_data(csv_path):
    """Prepare data for T5 training with input-output pairs"""
    print("📊 Loading and preparing data...")
    df = pd.read_csv(csv_path)
    
    # Create input-output pairs for T5
    # Input: user's distressing message
    # Output: empathetic, supportive response
    
    training_data = []
    
    for idx, row in df.iterrows():
        text = str(row['text']).strip()
        label = row['label']
        
        # Create different prompt types for variety
        prompts = [
            f"respond empathetically to: {text}",
            f"provide mental health support for: {text}",
            f"offer compassionate response to: {text}"
        ]
        
        # Generate appropriate responses based on distress level
        if label == 'suicide' or label == 1:
            responses = [
                "I hear that you're going through an incredibly difficult time. Your feelings are valid, and you don't have to face this alone. Please reach out to a crisis counselor who can provide immediate support. Would you like me to share some resources?",
                "Thank you for sharing this with me. What you're experiencing sounds overwhelming, and I'm concerned about your safety. Please consider contacting a crisis helpline immediately - they have trained professionals available 24/7 who care and want to help.",
                "I can sense you're in deep pain right now. Please know that these feelings, while intense, can change with proper support. Your life has value, and there are people who want to help you through this. Can we connect you with crisis support?"
            ]
        else:
            responses = [
                "Thank you for sharing your thoughts with me. It takes courage to express how you're feeling. What would be most helpful for you right now?",
                "I appreciate you opening up about this. Everyone goes through challenging times, and it's important to acknowledge these feelings. How can I support you today?",
                "I hear you, and your feelings are completely valid. Remember that difficult moments are temporary, and there are always ways forward. What matters most to you right now?"
            ]
        
        # Create multiple training examples from each input
        for prompt in prompts[:2]:  # Use 2 prompt variations
            for response in responses[:2]:  # Use 2 response variations
                training_data.append({
                    'input_text': prompt,
                    'target_text': response,
                    'label': label
                })
    
    print(f"✅ Created {len(training_data)} training examples")
    return training_data

def train_t5_model(csv_path='../train_data.csv', output_dir='../models/aura_t5_model'):
    """Train T5 model for empathetic response generation"""
    
    print("🚀 Starting T5 Model Training for AURA")
    print("=" * 60)
    
    # Set device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"💻 Using device: {device}")
    
    # Prepare data
    training_data = prepare_t5_data(csv_path)
    df = pd.DataFrame(training_data)
    
    # Split data
    train_df, test_df = train_test_split(df, test_size=0.1, random_state=42, stratify=df['label'])
    train_df, val_df = train_test_split(train_df, test_size=0.1, random_state=42, stratify=train_df['label'])
    
    print(f"📊 Data splits:")
    print(f"   - Training: {len(train_df)} examples")
    print(f"   - Validation: {len(val_df)} examples")
    print(f"   - Test: {len(test_df)} examples")
    
    # Initialize tokenizer and model
    print("\n🔧 Loading T5-small model and tokenizer...")
    tokenizer = T5Tokenizer.from_pretrained('t5-small')
    model = T5ForConditionalGeneration.from_pretrained('t5-small')
    model.to(device)
    
    # Tokenization function
    def tokenize_function(examples):
        inputs = tokenizer(
            examples['input_text'],
            max_length=128,
            truncation=True,
            padding='max_length'
        )
        targets = tokenizer(
            examples['target_text'],
            max_length=256,
            truncation=True,
            padding='max_length'
        )
        inputs['labels'] = targets['input_ids']
        return inputs
    
    # Create datasets
    train_dataset = Dataset.from_pandas(train_df[['input_text', 'target_text']])
    val_dataset = Dataset.from_pandas(val_df[['input_text', 'target_text']])
    test_dataset = Dataset.from_pandas(test_df[['input_text', 'target_text']])
    
    # Tokenize datasets
    print("🔤 Tokenizing datasets...")
    train_dataset = train_dataset.map(tokenize_function, batched=True, remove_columns=['input_text', 'target_text'])
    val_dataset = val_dataset.map(tokenize_function, batched=True, remove_columns=['input_text', 'target_text'])
    test_dataset = test_dataset.map(tokenize_function, batched=True, remove_columns=['input_text', 'target_text'])
    
    # Set format for PyTorch
    train_dataset.set_format(type='torch')
    val_dataset.set_format(type='torch')
    test_dataset.set_format(type='torch')
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        eval_strategy='steps',
        eval_steps=100,
        save_strategy='steps',
        save_steps=100,
        learning_rate=3e-4,
        per_device_train_batch_size=4,
        per_device_eval_batch_size=4,
        num_train_epochs=3,
        weight_decay=0.01,
        save_total_limit=2,
        load_best_model_at_end=True,
        metric_for_best_model='loss',
        greater_is_better=False,
        warmup_steps=100,
        logging_steps=50,
        logging_dir=f'{output_dir}/logs',
        report_to='none',
        push_to_hub=False,
    )
    
    # Data collator
    data_collator = DataCollatorForSeq2Seq(tokenizer=tokenizer, model=model)
    
    # Initialize trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        tokenizer=tokenizer,
        data_collator=data_collator,
    )
    
    # Train
    print("\n🎯 Starting training...")
    print("=" * 60)
    trainer.train()
    
    # Evaluate on test set
    print("\n📊 Evaluating on test set...")
    test_results = trainer.evaluate(test_dataset)
    print("\n✅ Test Results:")
    print(f"   - Test Loss: {test_results['eval_loss']:.4f}")
    
    # Save model and tokenizer
    print(f"\n💾 Saving model to {output_dir}...")
    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)
    
    # Test model with sample inputs
    print("\n🧪 Testing model with sample inputs...")
    print("=" * 60)
    
    test_inputs = [
        "respond empathetically to: I feel like nobody understands me anymore",
        "provide mental health support for: I'm struggling to get out of bed",
        "offer compassionate response to: Everything feels overwhelming"
    ]
    
    model.eval()
    for test_input in test_inputs:
        input_ids = tokenizer(test_input, return_tensors='pt', max_length=128, truncation=True).input_ids.to(device)
        
        with torch.no_grad():
            outputs = model.generate(
                input_ids,
                max_length=256,
                num_beams=4,
                early_stopping=True,
                temperature=0.7,
                do_sample=False
            )
        
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        print(f"\n📝 Input: {test_input.split(': ')[1]}")
        print(f"💬 Response: {response}")
    
    print("\n" + "=" * 60)
    print("✅ T5 Model Training Complete!")
    print(f"📁 Model saved to: {output_dir}")
    print(f"📊 Test Loss: {test_results['eval_loss']:.4f}")
    print("=" * 60)
    
    return {
        'test_loss': test_results['eval_loss'],
        'output_dir': output_dir,
        'num_examples': len(training_data)
    }

if __name__ == '__main__':
    results = train_t5_model()

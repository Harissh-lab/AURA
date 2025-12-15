# 🔧 Gemini API Quick Fix Guide

## Problem Identified

Your Gemini API is not working due to:
1. **Quota Exceeded** (429 error) - Free tier limit reached
2. **Outdated Model Names** (404 errors) - Model names have changed

---

## Solution 1: Check and Fix Quota

### Step 1: Check Your Quota
1. Go to: https://console.cloud.google.com/
2. Select your project
3. Navigate to: **APIs & Services** → **Enabled APIs**
4. Find **Generative Language API**
5. Click **Quotas** tab

### Step 2: Check Current Usage
```
Look for:
- "Requests per minute"
- "Requests per day"
- Current usage vs. limit
```

### Step 3: Fix Quota Issues

#### Option A: Wait (Free Tier)
If you're on free tier and hit daily limit:
- **Wait 24 hours** for quota to reset
- Free tier: 60 requests/minute, 1,500 requests/day

#### Option B: Enable Billing
If you need more quota:
1. Go to **Billing** in Cloud Console
2. Click **Link a billing account**
3. Add payment method
4. Billing unlocks higher quotas

#### Option C: Request Quota Increase
1. In Quotas page, select the quota
2. Click **Edit Quotas**
3. Enter new limit request
4. Submit (usually approved in 24-48 hours)

---

## Solution 2: Update Model Names

### Current Model Names (Outdated)
```python
# In backend/app.py - These are WRONG:
model_names = [
    'models/gemini-2.5-flash',      # ❌ Doesn't exist
    'models/gemini-flash-latest',   # ❌ Wrong format
    'models/gemini-2.0-flash'       # ❌ Doesn't exist
]
```

### Correct Model Names (Updated)
```python
# Replace with these:
model_names = [
    'gemini-1.5-flash-latest',      # ✅ Current version
    'gemini-1.5-pro-latest',        # ✅ Pro version
    'gemini-pro',                   # ✅ Fallback
]
```

### Quick Fix - Update app.py

**File**: `backend/app.py`
**Line**: ~105

**Replace this**:
```python
model_names = ['models/gemini-2.5-flash', 'models/gemini-flash-latest', 'models/gemini-2.0-flash']
```

**With this**:
```python
model_names = ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-pro']
```

---

## Solution 3: Test Gemini API

### Quick Test Script
Run this to find working models:

```python
# backend/test_gemini.py
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    
    print("Available Gemini Models:")
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            print(f"✅ {model.name}")
    
    print("\nTesting models...")
    test_models = [
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro-latest',
        'gemini-pro',
        'gemini-1.0-pro'
    ]
    
    for model_name in test_models:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Say hello")
            print(f"✅ {model_name}: {response.text[:50]}...")
        except Exception as e:
            print(f"❌ {model_name}: {str(e)[:50]}...")
else:
    print("❌ GEMINI_API_KEY not found in .env")
```

Run it:
```bash
cd backend
python test_gemini.py
```

---

## Solution 4: Alternative - Use Older API Version

If new models don't work, try older API:

```python
# backend/app.py
import google.generativeai as genai

# Use legacy model names
genai.configure(api_key=GEMINI_API_KEY)

# Try these older, stable models:
try:
    model = genai.GenerativeModel('gemini-1.0-pro')
    # or
    model = genai.GenerativeModel('gemini-pro')
except:
    print("❌ Gemini API not available")
```

---

## Expected Results

### After Fixing Quota
```
✅ API calls work again
✅ No more 429 errors
✅ Chatbot can generate novel responses
```

### After Updating Model Names
```
✅ No more 404 errors
✅ Models load successfully
✅ Responses generate correctly
```

### Test Output (Success)
```
✅ Gemini AI initialized successfully with model: gemini-1.5-flash-latest
✅ ML distress detector loaded successfully
   📊 Gold Standard Test Performance:
      Accuracy:  66.96%
      Recall:    88.98%
```

---

## Troubleshooting

### Error: "403 Forbidden"
**Cause**: API not enabled for your project
**Fix**:
1. Go to: https://console.cloud.google.com/apis/library
2. Search for "Generative Language API"
3. Click **Enable**

### Error: "Invalid API Key"
**Cause**: Wrong API key in .env
**Fix**:
1. Get new key: https://makersuite.google.com/app/apikey
2. Update `.env`:
   ```
   GEMINI_API_KEY=your_new_key_here
   ```
3. Restart backend server

### Error: "Model not found"
**Cause**: Model name typo or deprecated
**Fix**: Run `test_gemini.py` to list available models

### Still Not Working?
Try completely removing model name prefix:

```python
# Instead of:
model = genai.GenerativeModel('models/gemini-pro')

# Try:
model = genai.GenerativeModel('gemini-pro')
```

---

## Quick Checklist

- [ ] Check quota in Google Cloud Console
- [ ] Wait 24 hours if free tier limit hit
- [ ] Update model names in `backend/app.py`
- [ ] Create and run `test_gemini.py`
- [ ] Verify API key in `.env` file
- [ ] Check if API is enabled in Cloud Console
- [ ] Restart backend server after changes

---

## Priority Fix Command

**Run this ONE command to fix model names**:

```python
# In backend/app.py, find this line (~line 105):
model_names = ['models/gemini-2.5-flash', 'models/gemini-flash-latest', 'models/gemini-2.0-flash']

# Replace with:
model_names = ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-pro']
```

Then restart:
```bash
cd backend
python app.py
```

---

**Status**: Gemini API is currently BROKEN (429 + 404 errors)
**Impact**: Chatbot can only use dataset, cannot generate novel responses
**Priority**: 🔴 CRITICAL - Fix immediately
**Estimated Fix Time**: 5-10 minutes (model names) or 24 hours (quota reset)

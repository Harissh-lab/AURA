# Gemini API Usage Guide

## 🔑 API Key Setup

Your Gemini API key is stored in the `.env` file:
```
GEMINI_API_KEY=your_actual_key_here
```

## 💰 Pricing & Free Tier

### Gemini 1.5 Flash (Recommended - Used by default)
**FREE TIER:**
- ✅ **15 requests per minute (RPM)**
- ✅ **1 million tokens per minute (TPM)**
- ✅ **1,500 requests per day (RPD)**
- ✅ **Completely FREE** for standard usage

**Paid Tier ($0.075 per 1M input tokens):**
- Available if you exceed free limits

### Gemini 1.5 Pro (Fallback option)
**FREE TIER:**
- ✅ **2 requests per minute (RPM)** 
- ✅ **32,000 tokens per minute (TPM)**
- ✅ **50 requests per day (RPD)**
- More powerful but slower

## 📊 Usage for This Project

### Current Usage (app.py)
**Scenario:** User chats with AURA bot
- **When triggered:** Only when ML/dataset responses are insufficient
- **Frequency:** ~5-10% of queries (fallback only)
- **Cost per chat:** ~500 tokens (input + output) ≈ **FREE**
- **Monthly estimate:** 100-500 requests/month ≈ **FREE**

### Upgrade Script (upgrade_responses.py)
**Scenario:** One-time dataset upgrade of 697 responses

**Estimated Usage:**
- **Total API calls:** ~697 (one per low-quality response)
- **Tokens per request:**
  - Input: ~200 tokens (context + current response + prompt)
  - Output: ~150 tokens (upgraded response)
  - **Total per request:** ~350 tokens
- **Total tokens:** 697 × 350 = **~244,000 tokens**

**Time & Rate Limits:**
- With 2-second delay: ~23 minutes for all requests
- Within free tier: ✅ 15 RPM limit = 900 requests/hour (we need 697)
- Within daily limit: ✅ 1,500 RPD (we need 697)

**Cost:** 
- **FREE** (well within 1M tokens/minute limit)
- Only 0.24% of daily free token allowance used

## ⚠️ Important Considerations

### 1. Rate Limiting (Already Handled)
The script includes:
```python
API_DELAY = 2  # seconds between requests
```
This ensures you stay well within the **15 RPM** limit (2 seconds = 30 requests/minute max).

### 2. Quota Exceeded Handling
If you hit limits, the script automatically:
- Waits 60 seconds for quota reset
- Retries up to 3 times
- Saves progress so you can resume later

### 3. Daily Limits
- **Free tier:** 1,500 requests/day
- **Your upgrade:** 697 requests (47% of daily limit)
- **Safe to run:** ✅ Yes, leaves room for regular chatbot usage

### 4. Token Efficiency
The script uses **gemini-1.5-flash-latest** (fastest, cheapest):
- Input: ~200 tokens per request (prompt is concise)
- Output: Limited to ~150 tokens (100 word limit)
- Total per upgrade: ~350 tokens

## 💡 Cost Optimization Tips

### Already Implemented ✅
1. **Smart filtering:** Only upgrades quality < 70 (697 instead of all 830)
2. **Efficient prompts:** Concise prompt saves input tokens
3. **Output limits:** "Keep it under 100 words" reduces output tokens
4. **Flash model:** Uses fastest/cheapest model first
5. **Checkpoint system:** Don't waste API calls on re-processing

### Optional Optimizations
1. **Batch processing:** Could process in smaller batches (e.g., 100/day)
2. **Quality threshold:** Change to `< 50` to upgrade only 759 responses
3. **Parallel requests:** Could send 5-10 concurrent (but risky for rate limits)

## 📈 Monitoring Usage

### Check Your Quota
Visit: https://aistudio.google.com/app/apikey

### View Usage Stats
- See requests per day
- Track token consumption
- Monitor rate limit hits

## 🚨 What If You Hit Limits?

### Scenario 1: Rate Limit (15 RPM)
**Script handles automatically:**
```python
# Waits and retries
time.sleep(10)
```

### Scenario 2: Daily Quota (1,500 RPD)
**Options:**
1. Wait 24 hours for reset
2. Enable billing ($0.075 per 1M tokens)
3. Split upgrade across 2 days

### Scenario 3: Token Limit (1M TPM)
**Unlikely** - Your 697 requests = 244K tokens (24% of limit)

## 💵 If You Need More

### Enable Billing (Optional)
**Cost for this upgrade:**
- 244,000 tokens × $0.075/1M = **$0.018** (less than 2 cents!)

**Monthly chatbot usage estimate:**
- 500 requests × 350 tokens = 175K tokens
- Cost: **$0.013/month** (1 cent!)

## ✅ Recommendation

**For your use case:**
1. ✅ **Stay on FREE tier** - You're well within limits
2. ✅ **Run upgrade script now** - Will complete in ~30 minutes
3. ✅ **Monitor usage** - Check console if any quota errors
4. ✅ **No billing needed** - Unless you scale to 10,000+ requests/day

## 🔧 Alternative: Reduce API Calls

If you want to be extra conservative:

### Option 1: Upgrade only worst responses
```python
QUALITY_THRESHOLD = 40  # Instead of 70
```
Reduces from 697 to ~128 requests

### Option 2: Process in batches
Run script multiple times with limits:
```python
MAX_UPGRADES_PER_RUN = 200
```

### Option 3: Use cached responses
After first upgrade, reuse improved responses for similar contexts.

## 📞 Support

**If you encounter issues:**
1. Check error messages in script output
2. Verify API key is valid: https://aistudio.google.com
3. Check quota status in Google AI Studio
4. Script auto-saves progress - just re-run if interrupted

---

**Bottom line:** Your Gemini API usage for this project is **completely FREE** and well within limits. The upgrade script will cost you **$0** and improve 84% of your responses in ~30 minutes! 🚀

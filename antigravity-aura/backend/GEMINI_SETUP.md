# 🤖 Gemini AI Setup Guide

Your AURA chatbot is currently **working with the trained model**. Follow these steps to enable AI-powered responses:

## 🚀 Quick Setup (2 minutes)

### Step 1: Get Your Gemini API Key

1. Visit: **https://makersuite.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the API key (starts with `AIza...`)

### Step 2: Configure the API Key

1. Open the file: `backend/.env`
2. Replace `your_gemini_api_key_here` with your actual API key:

```env
GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Restart the Backend

In your terminal, press `Ctrl+C` to stop the backend, then restart:

```powershell
cd backend
python app.py
```

## ✨ How It Works

### Without API Key (Current State)
- ✅ Bot responds using **trained model** (1,071 patterns)
- ✅ Pattern matching with TF-IDF + cosine similarity
- ⚡ Fast, offline, reliable

### With API Key (Enhanced)
- 🤖 Bot uses **Google Gemini AI** for responses
- 💬 More contextual, natural conversations
- 🎭 Better understanding of emotions
- 📚 Fallback to trained model if Gemini fails

## 🎯 Testing

After adding your API key, test both modes:

### Friend Mode
```
You: "I'm feeling anxious about tomorrow"
Aura: [Casual, empathetic AI response]
```

### Professional Mode
```
You: "I've been having panic attacks"
Aura: [Therapeutic, clinical AI response]
```

## 📊 System Status

Check if Gemini is active by visiting: http://localhost:5000

Look for:
```json
{
  "status": "ok",
  "ai_provider": "Gemini AI"  // ✅ Gemini active
}
```

Or:
```json
{
  "status": "ok",
  "ai_provider": "Trained Model"  // ⚠️ Using fallback
}
```

## 🔒 Security Notes

- **Never commit** `.env` file to GitHub (already in `.gitignore`)
- Keep your API key **private**
- Google provides **free tier**: 60 requests/minute

## 🆘 Troubleshooting

### "No API key found" message
- Check `.env` file exists in `backend/` folder
- Verify API key starts with `AIza`
- Restart backend server

### "Invalid API key" error
- Regenerate key at https://makersuite.google.com/app/apikey
- Check for extra spaces in `.env` file

### Bot still using trained model
- Verify backend restarted after adding API key
- Check terminal for error messages
- Test with `/` endpoint to see active provider

## 💡 Tips

1. **Keep trained model**: Even with Gemini, the model provides instant fallback
2. **Monitor usage**: Check Google AI Studio for API quota
3. **Test both modes**: Professional mode gives clinical responses, Friend mode is casual
4. **Rate limits**: Free tier = 60 requests/min (plenty for testing)

---

**Current Status**: ✅ Trained model working perfectly  
**Next Step**: Add Gemini API key for AI enhancement  
**ETA**: 2 minutes to full AI power! 🚀

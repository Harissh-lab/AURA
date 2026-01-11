# Quick Start: Testing Emotion Tracking

## 🚀 Start the Application

1. **Start Frontend:**
   ```bash
   npm run dev
   ```
   The app will run on http://localhost:5173

2. **Start Backend (in a separate terminal):**
   ```bash
   cd backend
   Start-Process python -ArgumentList "app.py" -NoNewWindow -PassThru
   ```
   Backend will run on http://127.0.0.1:5000

## 🧪 Test Emotion Tracking

### Step 1: Chat with AURA
1. Log in to the application
2. Navigate to the **Chat Bot** section
3. Start a conversation with emotional content

### Step 2: Try Different Moods

**Happy Messages (Positive):**
```
"I'm feeling great today! Had an amazing morning."
"I love how things are going. Feeling wonderful!"
"Such a fantastic day! I'm so excited about my project."
```

**Sad Messages (Negative):**
```
"I'm feeling really down today. Everything seems overwhelming."
"I'm so stressed and anxious about work. Can't seem to focus."
"Feeling lonely and sad. Don't know what to do."
```

**Neutral Messages:**
```
"Just having a regular day. Nothing special."
"Feeling okay, I guess. Just normal stuff."
"It's alright. Nothing to complain about."
```

### Step 3: Check Automatic Tracking

After every **3 user messages**, the system will:
- ✅ Analyze your emotional tone
- ✅ Calculate sentiment score
- ✅ Save mood entry to Firebase
- ✅ Continue tracking silently in background

You'll see console logs like:
```
✅ Mood entry saved: happy (sentiment: 0.75)
```

### Step 4: View Progress Tracking

1. Navigate to **Progress Tracking** page
2. You should see:
   - **Statistics Cards** updated with your mood counts
   - **Mood Trends Tab** showing your recent entries
   - **Session History Tab** showing chat sessions

### Step 5: Test Session Tracking

1. Chat for a few minutes (send several messages)
2. Navigate away from the chat (go to Progress Tracking)
3. The session will be automatically saved with:
   - Duration (how long you chatted)
   - Message count
   - Average sentiment

## 🔍 Verify in Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your AURA project
3. Go to **Firestore Database**
4. Check these collections:
   - **moodEntries**: See your mood recordings
   - **sessions**: See your chat sessions

## 📊 Expected Results

### After 3 Messages:
```
moodEntries Collection:
{
  mood: "happy",
  sentiment: 0.75,
  note: "I'm feeling great today! Had an amazing morning...",
  messageCount: 3,
  date: "2024-12-15"
}
```

### After Leaving Chat:
```
sessions Collection:
{
  type: "AI Chat Support",
  duration: "5 min",
  messageCount: 10,
  sentiment: 0.5,
  date: "2024-12-15"
}
```

### Progress Tracking Page:
```
Statistics:
- Happy Days: 2
- Neutral Days: 1
- Total Sessions: 3

Mood Trends:
✅ Happy - "I'm feeling great today..." - Dec 15, 2024
😐 Neutral - "Just having a regular day..." - Dec 14, 2024

Session History:
🕐 AI Chat Support - 5 min - 10 messages - Dec 15, 2024
```

## 🐛 Troubleshooting

### No mood entries showing?
- Make sure you're logged in
- Send at least 3 messages
- Check browser console for errors
- Verify Firebase connection

### Statistics not updating?
- Refresh the Progress Tracking page
- Check if data exists in Firebase console
- Ensure you're logged in with the same account

### Session not saving?
- Make sure you chat for at least 1 minute
- Navigate away from chat to trigger save
- Check Firebase console for session data

## ✅ Success Indicators

You'll know it's working when:
1. ✅ Console shows "Mood entry saved" after 3 messages
2. ✅ Progress Tracking page shows real data (not empty)
3. ✅ Statistics cards show non-zero counts
4. ✅ Firebase console contains your mood entries
5. ✅ Session appears after leaving chat

## 🎉 You're All Set!

The emotion tracking system is now fully functional. Every conversation with AURA will be analyzed and tracked automatically, helping you monitor your emotional wellness over time.

Happy chatting! 😊

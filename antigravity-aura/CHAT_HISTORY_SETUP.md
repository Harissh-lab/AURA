# 💬 Chat History Setup - Firebase & Frontend Integration

## ✅ What's Been Added

Your chat history is now saved in **both Firebase Firestore and frontend**:
- ✅ All messages automatically saved to Firestore
- ✅ Chat history loads when you open ChatBot
- ✅ Messages persist across sessions
- ✅ User-specific chat isolation
- ✅ Distress detection saved with messages

## 🔥 Firestore Setup Required

### Step 1: Enable Firestore

1. Go to [Firebase Console](https://console.firebase.google.com/project/aura-694bb)
2. Click **Build > Firestore Database**
3. Click **Create database**
4. Choose **Production mode** (we'll add rules next)
5. Select location closest to you (e.g., `us-central` or `asia-south1`)

### Step 2: Set Up Security Rules

In Firestore > **Rules** tab, paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chat history - users can only access their own messages
    match /chatHistory/{messageId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
                      request.auth.uid == request.resource.data.userId;
    }
    
    // User profiles (optional for future use)
    match /users/{userId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == userId;
    }
  }
}
```

Click **Publish** to save the rules.

### Step 3: Create Firestore Index

When you first try to load chat history, you may see an error with a URL. 

**Either:**
- Click the URL in the browser console to auto-create the index

**Or manually create:**
1. Go to **Firestore > Indexes** tab
2. Click **Create Index**
3. Collection ID: `chatHistory`
4. Fields to index:
   - `userId` - Ascending
   - `timestamp` - Ascending
5. Query scope: `Collection`
6. Click **Create**

Wait 2-3 minutes for the index to build.

## 📁 New Files Created

### [src/services/chatHistoryService.ts](src/services/chatHistoryService.ts)

Functions available:
- `saveChatMessage(message)` - Save a message to Firestore
- `loadChatHistory()` - Load all messages for current user
- `getRecentChatHistory(limit)` - Get last N messages
- `clearChatHistory()` - Delete all user's messages

### [src/components/ChatBot.tsx](src/components/ChatBot.tsx) (Modified)

Changes:
- ✅ Loads chat history on mount
- ✅ Saves every message to Firestore
- ✅ Saves user messages, bot responses, and crisis alerts
- ✅ Shows welcome message only for new users
- ✅ Handles loading errors gracefully

## 🎯 How It Works

### Message Flow:

```
User types message
    ↓
1. Save to frontend state (instant display)
2. Save to Firestore (background)
    ↓
Send to backend API
    ↓
Receive bot response
    ↓
3. Save to frontend state
4. Save to Firestore
    ↓
Display in chat
```

### Data Structure in Firestore:

```javascript
chatHistory/{messageId}
{
  userId: "abc123...",
  text: "Hello, how are you?",
  sender: "user" | "bot",
  timestamp: Firestore.Timestamp,
  isDistress: false,
  source: "gemini" | "t5_model" | null,
  createdAt: Firestore.Timestamp
}
```

## 🧪 Testing

1. **Enable Firestore** in Firebase Console
2. **Set up security rules** (copy from above)
3. **Reload your app** at http://localhost:5174
4. **Login** with your account
5. **Open ChatBot** and send a message
6. **Check Firestore Console** → Data tab → `chatHistory` collection
7. **Refresh the app** → Messages should load from Firestore

## 🔍 Troubleshooting

### "Missing or insufficient permissions"
- Check that security rules are published
- Make sure you're logged in
- Verify `userId` matches in Firestore

### "The query requires an index"
- Click the URL in browser console
- Or manually create index (see Step 3 above)
- Wait 2-3 minutes for index to build

### Messages not loading
- Check browser console for errors
- Verify Firestore is enabled
- Check that chatHistory collection exists
- Ensure user is authenticated

### Messages not saving
- Check network tab for Firestore errors
- Verify security rules allow writes
- Check that `auth` is initialized

## 📊 Firestore Console

View your data:
- **Chat History**: https://console.firebase.google.com/project/aura-694bb/firestore/data/chatHistory
- **Security Rules**: https://console.firebase.google.com/project/aura-694bb/firestore/rules
- **Indexes**: https://console.firebase.google.com/project/aura-694bb/firestore/indexes

## 🚀 Optional Enhancements

### 1. Add Chat Sessions
Group messages by date/session:
```typescript
// Add sessionId to messages
sessionId: new Date().toISOString().split('T')[0] // "2025-12-17"
```

### 2. Export Chat History
```typescript
import { clearChatHistory } from '../services/chatHistoryService';

// Add button to ChatBot
<button onClick={async () => {
  if (confirm('Delete all messages?')) {
    await clearChatHistory();
    setMessages([]);
  }
}}>Clear History</button>
```

### 3. Search Chat History
```typescript
const searchMessages = async (searchTerm: string) => {
  const allMessages = await loadChatHistory();
  return allMessages.filter(m => 
    m.text.toLowerCase().includes(searchTerm.toLowerCase())
  );
};
```

### 4. Message Reactions
```typescript
// Add to Firestore schema
reactions: {
  helpful: true,
  notHelpful: false
}
```

## 🔐 Privacy & Security

- ✅ **User Isolation**: Users can only see their own messages
- ✅ **Authentication Required**: Must be logged in to access
- ✅ **Encrypted in Transit**: HTTPS + Firebase encryption
- ✅ **No Cross-User Access**: Security rules prevent data leaks

## 📈 Data Usage

Average message size: ~500 bytes
- 1,000 messages = 500 KB
- 10,000 messages = 5 MB
- Firebase free tier: 1 GB storage + 10 GB/month bandwidth

## ✨ Ready!

Your chat history is now fully integrated! Messages will:
1. ✅ Display instantly in the frontend
2. ✅ Save to Firestore automatically
3. ✅ Load when you open ChatBot
4. ✅ Persist across sessions and devices

Just enable Firestore in Firebase Console and set up the security rules above!

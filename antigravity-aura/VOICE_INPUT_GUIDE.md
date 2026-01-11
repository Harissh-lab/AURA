# 🎤 Multi-Language Voice Input Feature

## Overview
The AURA chatbot now supports **real-time voice input** in **30+ languages** using the Web Speech API. Users can speak naturally in their preferred language, and their speech will be automatically transcribed to text.

## ✨ Features

### 🌍 Multi-Language Support
- **30+ languages** including:
  - English (US, UK)
  - **Indian Languages**: Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, Punjabi
  - Spanish (Spain, Mexico)
  - French, German, Italian
  - Portuguese (Brazil, Portugal)
  - Russian, Japanese, Korean
  - Chinese (Mandarin - Simplified & Traditional)
  - Arabic, Turkish, Dutch, Polish, Swedish
  - Thai, Vietnamese, Indonesian
  - And more!

### 🎯 Key Capabilities
- **Real-time transcription** with interim results
- **Visual feedback** while speaking
- **Language switching** on the fly
- **Error handling** for permissions and network issues
- **Browser compatibility** detection

## 🚀 How to Use

### Step 1: Click the Microphone Button
- Look for the 🎤 **microphone icon** in the chat input area
- The microphone button shows the currently selected language flag

### Step 2: Select Your Language (Optional)
1. Click the 🌐 **Globe icon** to open the language selector
2. Choose your preferred language from the list
3. Your selection will be saved for the session

### Step 3: Start Speaking
1. Click the **microphone button** to start recording
2. You'll see:
   - A **red pulsing animation** indicating recording is active
   - **Live transcription** appearing above the input box
   - Status showing which language you're speaking in

### Step 4: Stop and Send
1. Click the **microphone button again** to stop recording
2. Your transcribed text will appear in the input box
3. Click **Send** or press **Enter** to send the message

## 🎨 Visual Indicators

### Recording States
- **🔴 Red pulsing button**: Currently recording
- **🟢 Green mic button**: Ready to record
- **💬 Blue overlay**: Live transcription in progress

### Language Display
- **Globe button** with language flag badge
- **Current language** shown below input area
- **Selected language** highlighted in language picker

## ⚙️ Technical Details

### Browser Support
The voice input feature works best on:
- ✅ **Google Chrome** (Desktop & Mobile)
- ✅ **Microsoft Edge**
- ✅ **Safari** (macOS & iOS)
- ⚠️ **Firefox** (Limited support)

### Permissions Required
- 🎤 **Microphone access**: Required for voice input
- The browser will ask for permission on first use
- You can manage permissions in browser settings

### How It Works
1. **Web Speech API**: Uses browser's built-in speech recognition
2. **Real-time Processing**: Transcribes speech as you speak
3. **Multi-language Engine**: Automatically adapts to selected language
4. **Continuous Mode**: Can record longer messages

## 🛠️ Implementation

### New Files Created
- **`src/services/speechService.ts`**: Core speech recognition service
  - Handles initialization and configuration
  - Manages recording lifecycle
  - Provides multi-language support

### Updated Files
- **`src/components/ChatBot.tsx`**: Enhanced with voice features
  - Added language selector UI
  - Integrated real-time transcription
  - Added visual feedback and error handling

## 📱 Use Cases

### Mental Health Support
- Easier for users in distress to speak rather than type
- More natural, conversational interaction
- Supports users in their native language for better expression

### Accessibility
- Helps users with typing difficulties
- Voice is faster than typing for many users
- Supports users who are more comfortable speaking

### Multi-lingual Users
- Switch between languages easily
- Support for regional dialects
- Inclusive for non-English speakers

## 🔒 Privacy & Security

### Data Privacy
- ✅ Speech processing happens **locally in your browser**
- ✅ No audio is sent to external servers
- ✅ Transcripts are treated like typed messages
- ✅ Same end-to-end encryption applies

### Best Practices
- Use in a private environment
- Ensure microphone permissions are only for trusted sites
- Review transcription before sending

## 🐛 Troubleshooting

### "Speech recognition not supported"
- **Solution**: Use Chrome, Edge, or Safari
- Firefox has limited support for Web Speech API

### "Microphone permission denied"
- **Solution**: 
  1. Click the 🔒 lock icon in address bar
  2. Allow microphone access
  3. Refresh the page

### "No speech detected"
- **Solution**:
  - Check microphone is working
  - Speak closer to the microphone
  - Check system audio settings
  - Ensure microphone isn't muted

### Wrong language detected
- **Solution**:
  - Click the Globe icon
  - Select the correct language
  - Try recording again

### Network errors
- **Solution**:
  - Check internet connection
  - Some browsers require internet for speech recognition
  - Try again when connection is stable

## 🎯 Tips for Best Results

1. **Speak clearly** and at a normal pace
2. **Minimize background noise**
3. **Use a good microphone** (headset recommended)
4. **Select the correct language** before recording
5. **Review transcription** before sending
6. **Speak in phrases** rather than single words

## 🔄 Future Enhancements

Potential improvements for future versions:
- [ ] Offline speech recognition support
- [ ] Custom vocabulary for mental health terms
- [ ] Voice activity detection
- [ ] Multi-speaker support
- [ ] Punctuation commands
- [ ] Voice commands ("send", "clear", etc.)

## 📞 Support

If you encounter any issues:
1. Check browser compatibility
2. Verify microphone permissions
3. Try a different browser
4. Check the browser console for error messages

## 🎉 Summary

The multi-language voice input feature makes AURA more accessible, user-friendly, and inclusive. Users can now:
- ✅ Speak in 30+ languages
- ✅ See real-time transcription
- ✅ Switch languages easily
- ✅ Get instant visual feedback
- ✅ Enjoy a more natural chat experience

**Your voice matters. Speak freely. AURA is listening.** 🎤💙

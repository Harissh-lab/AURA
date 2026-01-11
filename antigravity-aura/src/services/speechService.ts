// Speech Recognition Service with Multi-Language Support

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechRecognitionOptions {
  language: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

// Supported languages - Indian languages first
export const SUPPORTED_LANGUAGES = [
  // Top Indian Languages (Primary)
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te-IN', name: 'Telugu', flag: '🇮🇳' },
  { code: 'mr-IN', name: 'Marathi', flag: '🇮🇳' },
  { code: 'bn-IN', name: 'Bengali', flag: '🇮🇳' },
  { code: 'gu-IN', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'Kannada', flag: '🇮🇳' },
  { code: 'ml-IN', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'pa-IN', name: 'Punjabi', flag: '🇮🇳' },
  
  // English
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  
  // Other Languages
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Mexico)', flag: '🇲🇽' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Portuguese (PT)', flag: '🇵🇹' },
  { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (TW)', flag: '🇹🇼' },
  { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' },
  { code: 'tr-TR', name: 'Turkish', flag: '🇹🇷' },
  { code: 'nl-NL', name: 'Dutch', flag: '🇳🇱' },
  { code: 'pl-PL', name: 'Polish', flag: '🇵🇱' },
  { code: 'sv-SE', name: 'Swedish', flag: '🇸🇪' },
  { code: 'th-TH', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi-VN', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'id-ID', name: 'Indonesian', flag: '🇮🇩' },
];

// Get language name from code
export function getLanguageName(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang ? lang.name : 'English (US)';
}

// Extract language for backend (e.g., 'en-US' -> 'English')
export function getLanguageForBackend(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  if (!lang) return 'English';
  
  // Extract language name without country
  return lang.name.split(' (')[0];
}

class SpeechRecognitionService {
  private recognition: any = null;
  private isSupported: boolean = false;

  constructor() {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.isSupported = true;
    } else {
      console.warn('Speech Recognition is not supported in this browser');
      this.isSupported = false;
    }
  }

  // Check if speech recognition is supported
  isSpeechRecognitionSupported(): boolean {
    return this.isSupported;
  }

  // Start listening
  startListening(
    options: SpeechRecognitionOptions,
    onResult: (result: SpeechRecognitionResult) => void,
    onError?: (error: any) => void,
    onEnd?: () => void
  ): void {
    if (!this.isSupported || !this.recognition) {
      console.error('Speech Recognition is not supported');
      if (onError) {
        onError(new Error('Speech Recognition is not supported in your browser'));
      }
      return;
    }

    // Configure recognition
    this.recognition.lang = options.language || 'en-US';
    this.recognition.continuous = options.continuous ?? false;
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.maxAlternatives = options.maxAlternatives ?? 1;

    // Set up event handlers
    this.recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      
      const transcript = lastResult[0].transcript;
      const confidence = lastResult[0].confidence;
      const isFinal = lastResult.isFinal;

      onResult({
        transcript,
        confidence,
        isFinal
      });
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech Recognition Error:', event.error);
      if (onError) {
        onError(event.error);
      }
    };

    this.recognition.onend = () => {
      console.log('Speech Recognition ended');
      if (onEnd) {
        onEnd();
      }
    };

    // Start recognition
    try {
      this.recognition.start();
      console.log('Speech Recognition started with language:', options.language);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      if (onError) {
        onError(error);
      }
    }
  }

  // Stop listening
  stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
        console.log('Speech Recognition stopped');
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  }

  // Abort listening
  abortListening(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
        console.log('Speech Recognition aborted');
      } catch (error) {
        console.error('Error aborting speech recognition:', error);
      }
    }
  }

  // Get supported languages
  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  }

  // Check if a specific language is supported
  isLanguageSupported(languageCode: string): boolean {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
  }
}

// Export singleton instance
export const speechRecognitionService = new SpeechRecognitionService();

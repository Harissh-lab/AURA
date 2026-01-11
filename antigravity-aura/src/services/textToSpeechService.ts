// Text-to-Speech Service for reading bot messages

export interface TTSOptions {
  language: string;
  rate?: number;     // Speed (0.1 to 10, default 1)
  pitch?: number;    // Pitch (0 to 2, default 1)
  volume?: number;   // Volume (0 to 1, default 1)
}

class TextToSpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSupported: boolean = false;
  private voicesLoaded: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.isSupported = true;
      
      // Load voices
      this.loadVoices();
      
      // Voices may load asynchronously
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
      
      console.log('✅ Text-to-Speech initialized');
    } else {
      console.warn('❌ Text-to-Speech not supported in this browser');
    }
  }

  /**
   * Load available voices
   */
  private loadVoices(): void {
    if (!this.synth) return;
    
    this.voices = this.synth.getVoices();
    this.voicesLoaded = this.voices.length > 0;
    
    if (this.voicesLoaded) {
      console.log(`✅ Loaded ${this.voices.length} TTS voices`);
      console.log('Available languages:', [...new Set(this.voices.map(v => v.lang))].join(', '));
    }
  }

  /**
   * Check if TTS is supported
   */
  isAvailable(): boolean {
    return this.isSupported;
  }

  /**
   * Get available voices for a language
   */
  getVoicesForLanguage(languageCode: string): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    
    // Ensure voices are loaded
    if (!this.voicesLoaded) {
      this.loadVoices();
    }
    
    const langPrefix = languageCode.split('-')[0]; // e.g., 'en' from 'en-US'
    
    const matchingVoices = this.voices.filter(voice => 
      voice.lang.startsWith(langPrefix) || voice.lang.startsWith(languageCode)
    );
    
    // If no matching voices, return English voices as fallback
    if (matchingVoices.length === 0) {
      console.warn(`⚠️ No voices found for ${languageCode}, falling back to English`);
      return this.voices.filter(voice => voice.lang.startsWith('en'));
    }
    
    return matchingVoices;
  }

  /**
   * Speak the given text
   */
  speak(
    text: string,
    options: TTSOptions,
    onEnd?: () => void,
    onError?: (error: Error) => void
  ): void {
    if (!this.synth) {
      console.warn('❌ Speech synthesis not available');
      onError?.(new Error('Speech synthesis not supported'));
      return;
    }

    // Ensure voices are loaded
    if (!this.voicesLoaded) {
      console.log('⏳ Waiting for voices to load...');
      this.loadVoices();
      
      // If still no voices, wait a bit and retry
      if (!this.voicesLoaded) {
        setTimeout(() => {
          this.loadVoices();
          if (this.voicesLoaded) {
            this.speak(text, options, onEnd, onError);
          } else {
            console.warn('⚠️ No voices available, speaking with default settings');
            this.speakWithFallback(text, options, onEnd, onError);
          }
        }, 100);
        return;
      }
    }

    // Cancel any ongoing speech
    this.stop();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Set language
    utterance.lang = options.language;

    // Set rate, pitch, volume
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    // Try to find a suitable voice for the language
    const voices = this.getVoicesForLanguage(options.language);
    if (voices.length > 0) {
      // Prefer local voices, then female voices
      const localVoice = voices.find(v => v.localService);
      const femaleVoice = voices.find(v => v.name.toLowerCase().includes('female'));
      utterance.voice = localVoice || femaleVoice || voices[0];
      console.log(`🔊 Using voice: ${utterance.voice.name} (${utterance.voice.lang})`);
    } else {
      console.warn(`⚠️ No suitable voice found for ${options.language}`);
    }

    // Event handlers
    utterance.onend = () => {
      console.log('✅ Speech finished');
      this.currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (event) => {
      // Don't treat "not-allowed" or "synthesis-unavailable" as fatal errors
      // These often happen with unsupported languages but speech might still work
      if (event.error === 'not-allowed' || event.error === 'synthesis-unavailable' || event.error === 'synthesis-failed') {
        console.log('ℹ️ TTS not fully supported, but attempting anyway');
        // Don't call onError - let it try
        return;
      }
      
      // For other errors, clean up
      this.currentUtterance = null;
      onError?.(new Error(event.error));
    };

    utterance.onstart = () => {
      console.log('🔊 Speech started');
    };

    // Speak
    try {
      this.synth.speak(utterance);
      console.log(`🔊 Speaking: "${text.substring(0, 50)}..." in ${options.language}`);
    } catch (error) {
      console.error('❌ Error speaking:', error);
      onError?.(error as Error);
    }
  }

  /**
   * Fallback speak method when no voices are available
   */
  private speakWithFallback(
    text: string,
    options: TTSOptions,
    onEnd?: () => void,
    onError?: (error: Error) => void
  ): void {
    if (!this.synth) return;

    this.stop();
    
    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;
    
    // Use basic settings without voice selection
    utterance.lang = 'en-US'; // Fallback to English
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    utterance.onend = () => {
      this.currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (event) => {
      this.currentUtterance = null;
      onError?.(new Error(event.error));
    };

    try {
      this.synth.speak(utterance);
      console.log('🔊 Speaking with fallback settings (English)');
    } catch (error) {
      onError?.(error as Error);
    }
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
      this.currentUtterance = null;
      console.log('⏹️ Speech stopped');
    }
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      console.log('⏸️ Speech paused');
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
      console.log('▶️ Speech resumed');
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.synth ? this.synth.paused : false;
  }
}

// Export singleton instance
export const textToSpeechService = new TextToSpeechService();

// Language code mappings for TTS (some browsers need specific codes)
export const TTS_LANGUAGE_MAP: Record<string, string> = {
  'en-US': 'en-US',
  'en-GB': 'en-GB',
  'hi-IN': 'hi-IN',
  'ta-IN': 'ta-IN',
  'te-IN': 'te-IN',
  'mr-IN': 'mr-IN',
  'bn-IN': 'bn-IN',
  'gu-IN': 'gu-IN',
  'kn-IN': 'kn-IN',
  'ml-IN': 'ml-IN',
  'pa-IN': 'pa-Guru-IN',
  'es-ES': 'es-ES',
  'es-MX': 'es-MX',
  'fr-FR': 'fr-FR',
  'de-DE': 'de-DE',
  'it-IT': 'it-IT',
  'pt-BR': 'pt-BR',
  'pt-PT': 'pt-PT',
  'ru-RU': 'ru-RU',
  'ja-JP': 'ja-JP',
  'ko-KR': 'ko-KR',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  'ar-SA': 'ar-SA',
  'tr-TR': 'tr-TR',
  'nl-NL': 'nl-NL',
  'pl-PL': 'pl-PL',
  'sv-SE': 'sv-SE',
  'th-TH': 'th-TH',
  'vi-VN': 'vi-VN',
  'id-ID': 'id-ID',
};

/**
 * Get TTS language code for a given language code
 */
export function getTTSLanguageCode(languageCode: string): string {
  return TTS_LANGUAGE_MAP[languageCode] || languageCode;
}

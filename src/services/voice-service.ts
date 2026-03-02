// 🔊 Voice Service - Text-to-speech for accessibility
// Supports multiple languages and natural speech synthesis

export interface VoiceOptions {
  language: string;
  rate: number; // 0.1 to 2.0
  pitch: number; // 0 to 2
  volume: number; // 0 to 1
}

export class VoiceService {
  private static instance: VoiceService;
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private initialized = false;
  private isSupported = false;

  private constructor() {}

  static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔊 Initializing Voice Service...');
      
      // Check if browser supports speech synthesis
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.isSupported = true;
        
        // Load voices immediately if available
        await this.loadVoices();
        
        // Set up voice change listener for dynamic loading
        if (this.synth) {
          this.synth.addEventListener('voiceschanged', () => {
            this.loadVoices();
          });
        }
        
        this.initialized = true;
        console.log('✅ Voice Service initialized successfully!');
        console.log(`🎤 Available voices: ${this.voices.length}`);
      } else {
        console.warn('⚠️ Speech synthesis not supported in this browser');
        this.isSupported = false;
        this.initialized = true;
      }
    } catch (error) {
      console.error('❌ Failed to initialize Voice Service:', error);
      this.isSupported = false;
      this.initialized = true;
    }
  }

  private async loadVoices(): Promise<void> {
    if (!this.synth) return;
    
    try {
      // Get voices immediately
      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        this.voices = voices;
        return;
      }
      
      // Wait for voices to load (some browsers need time)
      return new Promise((resolve) => {
        const checkVoices = () => {
          const voices = this.synth!.getVoices();
          if (voices.length > 0) {
            this.voices = voices;
            resolve();
          } else {
            setTimeout(checkVoices, 100);
          }
        };
        checkVoices();
      });
    } catch (error) {
      console.error('❌ Failed to load voices:', error);
    }
  }

  // Get voice for specific language
  getVoiceForLanguage(language: string): SpeechSynthesisVoice | null {
    if (!this.isSupported || this.voices.length === 0) return null;
    
    const langCode = language.split('-')[0]; // Get primary language code
    
    // Try to find exact match
    let voice = this.voices.find(voice => voice.lang.startsWith(langCode));
    
    // Fallback to English if no match found
    if (!voice) {
      voice = this.voices.find(voice => voice.lang.startsWith('en'));
    }
    
    // Final fallback to any available voice
    if (!voice && this.voices.length > 0) {
      voice = this.voices[0];
    }
    
    return voice || null;
  }

  // Get available voices for language selection
  getAvailableVoices(): Array<{name: string, lang: string, localService: boolean}> {
    return this.voices.map(voice => ({
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService
    }));
  }

  // Speak text with options
  async speak(text: string, options: Partial<VoiceOptions> = {}): Promise<void> {
    await this.initialize();

    if (!this.isSupported || !this.synth) {
      console.warn('⚠️ Speech synthesis not available');
      // Fallback: show text in alert for accessibility
      alert(`🔊 Voice not available. Text: ${text}`);
      return;
    }

    try {
      // Cancel any ongoing speech
      this.synth.cancel();

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice
      const voice = this.getVoiceForLanguage(options.language || 'en');
      if (voice) {
        utterance.voice = voice;
      }

      // Set speech parameters
      utterance.rate = Math.max(0.1, Math.min(2.0, options.rate || 1.0));
      utterance.pitch = Math.max(0, Math.min(2.0, options.pitch || 1.0));
      utterance.volume = Math.max(0, Math.min(1.0, options.volume || 1.0));

      // Set language
      utterance.lang = options.language || 'en';

      // Add event listeners for debugging
      utterance.onstart = () => {
        console.log('🔊 Started speaking:', text.substring(0, 50) + '...');
      };

      utterance.onend = () => {
        console.log('✅ Finished speaking');
      };

      utterance.onerror = (event) => {
        const errorMessage = this.getSpeechErrorMessage(event.error);
        console.error('❌ Speech error:', errorMessage);
        
        // Fallback for common errors
        if (event.error === 'network' || event.error === 'synthesis-unavailable') {
          alert(`🔊 Voice synthesis unavailable. Text: ${text}`);
        }
      };

      utterance.onpause = () => {
        console.log('⏸️ Speech paused');
      };

      utterance.onresume = () => {
        console.log('▶️ Speech resumed');
      };

      utterance.onmark = (event) => {
        console.log('📍 Speech mark:', event);
      };

      utterance.onboundary = (event) => {
        console.log('🔤 Speech boundary:', event);
      };

      // Start speaking
      this.synth.speak(utterance);
      
      console.log('🔊 Speaking text in language:', options.language || 'en');
      
    } catch (error) {
      console.error('❌ Failed to speak text:', error);
      // Fallback: show text in alert
      alert(`🔊 Voice error. Text: ${text}`);
    }
  }

  // Get human-readable error message
  private getSpeechErrorMessage(error: string | null): string {
    const errorMessages: Record<string, string> = {
      'network': 'Network error - voice synthesis requires internet connection',
      'synthesis-unavailable': 'Voice synthesis not available on this device',
      'synthesis-failed': 'Voice synthesis failed',
      'language-unavailable': 'Language not available for voice synthesis',
      'voice-unavailable': 'Voice not available',
      'text-too-long': 'Text too long for voice synthesis',
      'rate-not-supported': 'Speech rate not supported',
      'name-not-found': 'Voice name not found',
      'service-not-allowed': 'Voice service not allowed'
    };
    
    return errorMessages[error || ''] || 'Unknown speech synthesis error';
  }

  // Stop speaking
  stop(): void {
    if (this.synth && this.isSupported) {
      this.synth.cancel();
      console.log('🔇 Speech stopped');
    }
  }

  // Check if currently speaking
  isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }

  // Check if voice is supported
  isVoiceSupported(): boolean {
    return this.isSupported;
  }

  // Get language-specific voice options
  getLanguageVoiceOptions(): Record<string, VoiceOptions> {
    return {
      'en': { language: 'en-US', rate: 1.0, pitch: 1.0, volume: 1.0 },
      'hi': { language: 'hi-IN', rate: 0.9, pitch: 1.0, volume: 1.0 },
      'bn': { language: 'bn-IN', rate: 0.9, pitch: 1.0, volume: 1.0 },
      'ta': { language: 'ta-IN', rate: 0.9, pitch: 1.0, volume: 1.0 },
      'te': { language: 'te-IN', rate: 0.9, pitch: 1.0, volume: 1.0 },
      'mr': { language: 'mr-IN', rate: 0.9, pitch: 1.0, volume: 1.0 },
      'gu': { language: 'gu-IN', rate: 0.9, pitch: 1.0, volume: 1.0 },
      'pa': { language: 'pa-IN', rate: 0.9, pitch: 1.0, volume: 1.0 },
      'kn': { language: 'kn-IN', rate: 0.9, pitch: 1.0, volume: 1.0 },
      'ml': { language: 'ml-IN', rate: 0.9, pitch: 1.0, volume: 1.0 }
    };
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // Get supported languages
  getSupportedLanguages(): Array<{code: string, name: string, nativeName: string}> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' }
    ];
  }
}

// Export singleton instance
export const voiceService = VoiceService.getInstance();

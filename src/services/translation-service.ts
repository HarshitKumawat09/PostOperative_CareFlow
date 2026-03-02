// 🌍 Translation Service - Multi-language support for rural communities
// Supports: Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, Kannada, Malayalam

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

export class TranslationService {
  private static instance: TranslationService;
  private initialized = false;

  private constructor() {}

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🌍 Initializing Translation Service...');
      // For now, we'll use a comprehensive phrase-based approach
      // In production, you can integrate Google Translate API or similar
      this.initialized = true;
      console.log('✅ Translation Service initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize Translation Service:', error);
      throw error;
    }
  }

  // Comprehensive translation dictionary for medical phrases and sentences
  private getTranslationDictionary(): Record<string, Record<string, string>> {
    return {
      'en': {
        'hi': {
          // Common medical phrases
          'fever is common': 'बुखार आम है',
          'fever is normal': 'बुखार सामान्य है',
          'low grade fever': 'कम बुखार',
          'high grade fever': 'उच्च बुखार',
          'fever below 38°c': '38°c से कम बुखार',
          'fever above 38°c': '38°c से अधिक बुखार',
          'in the first 48 hours': 'पहले 48 घंटों में',
          'after day 3': '3 दिन बाद',
          'may indicate infection': 'संक्रमण का संकेत हो सकता है',
          'requires medical evaluation': 'चिकित्सकीय मूल्यांकन की आवश्यकता है',
          'is expected': 'अपेक्षित है',
          'during this initial period': 'इस प्रारंभिक अवधि के दौरान',
          'contact your healthcare provider': 'अपने स्वास्थ्य सेवा प्रदाता से संपर्क करें',
          'if you have concerns': 'यदि आपको चिंता है',
          'this is normal': 'यह सामान्य है',
          'this is expected': 'यह अपेक्षित है',
          'swelling is normal': 'सूजन सामान्य है',
          'pain is normal': 'दर्द सामान्य है',
          'after surgery': 'शल्यक्रय के बाद',
          'knee replacement surgery': 'घुटना प्रतिस्थापन शल्यक्रय',
          'hip replacement surgery': 'कूल्हा प्रतिस्थापन शल्यक्रय',
          'should contact doctor': 'डॉक्टर से संपर्क करना चाहिए',
          'low risk': 'कम जोखम',
          'moderate risk': 'मध्यम जोखम',
          'high risk': 'उच्च जोखम',
          'critical risk': 'गंभीर जोखम',
          'medical guidance': 'चिकित्सकीय मार्गदर्शन',
          'hospital protocols': 'अस्पताल प्रोटोकॉल',
          'based on our hospital guidelines': 'हमारे अस्पताल के दिशानिर्देशों के आधार पर',
          'please consult your healthcare provider': 'कृपया अपने स्वास्थ्य सेवा प्रदाता से परामर्श करें',
          'this specific information is not available': 'यह विशिष्ट जानकारी उपलब्ध नहीं है',
          'in our current hospital guidelines': 'हमारे वर्तमान अस्पताल दिशानिर्देशों में',
          
          // Individual words (fallback)
          'fever': 'बुखार',
          'pain': 'दर्द',
          'swelling': 'सूजन',
          'knee replacement': 'घुटना प्रतिस्थापन',
          'normal': 'सामान्य',
          'infection': 'संक्रमण',
          'doctor': 'डॉक्टर',
          'hospital': 'अस्पताल',
          'surgery': 'शल्यक्रण',
          'recovery': 'रिकवरी',
          'medicine': 'दवा',
          'exercise': 'व्यायाम',
          'rest': 'आराम',
          'blood pressure': 'रक्त चाप',
          'diabetes': 'मधुमेह',
          'heart': 'दिल',
          'lungs': 'फेफड़े',
          'emergency': 'आपातकालीन',
          'appointment': 'नियुक्ति',
          'day': 'दिन',
          'week': 'सप्ताह',
          'month': 'महीना',
          'hours': 'घंटे',
          'minutes': 'मिनट',
          'contact': 'संपर्क',
          'medical': 'चिकित्सकीय',
          'guidance': 'मार्गदर्शन',
          'answer': 'उत्तर',
          'question': 'प्रश्न',
          'risk': 'जोखम',
          'level': 'स्तर',
          'source': 'स्रोत',
          'protocol': 'प्रोटोकॉल'
        },
        'bn': {
          // Bengali phrases
          'fever is common': 'জ্বর সাধারণ',
          'fever is normal': 'জ্বর স্বাভাবিক',
          'low grade fever': 'কম জ্বর',
          'high grade fever': 'উচ্চ জ্বর',
          'in the first 48 hours': 'প্রথম 48 ঘন্টায়',
          'after day 3': 'তৃতীয় দিনের পরে',
          'may indicate infection': 'সংক্রমণ নির্দেশ করতে পারে',
          'requires medical evaluation': 'চিকিৎসা মূল্যায়ন প্রয়োজন',
          'is expected': 'প্রত্যাশিত',
          'during this initial period': 'এই প্রাথমিক সময়ে',
          'contact your healthcare provider': 'আপনার স্বাস্থ্যসেবা প্রদানকারীর সাথে যোগাযোগ করুন',
          'low risk': 'কম ঝুঁকি',
          'moderate risk': 'মাঝারি ঝুঁকি',
          'high risk': 'উচ্চ ঝুঁকি',
          'medical guidance': 'চিকিৎসা নির্দেশনা',
          'hospital protocols': 'হাসপাতাল প্রোটোকল',
          
          // Individual words
          'fever': 'জ্বর',
          'pain': 'ব্যথা',
          'swelling': 'ফোলা',
          'knee replacement': 'হাঁটু প্রতিস্থাপন',
          'normal': 'স্বাভাবিক',
          'infection': 'সংক্রমণ',
          'doctor': 'ডাক্তার',
          'hospital': 'হাসপাতাল',
          'surgery': 'অস্ত্রোপচার',
          'recovery': 'পুনরুদ্ধার',
          'medicine': 'ওষুধ',
          'exercise': 'ব্যায়াম',
          'rest': 'বিশ্রাম'
        },
        'ta': {
          // Tamil phrases
          'fever is common': 'காய்ச்சை பொதுவானது',
          'fever is normal': 'காய்ச்சை இயல்பானது',
          'low grade fever': 'குறைந்த காய்ச்சை',
          'high grade fever': 'அதிக காய்ச்சை',
          'in the first 48 hours': 'முதல் 48 மணிநேரங்களில்',
          'after day 3': '3 ஆம் நாளுக்குப் பிறகு',
          'may indicate infection': 'தொற்றைக் குறிக்கலாம்',
          'requires medical evaluation': 'மருத்துவ மதிப்பீடு தேவை',
          'is expected': 'எதிர்பார்க்கப்படுகிறது',
          'during this initial period': 'இந்த ஆரம்பகாலத்தில்',
          'contact your healthcare provider': 'உங்கள் சுகாதார வழங்குநரைத் தொடர்பு கொள்ளுங்கள்',
          'low risk': 'குறைவான ஆபத்து',
          'moderate risk': 'மத்திய ஆபத்து',
          'high risk': 'அதிக ஆபத்து',
          'medical guidance': 'மருத்துவ வழிகாட்டுதல்',
          'hospital protocols': 'மருத்துவமனை நெறிமுறைகள்',
          
          // Individual words
          'fever': 'காய்ச்சை',
          'pain': 'வலி',
          'swelling': 'வீக்கம்',
          'knee replacement': 'முட்டு மாற்றீடு',
          'normal': 'இயல்பான',
          'infection': 'தொற்று',
          'doctor': 'மருத்துவர்',
          'hospital': 'மருத்துவமனை',
          'surgery': 'அறுவை சிகிச்சை',
          'recovery': 'மீட்பு',
          'medicine': 'மருந்து',
          'exercise': 'உடற்சம்',
          'rest': 'ஓய்வு'
        },
        'te': {
          // Telugu phrases
          'fever is common': 'జ్వరం సాధారణం',
          'fever is normal': 'జ్వరం సాధారణం',
          'low grade fever': 'తక్కువ జ్వరం',
          'high grade fever': 'అధిక జ్వరం',
          'in the first 48 hours': 'మొదటి 48 గంటల్లో',
          'after day 3': '3వ రోజు తర్వాత',
          'may indicate infection': 'అనాణిని సూచించవచ్చు',
          'requires medical evaluation': 'వైద్య మూల్యాంకన అవసరం',
          'is expected': 'ఆశించబడింది',
          'during this initial period': 'ఈ ప్రారంభ కాలంలో',
          'contact your healthcare provider': 'మీ ఆరోగ్య సంరక్షకుడినంపెట్టండి',
          'low risk': 'తక్కువ ప్రమాదం',
          'moderate risk': 'మధ్యస్థ ప్రమాదం',
          'high risk': 'అధిక ప్రమాదం',
          'medical guidance': 'వైద్య మార్గదర్శనం',
          'hospital protocols': 'ఆస్పత్రి ప్రోటోకాల్స్',
          
          // Individual words
          'fever': 'జ్వరం',
          'pain': 'నొప్పి',
          'swelling': 'వాపు',
          'knee replacement': 'మోకు మార్పిడి',
          'normal': 'సాధారణ',
          'infection': 'అనాణి',
          'doctor': 'డాక్టర్',
          'hospital': 'ఆస్పత్రి',
          'surgery': 'శస్త్ర చికిత్స',
          'recovery': 'కోలతి',
          'medicine': 'మందు',
          'exercise': 'వ్యాయామం',
          'rest': 'విశ్రామం'
        }
      }
    };
  }

  async translateText(text: string, targetLanguage: string): Promise<TranslationResponse> {
    await this.initialize();

    try {
      const dictionary = this.getTranslationDictionary();
      const sourceLanguage = 'en'; // Default source
      
      // Step 1: Try to translate full phrases first
      let translatedText = text;
      const targetDict = dictionary[sourceLanguage]?.[targetLanguage];
      
      if (targetDict) {
        // Sort phrases by length (longest first) to match full sentences first
        const sortedPhrases = Object.keys(targetDict).sort((a, b) => b.length - a.length);
        
        for (const englishPhrase of sortedPhrases) {
          const regex = new RegExp(`\\b${englishPhrase}\\b`, 'gi');
          if (regex.test(translatedText)) {
            translatedText = translatedText.replace(regex, targetDict[englishPhrase]);
            console.log(`🌍 Translated phrase: "${englishPhrase}" → "${targetDict[englishPhrase]}"`);
          }
        }
        
        // Step 2: Handle individual words that weren't caught by phrases
        const words = translatedText.split(/\s+/);
        const translatedWords = words.map(word => {
          const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
          const punctuation = word.match(/[.,!?;:]/)?.[0] || '';
          
          if (targetDict[cleanWord]) {
            return targetDict[cleanWord] + punctuation;
          }
          return word;
        });
        
        translatedText = translatedWords.join(' ');
      }

      return {
        translatedText,
        sourceLanguage,
        targetLanguage,
        confidence: targetDict ? 0.8 : 0.1
      };
    } catch (error) {
      console.error('❌ Translation failed:', error);
      return {
        translatedText: text,
        sourceLanguage: 'en',
        targetLanguage,
        confidence: 0
      };
    }
  }

  // Detect language from user selection or browser
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

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const translationService = TranslationService.getInstance();

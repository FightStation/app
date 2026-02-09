/**
 * Translation Service
 * Provides message translation functionality for the chat system
 * Uses mock translations for now - can be replaced with real API (Google, DeepL, etc.)
 */

export type SupportedLanguage =
  | 'en' // English
  | 'es' // Spanish
  | 'pt' // Portuguese
  | 'de' // German
  | 'fr' // French
  | 'it' // Italian
  | 'ru' // Russian
  | 'pl' // Polish
  | 'nl' // Dutch
  | 'ja' // Japanese
  | 'ko' // Korean
  | 'zh' // Chinese
  | 'th' // Thai
  | 'ar' // Arabic;

export const LANGUAGES: { code: SupportedLanguage; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

// Common phrases in different languages for mock translation
const MOCK_TRANSLATIONS: Record<string, Record<SupportedLanguage, string>> = {
  // Greetings
  'hello': { en: 'Hello', es: 'Hola', pt: 'Olá', de: 'Hallo', fr: 'Bonjour', it: 'Ciao', ru: 'Привет', pl: 'Cześć', nl: 'Hallo', ja: 'こんにちは', ko: '안녕하세요', zh: '你好', th: 'สวัสดี', ar: 'مرحبا' },
  'hi': { en: 'Hi', es: 'Hola', pt: 'Oi', de: 'Hi', fr: 'Salut', it: 'Ciao', ru: 'Привет', pl: 'Cześć', nl: 'Hoi', ja: 'やあ', ko: '안녕', zh: '嗨', th: 'หวัดดี', ar: 'مرحبا' },
  'hey': { en: 'Hey', es: 'Oye', pt: 'Ei', de: 'Hey', fr: 'Hé', it: 'Ehi', ru: 'Эй', pl: 'Hej', nl: 'Hé', ja: 'ねえ', ko: '야', zh: '嘿', th: 'เฮ้', ar: 'يا' },

  // Boxing/fighting terms
  'sparring': { en: 'Sparring', es: 'Sparring', pt: 'Sparring', de: 'Sparring', fr: 'Sparring', it: 'Sparring', ru: 'Спарринг', pl: 'Sparring', nl: 'Sparring', ja: 'スパーリング', ko: '스파링', zh: '实战练习', th: 'ซ้อมชก', ar: 'تدريب قتالي' },
  'training': { en: 'Training', es: 'Entrenamiento', pt: 'Treino', de: 'Training', fr: 'Entraînement', it: 'Allenamento', ru: 'Тренировка', pl: 'Trening', nl: 'Training', ja: 'トレーニング', ko: '훈련', zh: '训练', th: 'ฝึกซ้อม', ar: 'تدريب' },
  'gym': { en: 'Gym', es: 'Gimnasio', pt: 'Academia', de: 'Fitnessstudio', fr: 'Salle de sport', it: 'Palestra', ru: 'Спортзал', pl: 'Siłownia', nl: 'Sportschool', ja: 'ジム', ko: '체육관', zh: '健身房', th: 'ยิม', ar: 'صالة رياضية' },
  'fight': { en: 'Fight', es: 'Pelea', pt: 'Luta', de: 'Kampf', fr: 'Combat', it: 'Combattimento', ru: 'Бой', pl: 'Walka', nl: 'Gevecht', ja: '試合', ko: '시합', zh: '比赛', th: 'ชก', ar: 'قتال' },
  'boxing': { en: 'Boxing', es: 'Boxeo', pt: 'Boxe', de: 'Boxen', fr: 'Boxe', it: 'Pugilato', ru: 'Бокс', pl: 'Boks', nl: 'Boksen', ja: 'ボクシング', ko: '복싱', zh: '拳击', th: 'มวย', ar: 'ملاكمة' },

  // Common phrases
  'good morning': { en: 'Good morning', es: 'Buenos días', pt: 'Bom dia', de: 'Guten Morgen', fr: 'Bonjour', it: 'Buongiorno', ru: 'Доброе утро', pl: 'Dzień dobry', nl: 'Goedemorgen', ja: 'おはようございます', ko: '좋은 아침', zh: '早上好', th: 'สวัสดีตอนเช้า', ar: 'صباح الخير' },
  'thank you': { en: 'Thank you', es: 'Gracias', pt: 'Obrigado', de: 'Danke', fr: 'Merci', it: 'Grazie', ru: 'Спасибо', pl: 'Dziękuję', nl: 'Dank je', ja: 'ありがとうございます', ko: '감사합니다', zh: '谢谢', th: 'ขอบคุณ', ar: 'شكرا' },
  'thanks': { en: 'Thanks', es: 'Gracias', pt: 'Obrigado', de: 'Danke', fr: 'Merci', it: 'Grazie', ru: 'Спасибо', pl: 'Dzięki', nl: 'Bedankt', ja: 'ありがとう', ko: '고마워', zh: '谢谢', th: 'ขอบคุณ', ar: 'شكرا' },
  'yes': { en: 'Yes', es: 'Sí', pt: 'Sim', de: 'Ja', fr: 'Oui', it: 'Sì', ru: 'Да', pl: 'Tak', nl: 'Ja', ja: 'はい', ko: '네', zh: '是', th: 'ใช่', ar: 'نعم' },
  'no': { en: 'No', es: 'No', pt: 'Não', de: 'Nein', fr: 'Non', it: 'No', ru: 'Нет', pl: 'Nie', nl: 'Nee', ja: 'いいえ', ko: '아니요', zh: '不', th: 'ไม่', ar: 'لا' },
  'ok': { en: 'OK', es: 'Vale', pt: 'OK', de: 'OK', fr: "D'accord", it: 'OK', ru: 'Хорошо', pl: 'OK', nl: 'Oké', ja: 'わかりました', ko: '알겠습니다', zh: '好的', th: 'โอเค', ar: 'حسنا' },
  'see you': { en: 'See you', es: 'Nos vemos', pt: 'Até logo', de: 'Bis später', fr: 'À bientôt', it: 'Ci vediamo', ru: 'Увидимся', pl: 'Do zobaczenia', nl: 'Tot ziens', ja: 'また会いましょう', ko: '나중에 봐요', zh: '再见', th: 'แล้วพบกัน', ar: 'أراك لاحقا' },
  'good luck': { en: 'Good luck', es: 'Buena suerte', pt: 'Boa sorte', de: 'Viel Glück', fr: 'Bonne chance', it: 'Buona fortuna', ru: 'Удачи', pl: 'Powodzenia', nl: 'Succes', ja: '頑張って', ko: '행운을 빌어요', zh: '祝你好运', th: 'โชคดี', ar: 'حظا سعيدا' },

  // Time related
  'tomorrow': { en: 'Tomorrow', es: 'Mañana', pt: 'Amanhã', de: 'Morgen', fr: 'Demain', it: 'Domani', ru: 'Завтра', pl: 'Jutro', nl: 'Morgen', ja: '明日', ko: '내일', zh: '明天', th: 'พรุ่งนี้', ar: 'غدا' },
  'today': { en: 'Today', es: 'Hoy', pt: 'Hoje', de: 'Heute', fr: "Aujourd'hui", it: 'Oggi', ru: 'Сегодня', pl: 'Dzisiaj', nl: 'Vandaag', ja: '今日', ko: '오늘', zh: '今天', th: 'วันนี้', ar: 'اليوم' },

  // Questions
  'when': { en: 'When?', es: '¿Cuándo?', pt: 'Quando?', de: 'Wann?', fr: 'Quand?', it: 'Quando?', ru: 'Когда?', pl: 'Kiedy?', nl: 'Wanneer?', ja: 'いつ？', ko: '언제?', zh: '什么时候？', th: 'เมื่อไหร่?', ar: 'متى؟' },
  'where': { en: 'Where?', es: '¿Dónde?', pt: 'Onde?', de: 'Wo?', fr: 'Où?', it: 'Dove?', ru: 'Где?', pl: 'Gdzie?', nl: 'Waar?', ja: 'どこ？', ko: '어디?', zh: '在哪里？', th: 'ที่ไหน?', ar: 'أين؟' },
  'what time': { en: 'What time?', es: '¿A qué hora?', pt: 'Que horas?', de: 'Um wie viel Uhr?', fr: 'À quelle heure?', it: 'A che ora?', ru: 'Во сколько?', pl: 'O której godzinie?', nl: 'Hoe laat?', ja: '何時？', ko: '몇 시?', zh: '几点？', th: 'กี่โมง?', ar: 'في أي وقت؟' },
};

/**
 * Detect language from text (simple heuristic-based detection)
 */
export function detectLanguage(text: string): SupportedLanguage {
  const lowerText = text.toLowerCase().trim();

  // Check for specific character sets
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh'; // Chinese
  if (/[\u3040-\u30ff]/.test(text)) return 'ja'; // Japanese
  if (/[\uac00-\ud7af]/.test(text)) return 'ko'; // Korean
  if (/[\u0e00-\u0e7f]/.test(text)) return 'th'; // Thai
  if (/[\u0600-\u06ff]/.test(text)) return 'ar'; // Arabic
  if (/[\u0400-\u04ff]/.test(text)) return 'ru'; // Cyrillic (Russian)

  // Check for common words/patterns
  if (/\b(hola|gracias|buenos|buenas|qué|cómo)\b/i.test(text)) return 'es';
  if (/\b(obrigado|você|como|bom|boa)\b/i.test(text)) return 'pt';
  if (/\b(guten|danke|wie|ich|und|ist)\b/i.test(text)) return 'de';
  if (/\b(bonjour|merci|comment|je|vous|est)\b/i.test(text)) return 'fr';
  if (/\b(ciao|grazie|come|buon|buona)\b/i.test(text)) return 'it';
  if (/\b(tak|nie|jak|dobry|dzień)\b/i.test(text)) return 'pl';
  if (/\b(hallo|dank|hoe|goed|dag)\b/i.test(text)) return 'nl';

  // Default to English
  return 'en';
}

/**
 * Translate text to target language
 * In production, replace this with actual API call to Google Translate, DeepL, etc.
 */
export async function translateText(
  text: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage
): Promise<{ translatedText: string; detectedLanguage: SupportedLanguage }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));

  const detected = sourceLanguage || detectLanguage(text);

  // If already in target language, return as-is
  if (detected === targetLanguage) {
    return { translatedText: text, detectedLanguage: detected };
  }

  // Check for exact match in our mock translations
  const lowerText = text.toLowerCase().trim();
  if (MOCK_TRANSLATIONS[lowerText] && MOCK_TRANSLATIONS[lowerText][targetLanguage]) {
    return {
      translatedText: MOCK_TRANSLATIONS[lowerText][targetLanguage],
      detectedLanguage: detected,
    };
  }

  // For longer text, do word-by-word mock translation for known words
  const words = text.split(/\s+/);
  const translatedWords = words.map((word) => {
    const lowerWord = word.toLowerCase().replace(/[.,!?]/g, '');
    const punctuation = word.match(/[.,!?]+$/)?.[0] || '';

    if (MOCK_TRANSLATIONS[lowerWord] && MOCK_TRANSLATIONS[lowerWord][targetLanguage]) {
      return MOCK_TRANSLATIONS[lowerWord][targetLanguage] + punctuation;
    }
    return word; // Keep original if no translation
  });

  // Add a note that this is a mock translation
  const result = translatedWords.join(' ');

  // If no words were translated, provide a placeholder
  if (result === text) {
    const langName = LANGUAGES.find((l) => l.code === targetLanguage)?.name || targetLanguage;
    return {
      translatedText: `[${langName} translation]: ${text}`,
      detectedLanguage: detected,
    };
  }

  return {
    translatedText: result,
    detectedLanguage: detected,
  };
}

/**
 * Get language display name
 */
export function getLanguageName(code: SupportedLanguage): string {
  return LANGUAGES.find((l) => l.code === code)?.name || code;
}

/**
 * Get native language name
 */
export function getLanguageNativeName(code: SupportedLanguage): string {
  return LANGUAGES.find((l) => l.code === code)?.nativeName || code;
}

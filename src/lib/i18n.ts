import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from '../locales/en.json';
import pl from '../locales/pl.json';
import lt from '../locales/lt.json';
import ro from '../locales/ro.json';
import bg from '../locales/bg.json';
import cs from '../locales/cs.json';
import hu from '../locales/hu.json';
import hr from '../locales/hr.json';
import sr from '../locales/sr.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';
import it from '../locales/it.json';
import ru from '../locales/ru.json';

const LANGUAGE_STORAGE_KEY = '@fight_station_language';

// Supported languages with labels
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  { code: 'ru', label: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'pl', label: 'Polish', native: 'Polski', flag: '🇵🇱' },
  { code: 'lt', label: 'Lithuanian', native: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lv', label: 'Latvian', native: 'Latviešu', flag: '🇱🇻' },
  { code: 'et', label: 'Estonian', native: 'Eesti', flag: '🇪🇪' },
  { code: 'fi', label: 'Finnish', native: 'Suomi', flag: '🇫🇮' },
  { code: 'sv', label: 'Swedish', native: 'Svenska', flag: '🇸🇪' },
  { code: 'sr', label: 'Serbian', native: 'Српски', flag: '🇷🇸' },
  { code: 'hr', label: 'Croatian', native: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sl', label: 'Slovenian', native: 'Slovenščina', flag: '🇸🇮' },
  { code: 'bg', label: 'Bulgarian', native: 'Български', flag: '🇧🇬' },
  { code: 'ro', label: 'Romanian', native: 'Română', flag: '🇷🇴' },
  { code: 'cs', label: 'Czech', native: 'Čeština', flag: '🇨🇿' },
  { code: 'sk', label: 'Slovak', native: 'Slovenčina', flag: '🇸🇰' },
  { code: 'hu', label: 'Hungarian', native: 'Magyar', flag: '🇭🇺' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

// Get device language, fallback to English
const getDeviceLanguage = (): string => {
  const deviceLang = Localization.getLocales()[0]?.languageCode || 'en';
  // Check if device language is supported
  const supported = SUPPORTED_LANGUAGES.find(l => l.code === deviceLang);
  return supported ? deviceLang : 'en';
};

// Initialize i18n
const initI18n = async () => {
  // Try to get saved language preference
  let savedLanguage: string | null = null;
  try {
    savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.log('Error loading language preference:', error);
  }

  const language = savedLanguage || getDeviceLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        de: { translation: de },
        fr: { translation: fr },
        es: { translation: es },
        it: { translation: it },
        ru: { translation: ru },
        pl: { translation: pl },
        lt: { translation: lt },
        ro: { translation: ro },
        bg: { translation: bg },
        cs: { translation: cs },
        hu: { translation: hu },
        hr: { translation: hr },
        sr: { translation: sr },
        // Other languages (lv, et, fi, sv, sl, sk) will fall back to English
      },
      lng: language,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

  return i18n;
};

// Change language and persist preference
export const changeLanguage = async (languageCode: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    await i18n.changeLanguage(languageCode);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

// Get current language info
export const getCurrentLanguage = () => {
  const code = i18n.language || 'en';
  return SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[0];
};

// Initialize and export
initI18n();

export default i18n;
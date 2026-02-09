import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../lib/i18n';

const TRANSLATION_CACHE_KEY = '@fight_station_translations';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedTranslation {
  text: string;
  targetLang: string;
  translation: string;
  timestamp: number;
}

interface TranslationCache {
  [key: string]: CachedTranslation;
}

/**
 * Generate a cache key for a translation
 */
function getCacheKey(text: string, targetLang: string): string {
  // Simple hash for cache key
  const hash = text.slice(0, 50).replace(/\s+/g, '_');
  return `${targetLang}:${hash}`;
}

/**
 * Load translation cache from storage
 */
async function loadCache(): Promise<TranslationCache> {
  try {
    const cached = await AsyncStorage.getItem(TRANSLATION_CACHE_KEY);
    if (cached) {
      const cache: TranslationCache = JSON.parse(cached);
      // Clean expired entries
      const now = Date.now();
      const cleanedCache: TranslationCache = {};
      for (const [key, entry] of Object.entries(cache)) {
        if (now - entry.timestamp < CACHE_EXPIRY_MS) {
          cleanedCache[key] = entry;
        }
      }
      return cleanedCache;
    }
  } catch (error) {
    console.error('Error loading translation cache:', error);
  }
  return {};
}

/**
 * Save translation to cache
 */
async function saveToCache(
  text: string,
  targetLang: string,
  translation: string
): Promise<void> {
  try {
    const cache = await loadCache();
    const key = getCacheKey(text, targetLang);
    cache[key] = {
      text,
      targetLang,
      translation,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving translation to cache:', error);
  }
}

/**
 * Get cached translation if available
 */
async function getCachedTranslation(
  text: string,
  targetLang: string
): Promise<string | null> {
  const cache = await loadCache();
  const key = getCacheKey(text, targetLang);
  const entry = cache[key];
  if (entry && entry.text === text) {
    return entry.translation;
  }
  return null;
}

/**
 * Translate text using a free translation API
 * Falls back to showing original if translation fails
 *
 * In production, you'd want to use:
 * - Google Cloud Translation API
 * - DeepL API (better for European languages)
 * - Or a self-hosted LibreTranslate instance
 */
export async function translateText(
  text: string,
  targetLang?: string
): Promise<{ translation: string; isTranslated: boolean }> {
  if (!text || text.trim().length === 0) {
    return { translation: text, isTranslated: false };
  }

  const target = targetLang || i18n.language || 'en';

  // Don't translate if target is English and text appears to be English
  // (Simple heuristic - in production use language detection)
  if (target === 'en') {
    return { translation: text, isTranslated: false };
  }

  // Check cache first
  const cached = await getCachedTranslation(text, target);
  if (cached) {
    return { translation: cached, isTranslated: true };
  }

  try {
    // Using LibreTranslate's free API (rate limited but free)
    // In production, use your own instance or paid API
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'auto', // Auto-detect source language
        target: target,
        format: 'text',
      }),
    });

    if (!response.ok) {
      throw new Error('Translation API error');
    }

    const data = await response.json();
    const translation = data.translatedText;

    // Cache the result
    await saveToCache(text, target, translation);

    return { translation, isTranslated: true };
  } catch (error) {
    console.log('Translation failed, using original text:', error);
    // Fallback: return original text
    return { translation: text, isTranslated: false };
  }
}

/**
 * Batch translate multiple texts
 */
export async function translateBatch(
  texts: string[],
  targetLang?: string
): Promise<{ translations: string[]; isTranslated: boolean[] }> {
  const results = await Promise.all(
    texts.map(text => translateText(text, targetLang))
  );

  return {
    translations: results.map(r => r.translation),
    isTranslated: results.map(r => r.isTranslated),
  };
}

/**
 * Detect the language of a text
 * Returns ISO 639-1 language code
 */
export async function detectLanguage(text: string): Promise<string | null> {
  if (!text || text.trim().length < 10) {
    return null;
  }

  try {
    const response = await fetch('https://libretranslate.com/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return data[0].language;
    }
  } catch (error) {
    console.log('Language detection failed:', error);
  }

  return null;
}

/**
 * Check if text needs translation based on user's language preference
 */
export async function needsTranslation(text: string): Promise<boolean> {
  const userLang = i18n.language || 'en';
  const detectedLang = await detectLanguage(text);

  if (!detectedLang) {
    return false;
  }

  return detectedLang !== userLang;
}

/**
 * Clear translation cache
 */
export async function clearTranslationCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TRANSLATION_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing translation cache:', error);
  }
}
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { translateText } from '../services/translateService';
import { colors, spacing, typography, borderRadius } from '../lib/theme';

interface TranslateButtonProps {
  text: string;
  onTranslated?: (translatedText: string) => void;
  style?: object;
  compact?: boolean;
}

/**
 * A button that translates user-generated content on demand
 * Shows original or translated text with toggle
 */
export function TranslateButton({ text, onTranslated, style, compact = false }: TranslateButtonProps) {
  const { t } = useTranslation();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [showingTranslation, setShowingTranslation] = useState(false);
  const [error, setError] = useState(false);

  const handleTranslate = async () => {
    if (translatedText) {
      // Toggle between original and translated
      setShowingTranslation(!showingTranslation);
      if (onTranslated) {
        onTranslated(showingTranslation ? text : translatedText);
      }
      return;
    }

    setIsTranslating(true);
    setError(false);

    try {
      const result = await translateText(text);
      if (result.isTranslated) {
        setTranslatedText(result.translation);
        setShowingTranslation(true);
        if (onTranslated) {
          onTranslated(result.translation);
        }
      } else {
        // Text is already in user's language or couldn't be translated
        setError(true);
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError(true);
    } finally {
      setIsTranslating(false);
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactButton, style]}
        onPress={handleTranslate}
        disabled={isTranslating}
      >
        {isTranslating ? (
          <ActivityIndicator size="small" color={colors.primary[500]} />
        ) : (
          <>
            <Ionicons
              name={showingTranslation ? 'language' : 'language-outline'}
              size={16}
              color={showingTranslation ? colors.primary[500] : colors.textMuted}
            />
            {showingTranslation && (
              <Text style={styles.compactLabel}>{t('common.translated')}</Text>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, error && styles.buttonError, style]}
      onPress={handleTranslate}
      disabled={isTranslating}
    >
      {isTranslating ? (
        <>
          <ActivityIndicator size="small" color={colors.primary[500]} />
          <Text style={styles.buttonText}>{t('common.loading')}</Text>
        </>
      ) : error ? (
        <>
          <Ionicons name="alert-circle-outline" size={18} color={colors.textMuted} />
          <Text style={styles.buttonTextMuted}>Translation unavailable</Text>
        </>
      ) : (
        <>
          <Ionicons
            name={showingTranslation ? 'language' : 'language-outline'}
            size={18}
            color={showingTranslation ? colors.primary[500] : colors.textSecondary}
          />
          <Text style={[styles.buttonText, showingTranslation && styles.buttonTextActive]}>
            {showingTranslation ? t('common.originalText') : t('common.translate')}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

/**
 * A container that shows text with optional translation
 */
interface TranslatableTextProps {
  text: string;
  style?: object;
  textStyle?: object;
  numberOfLines?: number;
}

export function TranslatableText({ text, style, textStyle, numberOfLines }: TranslatableTextProps) {
  const [displayText, setDisplayText] = useState(text);

  return (
    <View style={[styles.translatableContainer, style]}>
      <Text style={[styles.text, textStyle]} numberOfLines={numberOfLines}>
        {displayText}
      </Text>
      <TranslateButton
        text={text}
        onTranslated={setDisplayText}
        compact
        style={styles.inlineTranslate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonError: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  buttonTextActive: {
    color: colors.primary[500],
  },
  buttonTextMuted: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    padding: spacing[1],
  },
  compactLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[500],
  },
  translatableContainer: {
    position: 'relative',
  },
  text: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  inlineTranslate: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
});
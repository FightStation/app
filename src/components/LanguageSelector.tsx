import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguage, getCurrentLanguage } from '../lib/i18n';
import { colors, spacing, typography, borderRadius } from '../lib/theme';

interface LanguageSelectorProps {
  style?: object;
}

export function LanguageSelector({ style }: LanguageSelectorProps) {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  const handleSelectLanguage = async (langCode: string) => {
    await changeLanguage(langCode);
    const newLang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    if (newLang) {
      setCurrentLang(newLang);
    }
    setModalVisible(false);
  };

  const renderLanguageItem = ({ item }: { item: typeof SUPPORTED_LANGUAGES[number] }) => {
    const isSelected = item.code === currentLang.code;

    return (
      <TouchableOpacity
        style={[styles.languageItem, isSelected && styles.languageItemSelected]}
        onPress={() => handleSelectLanguage(item.code)}
      >
        <Text style={styles.flag}>{item.flag}</Text>
        <View style={styles.languageInfo}>
          <Text style={[styles.languageNative, isSelected && styles.languageNativeSelected]}>
            {item.native}
          </Text>
          <Text style={styles.languageLabel}>{item.label}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, style]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorLeft}>
          <Ionicons name="language" size={22} color={colors.textSecondary} />
          <Text style={styles.selectorLabel}>{t('settings.language')}</Text>
        </View>
        <View style={styles.selectorRight}>
          <Text style={styles.currentLanguage}>
            {currentLang.flag} {currentLang.native}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>
            <View style={styles.closeButton} />
          </View>

          <FlatList
            data={SUPPORTED_LANGUAGES}
            renderItem={renderLanguageItem}
            keyExtractor={(item) => item.code}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  selectorLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  selectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  currentLanguage: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  listContent: {
    padding: spacing[4],
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[2],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  languageItemSelected: {
    borderColor: colors.primary[500],
    backgroundColor: `${colors.primary[500]}15`,
  },
  flag: {
    fontSize: 28,
    marginRight: spacing[3],
  },
  languageInfo: {
    flex: 1,
  },
  languageNative: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  languageNativeSelected: {
    color: colors.primary[500],
  },
  languageLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getCommissionRates, updateCommissionRate } from '../../services/affiliate';
import { CommissionRate, ReferrerType } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';

type CommissionRatesScreenProps = {
  navigation?: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 600 : width;

export function CommissionRatesScreen({ navigation }: CommissionRatesScreenProps) {
  const [rates, setRates] = useState<CommissionRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCommissionRates();
      setRates(data);
    } catch (err) {
      console.error('Error loading commission rates:', err);
      setError('Failed to load commission rates');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (rate: CommissionRate) => {
    setEditingRate(rate.rate_key);
    setEditValue(rate.rate_percentage.toString());
  };

  const handleEditCancel = () => {
    setEditingRate(null);
    setEditValue('');
  };

  const handleEditSave = async (rate: CommissionRate) => {
    const newPercentage = parseFloat(editValue);

    if (isNaN(newPercentage) || newPercentage < 0 || newPercentage > 100) {
      Alert.alert('Invalid Value', 'Please enter a percentage between 0 and 100');
      return;
    }

    try {
      setSaving(rate.rate_key);
      await updateCommissionRate(rate.rate_key, newPercentage);

      // Update local state
      setRates(prev => prev.map(r =>
        r.rate_key === rate.rate_key
          ? { ...r, rate_percentage: newPercentage, updated_at: new Date().toISOString() }
          : r
      ));

      setEditingRate(null);
      setEditValue('');
      Alert.alert('Success', 'Commission rate updated');
    } catch (err) {
      console.error('Error updating commission rate:', err);
      Alert.alert('Error', 'Failed to update commission rate');
    } finally {
      setSaving(null);
    }
  };

  // Group rates by referrer_type
  const groupedRates = rates.reduce((acc, rate) => {
    const key = rate.referrer_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(rate);
    return acc;
  }, {} as Record<ReferrerType, CommissionRate[]>);

  const getReferrerTypeLabel = (type: ReferrerType): string => {
    switch (type) {
      case 'gym': return 'Gym Commission Rates';
      case 'fighter': return 'Fighter Commission Rates';
      case 'coach': return 'Coach Commission Rates';
      default: return type;
    }
  };

  const getReferrerTypeIcon = (type: ReferrerType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'gym': return 'business';
      case 'fighter': return 'fitness';
      case 'coach': return 'school';
      default: return 'pricetag';
    }
  };

  const formatTransactionType = (type: string | null): string => {
    if (!type) return 'All Transactions';
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading commission rates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Commission Rates</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadRates}>
            <Ionicons name="refresh" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadRates}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={colors.primary[500]} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Commission Structure</Text>
              <Text style={styles.infoDescription}>
                Tier 1 rates apply to direct referrals. Tier 2 rates apply to sub-referrals
                and are calculated from the platform fee pool.
              </Text>
            </View>
          </View>

          {/* Rate Groups */}
          {Object.entries(groupedRates).map(([type, typeRates]) => (
            <View key={type} style={styles.rateGroup}>
              <View style={styles.groupHeader}>
                <Ionicons
                  name={getReferrerTypeIcon(type as ReferrerType)}
                  size={22}
                  color={colors.primary[500]}
                />
                <Text style={styles.groupTitle}>
                  {getReferrerTypeLabel(type as ReferrerType)}
                </Text>
              </View>

              {typeRates.sort((a, b) => a.tier_level - b.tier_level).map((rate) => (
                <View key={rate.rate_key} style={styles.rateCard}>
                  <View style={styles.rateInfo}>
                    <View style={styles.tierBadge}>
                      <Text style={styles.tierText}>Tier {rate.tier_level}</Text>
                    </View>
                    <View style={styles.rateDetails}>
                      <Text style={styles.rateName}>{rate.display_name}</Text>
                      <Text style={styles.rateType}>
                        {formatTransactionType(rate.transaction_type)}
                      </Text>
                    </View>
                  </View>

                  {editingRate === rate.rate_key ? (
                    <View style={styles.editContainer}>
                      <View style={styles.editInputWrapper}>
                        <TextInput
                          style={styles.editInput}
                          value={editValue}
                          onChangeText={setEditValue}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={colors.textMuted}
                          autoFocus
                        />
                        <Text style={styles.percentSymbol}>%</Text>
                      </View>
                      <View style={styles.editActions}>
                        {saving === rate.rate_key ? (
                          <ActivityIndicator size="small" color={colors.primary[500]} />
                        ) : (
                          <>
                            <TouchableOpacity
                              style={styles.saveButton}
                              onPress={() => handleEditSave(rate)}
                            >
                              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.cancelButton}
                              onPress={handleEditCancel}
                            >
                              <Ionicons name="close" size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.rateValue}
                      onPress={() => handleEditStart(rate)}
                    >
                      <Text style={styles.ratePercentage}>{rate.rate_percentage}%</Text>
                      <Ionicons name="pencil" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          ))}

          {rates.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="pricetag-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Commission Rates</Text>
              <Text style={styles.emptySubtitle}>
                Commission rates haven't been configured yet.
              </Text>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webContainer: {
    flex: 1,
    maxWidth: containerMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '20',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: typography.fontSize.sm,
  },
  retryText: {
    color: colors.primary[500],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary[500] + '10',
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  infoDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  rateGroup: {
    marginBottom: spacing[6],
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  groupTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[2],
  },
  rateInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  tierBadge: {
    backgroundColor: colors.primary[500] + '20',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
  },
  tierText: {
    color: colors.primary[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  rateDetails: {
    flex: 1,
  },
  rateName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  rateType: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  rateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  ratePercentage: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  editInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary[500],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  editInput: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    width: 50,
    textAlign: 'center',
    ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
  },
  percentSymbol: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing[4],
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  bottomPadding: {
    height: spacing[10],
  },
});
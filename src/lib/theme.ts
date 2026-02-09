// Fight Station Design System
// WARRIOR THEME - Dark, Premium, Professional

export const colors = {
  // Primary - Deep Red (matches mockup)
  primary: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#C41E3A', // Main brand red (darker, more sophisticated)
    600: '#B91C1C',
    700: '#991B1B',
    800: '#7F1D1D',
    900: '#450A0A',
  },
  // Secondary - Warm cream/tan for accents
  secondary: {
    50: '#FEFCE8',
    100: '#FEF9C3',
    200: '#FEF08A',
    300: '#FDE047',
    400: '#FACC15',
    500: '#D4A574', // Warm tan/cream
    600: '#CA8A04',
    700: '#A16207',
    800: '#854D0E',
    900: '#713F12',
  },
  // Neutral - Rich blacks and grays
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    850: '#1A1A1A',
    900: '#141414',
    950: '#0A0A0A',
  },
  // Accent colors
  success: '#22C55E',
  successLight: '#4ADE80',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  // Background - Deep charcoal black
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceLight: '#262626',
  surfaceElevated: '#2A2A2A',
  // Card backgrounds
  cardBg: '#1C1C1C',
  cardBgHover: '#242424',
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#A3A3A3',
  textMuted: '#9CA3AF',
  // Border colors
  border: '#2A2A2A',
  borderLight: '#363636',
  // Special accent
  accent: {
    red: '#C41E3A',
    redLight: '#DC2626',
    green: '#22C55E',
    gold: '#FFD700',
    cream: '#D4A574',
  },
  // Badge colors
  badge: {
    highIntensity: '#C41E3A',
    hardSparring: '#C41E3A',
    allLevels: '#22C55E',
    new: '#C41E3A',
    pending: '#F59E0B',
    verified: '#3B82F6',
  },
  // Combat sport colors
  sport: {
    boxing: '#C41E3A',      // Deep Red
    mma: '#F97316',         // Vibrant Orange
    muay_thai: '#EAB308',   // Gold
    kickboxing: '#3B82F6',  // Blue
    // Lighter variants for backgrounds
    boxingLight: 'rgba(196, 30, 58, 0.15)',
    mmaLight: 'rgba(249, 115, 22, 0.15)',
    muay_thaiLight: 'rgba(234, 179, 8, 0.15)',
    kickboxingLight: 'rgba(59, 130, 246, 0.15)',
  },
};

export const typography = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    black: 'Inter-Bold',
    // Display fonts for headings and branding
    display: 'BarlowCondensed-Bold',
    displayMedium: 'BarlowCondensed-SemiBold',
    displayBlack: 'BarlowCondensed-Black',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
};

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
};

export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  glow: {
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Icon sizes
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
  '3xl': 40,
};

// Common component styles
export const commonStyles = {
  // Containers
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  // Cards
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden' as const,
  },
  cardWithBorder: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden' as const,
  },
  // Inputs
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputFocused: {
    borderColor: colors.primary[500],
  },
  // Search input
  searchInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
  },
  // Buttons
  buttonPrimary: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  // Text styles
  textHeading: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.display,
  },
  textTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.displayMedium,
  },
  textBody: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  textCaption: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  textLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase' as const,
    letterSpacing: typography.letterSpacing.wider,
  },
  // Badges
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase' as const,
  },
  // Pills/Tags
  pill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  pillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.textPrimary,
  },
  // Dividers
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  // Avatar
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
  },
  // Row layouts
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  rowBetween: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  rowCenter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  // Tab bar
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: spacing[2],
    paddingTop: spacing[2],
    height: 70,
  },
};

// Animation durations
export const animations = {
  fast: 150,
  normal: 250,
  slow: 400,
};

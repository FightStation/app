// Fight Station Design System
// ELECTRIC BLUE THEME - Dark Navy, Premium, Professional

export const colors = {
  // Primary - Electric Blue (matches Stitch designs)
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#135BEC', // Main brand blue
    600: '#1048C4',
    700: '#0D3A9E',
    800: '#0A2D7A',
    900: '#061B4D',
  },
  // Secondary - Cool slate for accents
  secondary: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B', // Slate mid
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  // Neutral - Slate-tinted grays
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    850: '#172033',
    900: '#0F172A',
    950: '#0A0F1D',
  },
  // Accent colors
  success: '#22C55E',
  successLight: '#4ADE80',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  // Background - Deep navy dark
  background: '#101622',
  surface: '#161D2E',
  surfaceLight: '#1E2740',
  surfaceElevated: '#232E48',
  // Card backgrounds
  cardBg: '#182032',
  cardBgHover: '#1E2844',
  // Text colors
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  // Border colors
  border: '#1E293B',
  borderLight: '#334155',
  // Special accent
  accent: {
    red: '#EF4444',
    redLight: '#F87171',
    green: '#22C55E',
    gold: '#FFD700',
    cream: '#94A3B8',
  },
  // Badge colors
  badge: {
    highIntensity: '#135BEC',
    hardSparring: '#135BEC',
    allLevels: '#22C55E',
    new: '#135BEC',
    pending: '#F59E0B',
    verified: '#3B82F6',
  },
  // Combat sport colors (domain colors, kept distinct)
  sport: {
    boxing: '#EF4444',      // Red
    mma: '#F97316',         // Vibrant Orange
    muay_thai: '#EAB308',   // Gold
    kickboxing: '#3B82F6',  // Blue
    // Lighter variants for backgrounds
    boxingLight: 'rgba(239, 68, 68, 0.15)',
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

// Animation durations & presets
export const animations = {
  fast: 150,
  normal: 250,
  slow: 400,
  // Spring configs for react-native-reanimated
  spring: {
    snappy: { damping: 20, stiffness: 300, mass: 0.8 },
    gentle: { damping: 25, stiffness: 150, mass: 1 },
    bouncy: { damping: 12, stiffness: 200, mass: 0.6 },
  },
  // Stagger delays for list entrance animations
  stagger: {
    fast: 50,
    normal: 80,
    slow: 120,
  },
};

// Gradient presets (color arrays for expo-linear-gradient)
export const gradients = {
  primaryToDeep: ['#135BEC', '#0A2D7A'] as const,
  primaryToCrimson: ['#3B82F6', '#135BEC'] as const,
  darkFade: ['rgba(16,22,34,0)', 'rgba(16,22,34,0.95)'] as const,
  cardShine: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)'] as const,
  heroOverlay: ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.85)'] as const,
  warmGlow: ['rgba(19,91,236,0.15)', 'rgba(19,91,236,0)'] as const,
  surface: ['#1A2438', '#161D2E'] as const,
};

// Glassmorphism tokens
export const glass = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    blurIntensity: 20,
  },
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    blurIntensity: 40,
  },
  dark: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    blurIntensity: 60,
  },
  accent: {
    backgroundColor: 'rgba(19, 91, 236, 0.08)',
    borderColor: 'rgba(19, 91, 236, 0.2)',
    borderWidth: 1,
    blurIntensity: 30,
  },
};

// Elevation system - layered surfaces for depth
export const elevation = {
  level0: { backgroundColor: '#101622' },   // Screen background
  level1: { backgroundColor: '#131A2A' },   // Recessed areas
  level2: { backgroundColor: '#161D2E' },   // Default surface
  level3: { backgroundColor: '#1A2438' },   // Cards, raised
  level4: { backgroundColor: '#1E2B44' },   // Floating elements
  level5: { backgroundColor: '#233250' },   // Top-most (modals)
};

// Pre-built text style presets
export const textStyles = {
  heroDisplay: {
    fontFamily: 'BarlowCondensed-Black' as const,
    fontSize: 48,
    letterSpacing: 2,
    lineHeight: 52,
    textTransform: 'uppercase' as const,
    color: colors.textPrimary,
  },
  sectionHeader: {
    fontFamily: 'BarlowCondensed-SemiBold' as const,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    color: colors.primary[500],
  },
  statValue: {
    fontFamily: 'BarlowCondensed-Bold' as const,
    fontSize: 36,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  cardTitle: {
    fontFamily: 'Inter-SemiBold' as const,
    fontSize: 16,
    letterSpacing: 0.2,
    color: colors.textPrimary,
  },
};

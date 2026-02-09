import { Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

// Breakpoints (matching Tailwind)
export const breakpoints = {
  sm: 640,   // Small devices (phones in landscape)
  md: 768,   // Tablets
  lg: 1024,  // Desktops
  xl: 1280,  // Large desktops
  '2xl': 1536, // Extra large desktops
};

// Current screen size helpers
export const screenWidth = width;
export const screenHeight = height;

export const isSmallScreen = width < breakpoints.sm;
export const isMediumScreen = width >= breakpoints.sm && width < breakpoints.md;
export const isLargeScreen = width >= breakpoints.md && width < breakpoints.lg;
export const isExtraLargeScreen = width >= breakpoints.lg;

// Device type detection
export const isPhone = isMobile || (isWeb && width < breakpoints.md);
export const isTablet = isWeb && width >= breakpoints.md && width < breakpoints.lg;
export const isDesktop = isWeb && width >= breakpoints.lg;

// Container max widths for web
export const containerMaxWidth: Record<string, number | '100%'> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  full: '100%',
};

// Get responsive value based on screen size
export function responsive<T>(config: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T {
  if (isDesktop && config.desktop !== undefined) return config.desktop;
  if (isTablet && config.tablet !== undefined) return config.tablet;
  if (isPhone && config.mobile !== undefined) return config.mobile;
  return config.default;
}

// Get container width for current screen
export function getContainerWidth(size: string = 'xl'): number | '100%' {
  if (!isWeb) return '100%';
  return containerMaxWidth[size] ?? '100%';
}

// Sidebar configuration for web
export const webLayout = {
  sidebarWidth: 280,
  sidebarWidthCollapsed: 80,
  headerHeight: 64,
  mobileHeaderHeight: 56,
};

// Grid columns for responsive layouts
export function getGridColumns() {
  if (width >= breakpoints['2xl']) return 4;
  if (width >= breakpoints.xl) return 3;
  if (width >= breakpoints.lg) return 3;
  if (width >= breakpoints.md) return 2;
  return 1;
}

// Spacing multipliers for different screen sizes
export function getSpacingMultiplier(): number {
  if (isDesktop) return 1.2;
  if (isTablet) return 1.1;
  return 1;
}

// Font size adjustments for web
export function getWebFontSize(baseFontSize: number): number {
  if (!isWeb) return baseFontSize;
  if (isDesktop) return baseFontSize * 1.1;
  if (isTablet) return baseFontSize * 1.05;
  return baseFontSize;
}

// Check if we should show mobile nav
export function shouldUseMobileNav(): boolean {
  return isMobile || (isWeb && width < breakpoints.lg);
}

// Check if we should show sidebar
export function shouldShowSidebar(): boolean {
  return isWeb && width >= breakpoints.lg;
}

// Get appropriate padding for content
export function getContentPadding(): number {
  if (isDesktop) return 32;
  if (isTablet) return 24;
  return 16;
}

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../lib/theme';

export type WatermarkPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface WatermarkOverlayProps {
  position?: WatermarkPosition;
  opacity?: number;
  size?: 'small' | 'medium';
}

/**
 * Subtle watermark overlay for videos/images
 * Designed to be visible but not distracting
 */
export function WatermarkOverlay({
  position = 'bottom-right',
  opacity = 0.7,
  size = 'small',
}: WatermarkOverlayProps) {
  const positionStyles = getPositionStyles(position);
  const sizeStyles = getSizeStyles(size);

  return (
    <View style={[styles.container, positionStyles]} pointerEvents="none">
      <View style={[styles.watermark, { opacity }]}>
        <Text style={[styles.logoText, sizeStyles.logoText]}>FIGHT</Text>
        <Text style={[styles.logoTextAccent, sizeStyles.logoText]}>STATION</Text>
      </View>
      <Text style={[styles.urlText, sizeStyles.urlText, { opacity: opacity * 0.8 }]}>
        fightstation.app
      </Text>
    </View>
  );
}

function getPositionStyles(position: WatermarkPosition) {
  switch (position) {
    case 'bottom-right':
      return { bottom: 16, right: 16 };
    case 'bottom-left':
      return { bottom: 16, left: 16 };
    case 'top-right':
      return { top: 16, right: 16 };
    case 'top-left':
      return { top: 16, left: 16 };
  }
}

function getSizeStyles(size: 'small' | 'medium') {
  if (size === 'small') {
    return {
      logoText: { fontSize: 12 },
      urlText: { fontSize: 8 },
    };
  }
  return {
    logoText: { fontSize: 16 },
    urlText: { fontSize: 10 },
  };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'flex-end',
  },
  watermark: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  logoText: {
    fontWeight: 'bold',
    color: colors.neutral[50],
    letterSpacing: 1,
  },
  logoTextAccent: {
    fontWeight: 'bold',
    color: colors.primary[400],
    letterSpacing: 1,
    marginLeft: 2,
  },
  urlText: {
    color: colors.neutral[300],
    marginTop: 2,
  },
});
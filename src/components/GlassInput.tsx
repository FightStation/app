import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
  StyleProp,
  TextStyle,
  Platform,
} from 'react-native';
import { colors, borderRadius, spacing, typography, glass } from '../lib/theme';

interface GlassInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  style?: StyleProp<TextStyle>;
}

export function GlassInput({
  label,
  error,
  helperText,
  containerStyle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  multiline,
  ...props
}: GlassInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const inputContainerStyles: ViewStyle[] = [
    styles.inputContainer as ViewStyle,
    multiline ? (styles.inputContainerMultiline as ViewStyle) : undefined,
    isFocused ? (styles.inputFocused as ViewStyle) : undefined,
    isFocused && !error && (Platform.OS === 'ios' || Platform.OS === 'web')
      ? (styles.inputFocusGlow as ViewStyle)
      : undefined,
    error ? (styles.inputError as ViewStyle) : undefined,
  ].filter(Boolean) as ViewStyle[];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={inputContainerStyles}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : undefined,
            multiline ? styles.inputMultiline : undefined,
            style,
          ]}
          placeholderTextColor={colors.neutral[500]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...props}
        />

        {rightIcon && (
          <TouchableOpacity
            style={styles.iconRight}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {helperText && !error && <Text style={styles.helper}>{helperText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  label: {
    color: colors.neutral[200],
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing[2],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.light.backgroundColor,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: glass.light.borderColor,
    ...(Platform.OS === 'web'
      ? {
          // @ts-ignore
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }
      : {}),
  },
  inputContainerMultiline: {
    alignItems: 'flex-start',
  },
  inputFocused: {
    borderColor: colors.primary[500],
  },
  inputFocusGlow: {
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    padding: spacing[4],
    color: colors.neutral[50],
    fontSize: typography.fontSize.base,
  },
  inputMultiline: {
    minHeight: 120,
    paddingTop: spacing[4],
  },
  inputWithLeftIcon: {
    paddingLeft: spacing[2],
  },
  iconLeft: {
    paddingLeft: spacing[4],
  },
  iconRight: {
    paddingRight: spacing[4],
  },
  error: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[1],
  },
  helper: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.sm,
    marginTop: spacing[1],
  },
});

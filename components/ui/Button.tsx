import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Spacing, Shadow } from '../../constants/spacing';
import { TextStyles, FontWeight } from '../../constants/typography';
import { Typography } from './Typography';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<Variant, { container: ViewStyle; label: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: Colors.primary,
      ...Shadow.lg,
    },
    label: { color: Colors.textInverse, fontWeight: FontWeight.semibold },
  },
  secondary: {
    container: {
      backgroundColor: Colors.primaryLight,
      borderWidth: 1.5,
      borderColor: Colors.primary,
    },
    label: { color: Colors.primary, fontWeight: FontWeight.semibold },
  },
  ghost: {
    container: {
      backgroundColor: Colors.transparent,
    },
    label: { color: Colors.primary, fontWeight: FontWeight.medium },
  },
  danger: {
    container: {
      backgroundColor: Colors.errorLight,
      borderWidth: 1.5,
      borderColor: Colors.error,
    },
    label: { color: Colors.error, fontWeight: FontWeight.semibold },
  },
};

const sizeStyles: Record<Size, { container: ViewStyle; label: TextStyle }> = {
  sm: {
    container: { paddingVertical: Spacing[2], paddingHorizontal: Spacing[4], borderRadius: Radius.md },
    label: { ...TextStyles.bodySmall },
  },
  md: {
    container: { paddingVertical: Spacing[3] + 2, paddingHorizontal: Spacing[6], borderRadius: Radius.xl },
    label: { ...TextStyles.button },
  },
  lg: {
    container: { paddingVertical: Spacing[4], paddingHorizontal: Spacing[8], borderRadius: Radius['2xl'] },
    label: { ...TextStyles.button, fontSize: 17 },
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
}: ButtonProps) {
  const vs = variantStyles[variant];
  const ss = sizeStyles[size];
  const opacity = disabled || loading ? 0.5 : 1;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        vs.container,
        ss.container,
        fullWidth && styles.fullWidth,
        { opacity },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.textInverse : Colors.primary}
          size="small"
        />
      ) : (
        <View style={styles.inner}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Typography
            variant="button"
            style={[vs.label, ss.label]}
          >
            {label}
          </Typography>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: { marginRight: Spacing[2] },
  iconRight: { marginLeft: Spacing[2] },
});

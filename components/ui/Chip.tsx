import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/spacing';
import { Typography } from './Typography';

interface ChipProps {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  color?: string;
  style?: ViewStyle;
}

export function Chip({ label, onPress, selected = false, color = Colors.primary, style }: ChipProps) {
  const bg = selected ? color : Colors.primaryLight;
  const textColor = selected ? Colors.textInverse : color;

  const inner = (
    <View style={[styles.chip, { backgroundColor: bg }, style]}>
      <Typography variant="caption" color={textColor} style={styles.text}>
        {label}
      </Typography>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: Spacing[1],
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.full,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

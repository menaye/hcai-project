import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Shadow, Spacing } from '../../constants/spacing';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: number;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  color?: string;
}

export function Card({
  children,
  padding = Spacing[5],
  elevated = false,
  style,
  color = Colors.surface,
  ...rest
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        { padding, backgroundColor: color },
        elevated ? Shadow.md : Shadow.sm,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
});

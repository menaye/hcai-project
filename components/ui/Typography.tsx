import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { TextStyles } from '../../constants/typography';

type Variant = keyof typeof TextStyles;

interface TypographyProps extends TextProps {
  variant?: Variant;
  color?: string;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export function Typography({
  variant = 'body',
  color = Colors.textPrimary,
  align = 'left',
  style,
  children,
  ...rest
}: TypographyProps) {
  return (
    <Text
      style={[TextStyles[variant], { color, textAlign: align }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

// Convenience shorthand components
export const H1 = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="heading1" {...props} />
);
export const H2 = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="heading2" {...props} />
);
export const H3 = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="heading3" {...props} />
);
export const H4 = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="heading4" {...props} />
);
export const Body = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="body" {...props} />
);
export const BodyLarge = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="bodyLarge" {...props} />
);
export const BodySmall = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="bodySmall" {...props} />
);
export const Label = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="label" {...props} />
);
export const Caption = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="caption" {...props} />
);

import React, { useState, useRef } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/spacing';
import { FontSize, FontWeight, LineHeight } from '../../constants/typography';
import { Typography } from './Typography';

interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  containerStyle?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
}

export function Input({
  label,
  hint,
  error,
  containerStyle,
  multiline = false,
  numberOfLines = 1,
  style,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.error
    : focused
    ? Colors.borderActive
    : Colors.border;

  return (
    <View style={containerStyle}>
      {label && (
        <Typography
          variant="label"
          color={focused ? Colors.primary : Colors.textSecondary}
          style={styles.label}
        >
          {label}
        </Typography>
      )}
      <View style={[styles.inputWrapper, { borderColor }]}>
        <TextInput
          style={[
            styles.input,
            multiline && { minHeight: numberOfLines * 24, textAlignVertical: 'top' },
            style,
          ]}
          placeholderTextColor={Colors.textTertiary}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
      </View>
      {(hint || error) && (
        <Typography
          variant="caption"
          color={error ? Colors.error : Colors.textTertiary}
          style={styles.hint}
        >
          {error ?? hint}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: Spacing[1] + 2,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[4],
    paddingVertical: Platform.OS === 'ios' ? Spacing[3] : Spacing[2],
  },
  input: {
    fontSize: FontSize.base,
    lineHeight: LineHeight.base,
    color: Colors.textPrimary,
    fontWeight: FontWeight.regular,
    padding: 0,
    margin: 0,
  },
  hint: {
    marginTop: Spacing[1],
    marginLeft: Spacing[1],
  },
});

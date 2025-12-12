import React from 'react';
import { Text as RNText, StyleSheet, TextStyle } from 'react-native';
import { colors, fontSizes } from '../../constants/theme';

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption';

interface TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  style?: TextStyle;
  color?: string;
  numberOfLines?: number;
}

export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  style,
  color,
  numberOfLines,
}) => {
  const variantStyles = {
    h1: styles.h1,
    h2: styles.h2,
    h3: styles.h3,
    body: styles.body,
    caption: styles.caption,
  };

  return (
    <RNText
      style={[
        styles.base,
        variantStyles[variant],
        color && { color },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
  h1: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    lineHeight: fontSizes.xxl * 1.3,
  },
  h2: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    lineHeight: fontSizes.xl * 1.3,
  },
  h3: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    lineHeight: fontSizes.lg * 1.4,
  },
  body: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
  },
  caption: {
    fontSize: fontSizes.sm,
    color: colors.textLight,
    lineHeight: fontSizes.sm * 1.4,
  },
});


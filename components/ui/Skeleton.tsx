import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  style?: any;
  borderRadius?: number;
}

export const Skeleton = ({ 
  width = '100%', 
  height = 20, 
  style,
  borderRadius: customBorderRadius,
}: SkeletonProps) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: customBorderRadius || borderRadius.md,
          opacity,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border,
  },
});

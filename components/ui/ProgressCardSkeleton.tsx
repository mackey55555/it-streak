import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { Card } from './Card';
import { colors, spacing, borderRadius } from '../../constants/theme';

export const ProgressCardSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <Card style={styles.card}>
      <View style={[styles.titleSkeleton, styles.shimmerContainer]}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
      <View style={[styles.progressTextSkeleton, styles.shimmerContainer]}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
      <View style={[styles.progressBarSkeleton, styles.shimmerContainer]}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
      <View style={[styles.captionSkeleton, styles.shimmerContainer]}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
  },
  titleSkeleton: {
    width: '40%',
    height: 24,
    borderRadius: borderRadius.md,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  progressTextSkeleton: {
    width: '35%',
    height: 28,
    borderRadius: borderRadius.md,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressBarSkeleton: {
    width: '100%',
    height: 16,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginVertical: spacing.md,
    overflow: 'hidden',
  },
  captionSkeleton: {
    width: '60%',
    height: 16,
    borderRadius: borderRadius.md,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  shimmerContainer: {
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});

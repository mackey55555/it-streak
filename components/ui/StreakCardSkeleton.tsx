import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { Card } from './Card';
import { colors, spacing } from '../../constants/theme';

export const StreakCardSkeleton = () => {
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
      <View style={styles.content}>
        <View style={styles.emojiContainer}>
          <View style={[styles.emojiSkeleton, styles.shimmerContainer]}>
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX }],
                },
              ]}
            />
          </View>
        </View>
        <View style={styles.textContainer}>
          <View style={[styles.numberSkeleton, styles.shimmerContainer]}>
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX }],
                },
              ]}
            />
          </View>
          <View style={[styles.labelSkeleton, styles.shimmerContainer]}>
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX }],
                },
              ]}
            />
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.streak,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderWidth: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiContainer: {
    marginRight: spacing.lg,
  },
  emojiSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.streak + '60',
    overflow: 'hidden',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  numberSkeleton: {
    width: 60,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.streak + '80',
    overflow: 'hidden',
  },
  labelSkeleton: {
    width: 70,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.streak + '80',
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
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});

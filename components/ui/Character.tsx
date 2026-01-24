import React, { useEffect, useRef } from 'react';
import { Image, ImageSourcePropType, StyleSheet, Animated, ViewStyle } from 'react-native';

export type CharacterType =
  | 'correct'
  | 'incorrect'
  | 'result-high'
  | 'result-good'
  | 'result-medium'
  | 'result-low'
  | 'streak-side'
  | 'streak-celebration'
  | 'progress-complete'
  | 'progress-ongoing'
  | 'explain'
  | 'loading'
  | 'welcome'
  | 'empty'
  | 'error';

interface CharacterProps {
  type: CharacterType;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  style?: ViewStyle;
}

const characterImages: Record<CharacterType, ImageSourcePropType> = {
  correct: require('../../assets/character-correct.png'),
  incorrect: require('../../assets/character-incorrect.png'),
  'result-high': require('../../assets/character-result-high.png'),
  'result-good': require('../../assets/character-result-good.png'),
  'result-medium': require('../../assets/character-result-medium.png'),
  'result-low': require('../../assets/character-result-low.png'),
  'streak-side': require('../../assets/character-streak-side.png'),
  'streak-celebration': require('../../assets/character-streak-celebration.png'),
  'progress-complete': require('../../assets/character-progress-complete.png'),
  'progress-ongoing': require('../../assets/character-progress-ongoing.png'),
  explain: require('../../assets/character-explain.png'),
  loading: require('../../assets/character-loading.png'),
  welcome: require('../../assets/character-welcome.png'),
  empty: require('../../assets/character-empty.png'),
  error: require('../../assets/character-error.png'),
};

const sizeMap = {
  small: { width: 80, height: 100 },
  medium: { width: 130, height: 160 },
  large: { width: 160, height: 200 },
};

export const Character: React.FC<CharacterProps> = ({
  type,
  size = 'medium',
  animated = false,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      // スケールアニメーション（拡大→縮小）
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // バウンスアニメーション（上下に動く）
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated]);

  const dimensions = sizeMap[size];
  const imageSource = characterImages[type];
  
  // styleからwidth/heightを抽出（カスタムサイズ指定に対応）
  const customWidth = (style as any)?.width;
  const customHeight = (style as any)?.height;
  const finalWidth = customWidth || dimensions.width;
  const finalHeight = customHeight || dimensions.height;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: finalWidth,
          height: finalHeight,
          transform: [
            { scale: scaleAnim },
            { translateY: bounceAnim },
          ],
        },
        style,
      ]}
    >
      <Image
        source={imageSource}
        style={[styles.image, { width: finalWidth, height: finalHeight }]}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

import React, { useMemo } from 'react';
import { View, Image, StyleSheet, ImageSourcePropType, useWindowDimensions } from 'react-native';
import { colors } from '../constants/theme';

const PEEK_IMAGES: Record<'left' | 'right' | 'bottom', ImageSourcePropType> = {
  left: require('../assets/character-peek-left.png'),
  right: require('../assets/character-peek-right.png'),
  bottom: require('../assets/character-peek-bottom.png'),
};

// 画像のアスペクト比（width / height）
const PEEK_ASPECT_RATIO = {
  left: 626 / 1042,   // ≈ 0.601
  right: 529 / 921,   // ≈ 0.574
  bottom: 782 / 525,  // ≈ 1.49
};

const SPLASH_LOGO = require('../assets/splash-icon.png');

const PEEK_OPTIONS: Array<'left' | 'right' | 'bottom'> = ['left', 'right', 'bottom'];

// 中央ロゴとかぶらないゾーン（画面の上から35%より上 / 下から35%より下）
const CENTER_AVOID_RATIO = 0.35;

export function SplashCharacterScreen() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const peek = useMemo<'left' | 'right' | 'bottom'>(
    () => PEEK_OPTIONS[Math.floor(Math.random() * PEEK_OPTIONS.length)],
    []
  );

  const maxHeightSide = Math.min(screenHeight * 0.5, 320);
  const maxHeightBottom = Math.min(screenHeight * 0.35, 280);

  // 左右のすとりーの縦位置（中央を避けてランダム、画面内に収める）
  const sidePeekVerticalStyle = useMemo(() => {
    if (peek === 'bottom') return {};
    const maxTop = Math.max(0, screenHeight - maxHeightSide); // 画像が下にはみ出さない
    if (maxTop <= 0) return { top: 0 };
    // 画像の中心がこの範囲にあるとロゴと重なる → 上ゾーン or 下ゾーンからランダムに選択
    const centerZoneTop = screenHeight * CENTER_AVOID_RATIO - maxHeightSide / 2;     // 上ゾーン: top は 0〜これ
    const centerZoneBottom = screenHeight * (1 - CENTER_AVOID_RATIO) - maxHeightSide / 2; // 下ゾーン: top はこれ〜maxTop
    const upperMax = Math.max(0, Math.min(maxTop, centerZoneTop));
    const lowerMin = Math.min(maxTop, Math.max(0, centerZoneBottom));
    const upperValid = upperMax > 0;
    const lowerValid = lowerMin < maxTop;
    const useUpper = !lowerValid ? true : (!upperValid ? false : Math.random() < 0.5);
    const top = useUpper
      ? (upperValid ? Math.random() * upperMax : 0)
      : (lowerValid ? lowerMin + Math.random() * (maxTop - lowerMin) : maxTop);
    return { top: Math.max(0, Math.min(maxTop, top)) };
  }, [peek, screenHeight, maxHeightSide]);

  return (
    <View style={styles.container}>
      {/* ネイティブスプラッシュと同じ中央ロゴ（画面幅いっぱい） */}
      <View style={[styles.logoWrap, { zIndex: 0 }]}>
        <Image
          source={SPLASH_LOGO}
          style={[styles.logo, { width: screenWidth, height: screenWidth }]}
          resizeMode="contain"
          accessibilityLabel="IT Streak"
        />
      </View>
      {/* すとりーひょっこり（前面に表示・左右は画面端ぴったり） */}
      <View style={[styles.characterWrap, { zIndex: 10 }]}>
        {peek === 'left' && (
          <Image
            source={PEEK_IMAGES.left}
            style={[
              styles.leftPeek,
              { height: maxHeightSide, width: maxHeightSide * PEEK_ASPECT_RATIO.left },
              sidePeekVerticalStyle,
            ]}
            resizeMode="cover"
            accessibilityLabel="すとりー"
          />
        )}
        {peek === 'right' && (
          <Image
            source={PEEK_IMAGES.right}
            style={[
              styles.rightPeek,
              { height: maxHeightSide, width: maxHeightSide * PEEK_ASPECT_RATIO.right },
              sidePeekVerticalStyle,
            ]}
            resizeMode="cover"
            accessibilityLabel="すとりー"
          />
        )}
        {peek === 'bottom' && (
          <View style={styles.bottomWrap}>
            <Image
              source={PEEK_IMAGES.bottom}
              style={[styles.bottomImage, { height: maxHeightBottom, width: screenWidth }]}
              resizeMode="contain"
              accessibilityLabel="すとりー"
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  logoWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {},
  characterWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  leftPeek: {
    position: 'absolute',
    left: 0,
  },
  rightPeek: {
    position: 'absolute',
    right: 0,
  },
  bottomWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bottomImage: {},
});

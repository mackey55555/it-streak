import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { colors } from '../../constants/theme';

interface ConfettiProps {
  visible: boolean;
  duration?: number;
}

const CONFETTI_COLORS = [
  colors.primary,
  colors.secondary,
  colors.correct,
  colors.streak,
  '#FF6B6B', // 赤
  '#4ECDC4', // シアン
  '#FFE66D', // 黄色
  '#A8E6CF', // ミント
  '#FF9FF3', // ピンク
  '#54A0FF', // 青
  '#5F27CD', // 紫
  '#FF6348', // トマト
  '#FFA502', // オレンジ
  '#00D2D3', // ターコイズ
  '#FFC312', // ゴールド
  '#C44569', // ローズ
  '#00B894', // エメラルド
];

const CONFETTI_COUNT = 120; // 50から120に増加

interface ConfettiData {
  startX: number;
  startY: number;
  peakY: number; // 放物線の頂点（最高点）
  endX: number;
  endY: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  shape: 'circle' | 'square' | 'rectangle';
  horizontalSway: number; // 左右の揺れ
}

export const Confetti = ({ visible, duration = 2000 }: ConfettiProps) => {
  const confettiDataRef = useRef<ConfettiData[]>([]);
  const confettiRefs = useRef<Animated.Value[]>([]);
  const opacityRefs = useRef<Animated.Value[]>([]);
  const isInitializedRef = useRef(false);
  const animationRunningRef = useRef(false);

  // 紙吹雪のデータとアニメーション値を初期化（一度だけ）
  useEffect(() => {
    if (isInitializedRef.current) {
      return; // 既に初期化済みの場合は何もしない
    }

    const initData = () => {
      const { width, height } = Dimensions.get('window');
      
      if (width > 0 && height > 0) {
        // データを初期化
        confettiDataRef.current = Array.from({ length: CONFETTI_COUNT }, () => {
          // 画面の左右（画面外）の下部から開始
          const isLeftSide = Math.random() > 0.5;
          const startX = isLeftSide 
            ? -50 - Math.random() * 100 // 左側の画面外
            : width + 50 + Math.random() * 100; // 右側の画面外
          const startY = height * 0.8 + Math.random() * height * 0.2; // 画面下部80-100%の位置
          
          // 画面中央に向かって吹き上がってから落下
          const centerX = width / 2;
          const endX = centerX + (Math.random() - 0.5) * width * 0.5; // 中央付近に散る
          const peakY = -50 - Math.random() * 100; // 最高点（画面上部の外まで吹き上がる）
          const endY = height * 0.5 + Math.random() * height * 0.5; // 画面中央から下部に落下
          
          const rotation = Math.random() * 1440; // より多く回転（最大4回転）
          const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
          const size = Math.random() * 12 + 5; // サイズのバリエーションを増やす（5-17px）
          const delay = 0; // 遅延なし（即座に開始）
          const animDuration = duration + Math.random() * 800; // アニメーション時間
          const shape = Math.random() > 0.7 
            ? (Math.random() > 0.5 ? 'square' : 'rectangle')
            : 'circle'; // 70%が円、30%が四角
          const horizontalSway = (Math.random() - 0.5) * width * 0.3; // 左右の揺れ

          return {
            startX,
            startY,
            peakY,
            endX,
            endY,
            rotation,
            color,
            size,
            delay,
            duration: animDuration,
            shape,
            horizontalSway,
          };
        });

        // アニメーション値を初期化（一度だけ）
        confettiRefs.current = Array.from({ length: CONFETTI_COUNT }, () => new Animated.Value(0));
        opacityRefs.current = Array.from({ length: CONFETTI_COUNT }, () => new Animated.Value(1));
        
        isInitializedRef.current = true;
      }
    };
    
    initData();
    // 画面サイズが取得できていない場合は少し待って再試行
    const { width, height } = Dimensions.get('window');
    if (width === 0 || height === 0) {
      const timer = setTimeout(() => {
        if (!isInitializedRef.current) {
          initData();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  useEffect(() => {
    if (!visible) {
      // 非表示時はリセット
      if (isInitializedRef.current && confettiRefs.current.length > 0) {
        confettiRefs.current.forEach((anim) => anim.setValue(0));
        opacityRefs.current.forEach((anim) => anim.setValue(1));
      }
      animationRunningRef.current = false;
      return;
    }

    // データが初期化されていない場合は待つ
    if (!isInitializedRef.current || confettiDataRef.current.length === 0) {
      return;
    }

    // 既にアニメーションが実行中の場合はスキップ
    if (animationRunningRef.current) {
      return;
    }

    animationRunningRef.current = true;

    // アニメーション値をリセット
    confettiRefs.current.forEach((anim) => anim.setValue(0));
    opacityRefs.current.forEach((anim) => anim.setValue(1));

    // アニメーション開始
    const animations = confettiRefs.current.map((anim, index) => {
      const data = confettiDataRef.current[index];
      
      return Animated.parallel([
        Animated.timing(anim, {
          toValue: 1,
          duration: data.duration,
          delay: data.delay,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(opacityRefs.current[index], {
          toValue: 0,
          duration: data.duration * 0.7,
          delay: data.delay + data.duration * 0.3,
          useNativeDriver: true,
        }),
      ]);
    });

    const parallelAnimation = Animated.parallel(animations);
    
    // コールバックを安全に処理
    let isCleanedUp = false;
    parallelAnimation.start((finished) => {
      if (!isCleanedUp && finished) {
        animationRunningRef.current = false;
      }
    });

    // アニメーション終了後にリセット
    const timeoutId = setTimeout(() => {
      if (!isCleanedUp) {
        confettiRefs.current.forEach((anim) => {
          try {
            anim.setValue(0);
          } catch (e) {
            // エラーを無視
          }
        });
        opacityRefs.current.forEach((anim) => {
          try {
            anim.setValue(1);
          } catch (e) {
            // エラーを無視
          }
        });
        animationRunningRef.current = false;
      }
    }, duration + 1500);

    return () => {
      isCleanedUp = true;
      clearTimeout(timeoutId);
      try {
        parallelAnimation.stop();
      } catch (e) {
        // エラーを無視
      }
      animationRunningRef.current = false;
    };
  }, [visible, duration]);

  if (!visible || !isInitializedRef.current || confettiDataRef.current.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiDataRef.current.map((data, index) => {
        const animValue = confettiRefs.current[index];
        const opacityValue = opacityRefs.current[index];

        if (!animValue || !opacityValue) {
          return null;
        }

        // 放物線を描く：まず上昇（0-0.4）、その後落下（0.4-1）
        const translateY = animValue.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [data.startY, data.peakY, data.endY],
        });

        // 横方向の動き：左右から中央に向かって、途中で揺れながら
        const translateX = animValue.interpolate({
          inputRange: [0, 0.3, 0.7, 1],
          outputRange: [
            data.startX,
            data.startX + (data.endX - data.startX) * 0.3 + data.horizontalSway,
            data.startX + (data.endX - data.startX) * 0.7 - data.horizontalSway,
            data.endX,
          ],
        });

        // より速い回転
        const rotate = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${data.rotation}deg`],
        });

        // 形状に応じたスタイル
        const shapeStyle = data.shape === 'circle'
          ? { borderRadius: data.size / 2 }
          : data.shape === 'square'
          ? { borderRadius: 2 }
          : { 
              borderRadius: 2,
              width: data.size * 1.5,
              height: data.size * 0.6,
            };

        return (
          <Animated.View
            key={`confetti-${index}`}
            style={[
              styles.confetti,
              {
                backgroundColor: data.color,
                width: data.shape === 'rectangle' ? data.size * 1.5 : data.size,
                height: data.shape === 'rectangle' ? data.size * 0.6 : data.size,
                left: 0,
                top: 0,
                transform: [
                  { translateX },
                  { translateY },
                  { rotate },
                ],
                opacity: opacityValue,
                ...shapeStyle,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  confetti: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    borderRadius: 2,
  },
});

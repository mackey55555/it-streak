import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, ProgressBar, Text, ErrorView, Skeleton, Character } from '../../components/ui';
import { Confetti } from '../../components/ui/Confetti';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { notificationSuccess, notificationError, impactMedium } from '../../lib/haptics';
import { useQuiz } from '../../hooks/useQuiz';
import { useDailyProgress } from '../../hooks/useDailyProgress';
import { useStreak } from '../../hooks/useStreak';

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; categoryId?: string }>();
  const { 
    currentQuestion, 
    currentIndex, 
    totalQuestions, 
    isFinished,
    correctCount,
    loading, 
    error,
    fetchQuestions,
    fetchIncorrectQuestions,
    submitAnswer,
    nextQuestion,
  } = useQuiz(5);
  
  const { recordProgress } = useDailyProgress();
  const { updateStreak } = useStreak();

  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [currentExplanation, setCurrentExplanation] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);
  const resultBannerScale = useRef(new Animated.Value(0)).current;

  // 初回読み込み
  useEffect(() => {
    // パラメータに応じて問題を取得
    if (params.mode === 'review') {
      // 苦手な問題を復習
      fetchIncorrectQuestions();
    } else if (params.categoryId) {
      // 分野別に学習
      fetchQuestions(params.categoryId);
    } else {
      // ランダムチャレンジまたは通常の学習
      fetchQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.categoryId, params.mode]);

  // クイズ終了時
  useEffect(() => {
    if (isFinished && totalQuestions > 0) {
      updateStreak();
      router.replace({
        pathname: '/quiz/result',
        params: { 
          correct: correctCount.toString(), 
          total: totalQuestions.toString() 
        }
      });
    }
  }, [isFinished, totalQuestions]);

  const handleChoiceSelect = (choice: string) => {
    if (answerState === 'unanswered') {
      impactMedium();
      setSelectedChoice(choice);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedChoice || !currentQuestion) return;
    
    const result = await submitAnswer(selectedChoice as 'A' | 'B' | 'C' | 'D');
    if (result) {
      const isCorrect = result.isCorrect;
      if (isCorrect) {
        notificationSuccess();
      } else {
        notificationError();
      }
      setAnswerState(isCorrect ? 'correct' : 'incorrect');
      setCurrentExplanation(currentQuestion.explanation || '');
      recordProgress(isCorrect);

      // 正解時のアニメーション（同時に開始）
      if (isCorrect) {
        // 紙吹雪とポップアップを同時に開始
        setShowConfetti(true);
        Animated.spring(resultBannerScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(resultBannerScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const handleNext = () => {
    setSelectedChoice(null);
    setAnswerState('unanswered');
    setCurrentExplanation('');
    setShowConfetti(false);
    resultBannerScale.setValue(0);
    nextQuestion();
  };

  const handleClose = () => {
    impactMedium();
    router.back();
  };

  const getChoiceStyle = (choiceLetter: string) => {
    if (answerState === 'unanswered') {
      return selectedChoice === choiceLetter 
        ? [styles.choice, styles.choiceSelected] 
        : styles.choice;
    }
    
    if (currentQuestion && choiceLetter === currentQuestion.correct_answer) {
      return [styles.choice, styles.choiceCorrect];
    }
    if (choiceLetter === selectedChoice) {
      return [styles.choice, styles.choiceIncorrect];
    }
    return styles.choice;
  };

  // ローディング中
  if (loading && !currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Skeleton width={36} height={36} borderRadius={18} />
            <Skeleton width={52} height={18} />
          </View>
          <View style={styles.progressContainer}>
            <Skeleton width="100%" height={8} />
          </View>
        </View>
        <View style={styles.content}>
          <Card style={styles.questionCard}>
            <Skeleton width="100%" height={24} style={{ marginBottom: spacing.md }} />
            <Skeleton width="90%" height={20} style={{ marginBottom: spacing.sm }} />
            <Skeleton width="80%" height={20} />
          </Card>
          <View style={styles.choicesContainer}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} width="100%" height={60} style={{ marginBottom: spacing.md }} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // エラー時
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorView
          message={error}
          onRetry={fetchQuestions}
          retryLabel="再試行"
        />
        <View style={styles.errorFooter}>
          <Button title="戻る" onPress={handleClose} variant="ghost" />
        </View>
      </SafeAreaView>
    );
  }

  // 問題がない場合
  if (!currentQuestion && !loading) {
    const errorMessage = params.categoryId 
      ? 'この分野には問題が登録されていません'
      : params.mode === 'review'
      ? '復習する問題がありません'
      : '問題がありません';
    
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textLight} style={styles.errorIcon} />
        <Text variant="h3" style={styles.errorTitle}>{errorMessage}</Text>
        <Text variant="body" color={colors.textLight} style={styles.errorDescription}>
          {params.categoryId 
            ? '他の分野を選択するか、後でもう一度お試しください。'
            : params.mode === 'review'
            ? '問題を解いてから復習機能をご利用ください。'
            : 'しばらくしてからもう一度お試しください。'}
        </Text>
        <Button title="戻る" onPress={handleClose} style={styles.errorButton} />
      </SafeAreaView>
    );
  }

  const progress = totalQuestions > 0 ? (currentIndex + 1) / totalQuestions : 0;
  const choices = [
    { letter: 'A', text: currentQuestion.choice_a },
    { letter: 'B', text: currentQuestion.choice_b },
    { letter: 'C', text: currentQuestion.choice_c },
    { letter: 'D', text: currentQuestion.choice_d },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 紙吹雪アニメーション */}
      <Confetti visible={showConfetti} duration={2000} />
      
      {/* ヘッダー: 1行目=閉じる+数字、2行目=プログレスバー（全幅で確実に収まる） */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textLight} />
          </TouchableOpacity>
          <Text variant="caption" style={styles.questionNumber} numberOfLines={1}>
            {currentIndex + 1} / {totalQuestions}
          </Text>
        </View>
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} height={8} />
        </View>
      </View>

      {/* メインコンテンツ */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 問題カード */}
        <Card style={styles.questionCard}>
          <Text variant="body" style={styles.questionText}>
            {currentQuestion.question_text}
          </Text>
        </Card>

        {/* 選択肢 */}
        <View style={styles.choicesContainer}>
          {choices.map((choice) => (
            <TouchableOpacity
              key={choice.letter}
              style={getChoiceStyle(choice.letter)}
              onPress={() => handleChoiceSelect(choice.letter)}
              disabled={answerState !== 'unanswered'}
              activeOpacity={0.7}
            >
              <Text 
                variant="body" 
                style={[
                  styles.choiceText,
                  selectedChoice === choice.letter && answerState === 'unanswered' && styles.choiceTextSelected,
                ]}
              >
                {choice.letter}: {choice.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* フッター */}
      <View style={styles.footer}>
        {answerState === 'unanswered' ? (
          <Button
            title="回答する"
            onPress={handleSubmitAnswer}
            disabled={!selectedChoice}
            style={styles.actionButton}
          />
        ) : (
          <>
            {/* 正誤表示 */}
            <Animated.View
              style={[
                styles.resultBanner,
                answerState === 'correct' ? styles.resultCorrect : styles.resultIncorrect,
                {
                  transform: [{ scale: resultBannerScale }],
                },
              ]}
            >
              <View style={styles.resultContent}>
                <Character
                  type={answerState === 'correct' ? 'correct' : 'incorrect'}
                  size="medium"
                  animated={true}
                  style={styles.characterInBanner}
                />
                <View style={styles.resultTextContainer}>
                  <Text variant="h3" style={styles.resultTitle}>
                    {answerState === 'correct' ? '正解！' : '不正解'}
                  </Text>
                  {currentExplanation ? (
                    <Text variant="body" style={styles.explanation}>
                      {currentExplanation}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Animated.View>
            
            <Button
              title={currentIndex + 1 >= totalQuestions ? "結果を見る" : "次へ"}
              onPress={handleNext}
              style={styles.actionButton}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorIcon: {
    marginBottom: spacing.lg,
  },
  errorTitle: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  errorDescription: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  errorFooter: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  progressContainer: {
    width: '100%',
  },
  questionNumber: {
    fontSize: 14,
    color: colors.textLight,
    flexShrink: 0,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  questionCard: {
    marginBottom: spacing.xl,
    minHeight: 120,
    padding: spacing.xl,
  },
  questionText: {
    fontSize: 18,
    lineHeight: 28,
    color: colors.text,
  },
  choicesContainer: {
    gap: spacing.md,
  },
  choice: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    minHeight: 64, // タップ領域を確保
  },
  choiceSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  choiceCorrect: {
    backgroundColor: colors.correct + '20',
    borderColor: colors.correct,
    borderWidth: 3,
  },
  choiceIncorrect: {
    backgroundColor: colors.incorrect + '20',
    borderColor: colors.incorrect,
    borderWidth: 3,
  },
  choiceText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  choiceTextSelected: {
    fontWeight: '600',
  },
  footer: {
    padding: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: spacing.xl + 10, // SafeArea分の余白
  },
  actionButton: {
    width: '100%',
  },
  resultBanner: {
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    marginBottom: spacing.md,
    minHeight: 80,
  },
  resultCorrect: {
    backgroundColor: colors.correct,
  },
  resultIncorrect: {
    backgroundColor: colors.incorrect,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  characterInBanner: {
    marginRight: spacing.sm,
  },
  resultIcon: {
    fontSize: 32,
    color: colors.background,
  },
  resultTextContainer: {
    flex: 1,
    gap: spacing.sm,
  },
  resultTitle: {
    color: colors.background,
    fontWeight: 'bold',
    fontSize: 20,
  },
  explanation: {
    color: colors.background,
    lineHeight: 24,
    fontSize: 15,
  },
});

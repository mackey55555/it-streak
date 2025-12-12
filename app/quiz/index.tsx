import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Card, ProgressBar, Text } from '../../components/ui';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { useQuiz } from '../../hooks/useQuiz';
import { useDailyProgress } from '../../hooks/useDailyProgress';
import { useStreak } from '../../hooks/useStreak';

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

export default function QuizScreen() {
  const router = useRouter();
  const { 
    currentQuestion, 
    currentIndex, 
    totalQuestions, 
    isFinished,
    correctCount,
    loading, 
    error,
    fetchQuestions,
    submitAnswer,
    nextQuestion,
  } = useQuiz(5);
  
  const { recordProgress } = useDailyProgress();
  const { updateStreak } = useStreak();

  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [currentExplanation, setCurrentExplanation] = useState<string>('');

  // 初回読み込み
  useEffect(() => {
    fetchQuestions();
  }, []);

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
      setSelectedChoice(choice);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedChoice || !currentQuestion) return;
    
    const result = await submitAnswer(selectedChoice as 'A' | 'B' | 'C' | 'D');
    if (result) {
      setAnswerState(result.isCorrect ? 'correct' : 'incorrect');
      setCurrentExplanation(currentQuestion.explanation || '');
      recordProgress(result.isCorrect);
    }
  };

  const handleNext = () => {
    setSelectedChoice(null);
    setAnswerState('unanswered');
    setCurrentExplanation('');
    nextQuestion();
  };

  const handleClose = () => {
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
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text variant="body" style={styles.loadingText}>問題を読み込み中...</Text>
      </SafeAreaView>
    );
  }

  // エラー時
  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text variant="h3" color={colors.incorrect}>エラーが発生しました</Text>
        <Text variant="body" style={styles.errorText}>{error}</Text>
        <Button title="戻る" onPress={handleClose} style={styles.errorButton} />
      </SafeAreaView>
    );
  }

  // 問題がない場合
  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text variant="h3">問題がありません</Text>
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
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text variant="h2" color={colors.textLight}>✕</Text>
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} height={8} />
        </View>
        <Text variant="caption" style={styles.questionNumber}>
          {currentIndex + 1} / {totalQuestions}
        </Text>
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
            <View style={[
              styles.resultBanner,
              answerState === 'correct' ? styles.resultCorrect : styles.resultIncorrect
            ]}>
              <View style={styles.resultContent}>
                <Text variant="h2" style={styles.resultIcon}>
                  {answerState === 'correct' ? '✓' : '✕'}
                </Text>
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
            </View>
            
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
  errorText: {
    textAlign: 'center',
    color: colors.textLight,
  },
  errorButton: {
    marginTop: spacing.lg,
    minWidth: 120,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
  },
  questionNumber: {
    minWidth: 50,
    textAlign: 'right',
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
  },
  questionText: {
    fontSize: 18,
    lineHeight: 28,
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
  },
  choiceSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  choiceCorrect: {
    backgroundColor: colors.correct + '15',
    borderColor: colors.correct,
    borderWidth: 2,
  },
  choiceIncorrect: {
    backgroundColor: colors.incorrect + '15',
    borderColor: colors.incorrect,
    borderWidth: 2,
  },
  choiceText: {
    fontSize: 16,
    lineHeight: 24,
  },
  choiceTextSelected: {
    fontWeight: '600',
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    width: '100%',
  },
  resultBanner: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
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
  },
  explanation: {
    color: colors.background,
    lineHeight: 22,
  },
});

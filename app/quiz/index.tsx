import { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Card, ProgressBar, Text } from '../../components/ui';
import { colors, spacing, borderRadius } from '../../constants/theme';

// モックデータ
const mockQuestion = {
  question: "OSI基本参照モデルにおいて、ネットワーク層の役割はどれか。",
  choices: [
    "A: 伝送路上のビット列の伝送",
    "B: 隣接ノード間のデータ転送",
    "C: エンドツーエンドのデータ転送の信頼性確保",
    "D: ネットワーク上の経路選択"
  ],
  correctAnswer: "D",
  explanation: "ネットワーク層（第3層）は、異なるネットワーク間の経路選択（ルーティング）を行う層です。"
};

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

export default function QuizScreen() {
  const router = useRouter();
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  
  const currentQuestion = 3;
  const totalQuestions = 5;
  const progress = currentQuestion / totalQuestions;

  const handleChoiceSelect = (choice: string) => {
    if (answerState === 'unanswered') {
      setSelectedChoice(choice);
    }
  };

  const handleSubmitAnswer = () => {
    if (!selectedChoice) return;
    
    const isCorrect = selectedChoice === mockQuestion.correctAnswer;
    setAnswerState(isCorrect ? 'correct' : 'incorrect');
  };

  const handleNext = () => {
    // 次の問題へ（実装時はロジックを追加）
    setSelectedChoice(null);
    setAnswerState('unanswered');
  };

  const handleClose = () => {
    router.back();
  };

  const getChoiceStyle = (choice: string) => {
    if (answerState === 'unanswered') {
      return selectedChoice === choice ? styles.choiceSelected : styles.choice;
    }
    
    const choiceLetter = choice.split(':')[0];
    if (choiceLetter === mockQuestion.correctAnswer) {
      return [styles.choice, styles.choiceCorrect];
    }
    if (choiceLetter === selectedChoice) {
      return [styles.choice, styles.choiceIncorrect];
    }
    return styles.choice;
  };

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
          {currentQuestion} / {totalQuestions}
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
            {mockQuestion.question}
          </Text>
        </Card>

        {/* 選択肢 */}
        <View style={styles.choicesContainer}>
          {mockQuestion.choices.map((choice, index) => (
            <TouchableOpacity
              key={index}
              style={getChoiceStyle(choice)}
              onPress={() => handleChoiceSelect(choice.split(':')[0])}
              disabled={answerState !== 'unanswered'}
              activeOpacity={0.7}
            >
              <Text 
                variant="body" 
                style={[
                  styles.choiceText,
                  selectedChoice === choice.split(':')[0] && answerState === 'unanswered' && styles.choiceTextSelected,
                ]}
              >
                {choice}
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
                  <Text variant="body" style={styles.explanation}>
                    {mockQuestion.explanation}
                  </Text>
                </View>
              </View>
            </View>
            
            <Button
              title="次へ"
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
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  choiceCorrect: {
    backgroundColor: colors.correct + '15',
    borderColor: colors.correct,
    borderWidth: 3,
  },
  choiceIncorrect: {
    backgroundColor: colors.incorrect + '15',
    borderColor: colors.incorrect,
    borderWidth: 3,
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


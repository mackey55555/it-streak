import { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Text, Card } from '../../components/ui';
import { colors, spacing, borderRadius, fontSizes } from '../../constants/theme';
import { impactMedium } from '../../lib/haptics';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface Exam {
  id: string;
  name: string;
  description: string | null;
  questionCount: number;
}

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data: examsData, error } = await supabase
        .from('exams')
        .select('*')
        .order('name');

      if (error) throw error;

      if (examsData && examsData.length > 0) {
        // 各試験の問題数を取得
        const examsWithCounts = await Promise.all(
          examsData.map(async (exam) => {
            // 試験のカテゴリを取得
            const { data: categories } = await supabase
              .from('categories')
              .select('id')
              .eq('exam_id', exam.id);

            const categoryIds = categories?.map(c => c.id) || [];

            // 問題数を取得
            let questionCount = 0;
            if (categoryIds.length > 0) {
              const { count } = await supabase
                .from('questions')
                .select('*', { count: 'exact', head: true })
                .in('category_id', categoryIds);

              questionCount = count || 0;
            }

            return {
              ...exam,
              questionCount,
            };
          })
        );

        setExams(examsWithCounts);
        // デフォルトで基本情報技術者試験を選択（問題数が0でない場合）
        const basicInfoExam = examsWithCounts.find(e => e.name === '基本情報技術者試験' && e.questionCount > 0);
        if (basicInfoExam) {
          setSelectedExamId(basicInfoExam.id);
        } else {
          // 問題数が0でない最初の試験を選択
          const availableExam = examsWithCounts.find(e => e.questionCount > 0);
          if (availableExam) {
            setSelectedExamId(availableExam.id);
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError('すべての項目を入力してください');
      return;
    }

    if (!selectedExamId) {
      setError('試験を選択してください');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    setError('');
    const { error: signUpError, data: authData } = await signUp(email, password);

    if (signUpError) {
      setError(signUpError);
    } else if (authData?.user) {
      // プロフィールに選択した試験を設定
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ selected_exam_id: selectedExamId })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      Alert.alert(
        '登録完了',
        '確認メールを送信しました。メールを確認してアカウントを有効化してください。',
        [{ text: 'OK', onPress: () => router.push('/(auth)/login') }]
      );
    }
  };

  const handleLoginNavigation = () => {
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* ヘッダー */}
            <View style={styles.header}>
              <Text variant="h1" style={styles.title}>アカウント作成</Text>
              <Text variant="body" color={colors.textLight} style={styles.subtitle}>
                今日から学習をはじめよう！
              </Text>
            </View>

            {/* フォーム */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text variant="body" style={styles.label}>メールアドレス</Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  placeholderTextColor={colors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text variant="body" style={styles.label}>パスワード（6文字以上）</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text variant="body" style={styles.label}>パスワード（確認）</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textLight}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!loading}
                />
              </View>

              {/* 試験選択 */}
              <View style={styles.inputContainer}>
                <Text variant="body" style={styles.label}>学習する試験を選択</Text>
                {loadingExams ? (
                  <Text variant="body" color={colors.textLight}>読み込み中...</Text>
                ) : (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.examScrollView}
                    contentContainerStyle={styles.examScrollContent}
                  >
                    {exams.map((exam) => {
                      const isDisabled = exam.questionCount === 0;
                      return (
                        <TouchableOpacity
                          key={exam.id}
                          onPress={() => {
                            if (!isDisabled) {
                              impactMedium();
                              setSelectedExamId(exam.id);
                            }
                          }}
                          activeOpacity={isDisabled ? 1 : 0.7}
                          disabled={isDisabled}
                          style={styles.examCardWrapper}
                        >
                          <Card style={[
                            styles.examCard,
                            selectedExamId === exam.id && styles.examCardSelected,
                            isDisabled && styles.examCardDisabled
                          ]}>
                            <View style={styles.examCardContent}>
                              <Ionicons
                                name={selectedExamId === exam.id ? "radio-button-on" : "radio-button-off"}
                                size={20}
                                color={
                                  isDisabled 
                                    ? colors.textLight 
                                    : selectedExamId === exam.id 
                                      ? colors.primary 
                                      : colors.textLight
                                }
                              />
                              <View style={styles.examCardText}>
                                <View style={styles.examCardTitleRow}>
                                  <Text variant="body" style={[
                                    styles.examCardTitle,
                                    selectedExamId === exam.id && styles.examCardTitleSelected,
                                    isDisabled && styles.examCardTitleDisabled
                                  ]}>
                                    {exam.name}
                                  </Text>
                                  {isDisabled && (
                                    <View style={styles.preparingBadge}>
                                      <Text variant="caption" style={styles.preparingText}>
                                        準備中
                                      </Text>
                                    </View>
                                  )}
                                </View>
                                {exam.description && (
                                  <Text variant="caption" color={colors.textLight} style={[
                                    styles.examCardDescription,
                                    isDisabled && styles.examCardDescriptionDisabled
                                  ]}>
                                    {exam.description}
                                  </Text>
                                )}
                              </View>
                            </View>
                          </Card>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text variant="body" color={colors.incorrect}>
                    {error}
                  </Text>
                </View>
              ) : null}

              <Button
                title="アカウント作成"
                onPress={handleSignup}
                disabled={loading}
                loading={loading}
                style={styles.signupButton}
              />
            </View>

            {/* フッター */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => { impactMedium(); handleLoginNavigation(); }}>
                <Text variant="body" color={colors.primary} style={styles.loginText}>
                  すでにアカウントをお持ちの方はログイン
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xxl,
    alignItems: 'center',
  },
  title: {
    marginBottom: spacing.md,
    color: colors.primary,
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    gap: spacing.lg,
  },
  inputContainer: {
    gap: spacing.sm,
  },
  label: {
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: fontSizes.md,
    color: colors.text,
    minHeight: 52,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  errorContainer: {
    padding: spacing.md,
    backgroundColor: colors.incorrect + '15',
    borderRadius: borderRadius.sm,
  },
  signupButton: {
    marginTop: spacing.md,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  loginText: {
    fontWeight: '600',
  },
  examScrollView: {
    marginTop: spacing.sm,
  },
  examScrollContent: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  examCardWrapper: {
    width: 280,
  },
  examCard: {
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  examCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  examCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  examCardText: {
    flex: 1,
    gap: spacing.xs,
  },
  examCardTitle: {
    fontWeight: '600',
  },
  examCardTitleSelected: {
    color: colors.primary,
  },
  examCardDescription: {
    fontSize: 11,
    lineHeight: 16,
  },
  examCardDisabled: {
    opacity: 0.5,
    backgroundColor: colors.surface,
  },
  examCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  examCardTitleDisabled: {
    color: colors.textLight,
  },
  examCardDescriptionDisabled: {
    opacity: 0.6,
  },
  preparingBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  preparingText: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '600',
  },
});


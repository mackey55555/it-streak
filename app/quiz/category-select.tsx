import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Text, ErrorView, SkeletonCard } from '../../components/ui';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { impactMedium } from '../../lib/haptics';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface Category {
  id: string;
  name: string;
  description: string | null;
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
  questionCount: number;
}

export default function CategorySelectScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchCategories();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchCategories = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      // ユーザーの選択した試験を取得
      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_exam_id')
        .eq('id', user.id)
        .single();

      const examId = profile?.selected_exam_id;
      if (!examId) {
        setError('試験が選択されていません。設定画面で試験を選択してください。');
        setLoading(false);
        return;
      }

      // 選択された試験のカテゴリのみを取得
      const { data: allCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('exam_id', examId)
        .order('name');

      if (categoriesError) throw categoriesError;

      if (!allCategories || allCategories.length === 0) {
        setError('選択された試験にカテゴリがありません');
        setLoading(false);
        return;
      }

      // 各カテゴリの統計情報を取得
      const { data: answersWithQuestions, error: statsError } = await supabase
        .from('user_answers')
        .select(`
          is_correct,
          question_id,
          questions!inner(
            category_id,
            categories(name)
          )
        `)
        .eq('user_id', user.id);

      if (statsError) throw statsError;

      // 選択された試験のカテゴリIDリスト
      const categoryIds = allCategories.map(c => c.id);

      // 各カテゴリの問題数を取得（選択された試験のカテゴリのみ）
      const { data: questionCounts, error: questionCountsError } = await supabase
        .from('questions')
        .select('category_id')
        .in('category_id', categoryIds);

      if (questionCountsError) throw questionCountsError;

      // カテゴリごとに集計
      const categoryMap = new Map<string, { total: number; correct: number; questionCount: number }>();
      
      // 問題数を集計
      questionCounts?.forEach((q: any) => {
        if (q.category_id) {
          const current = categoryMap.get(q.category_id) || { total: 0, correct: 0, questionCount: 0 };
          current.questionCount++;
          categoryMap.set(q.category_id, current);
        }
      });

      // 回答統計を集計
      answersWithQuestions?.forEach((answer: any) => {
        const question = answer.questions;
        const categoryId = question?.category_id;
        
        if (categoryId) {
          const current = categoryMap.get(categoryId) || { total: 0, correct: 0, questionCount: 0 };
          current.total++;
          if (answer.is_correct) current.correct++;
          categoryMap.set(categoryId, current);
        }
      });

      // カテゴリ情報と統計を結合
      const categoriesWithStats: Category[] = allCategories.map((cat) => {
        const stats = categoryMap.get(cat.id) || { total: 0, correct: 0, questionCount: 0 };
        const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

        return {
          id: cat.id,
          name: cat.name,
          description: cat.description,
          totalAnswers: stats.total,
          correctAnswers: stats.correct,
          accuracy,
          questionCount: stats.questionCount,
        };
      });

      setCategories(categoriesWithStats);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'カテゴリの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category && category.questionCount === 0) {
      // 問題がないカテゴリは選択できない
      return;
    }

    router.push({
      pathname: '/quiz',
      params: { categoryId, categoryName }
    });
  };

  const handleGoBack = () => {
    impactMedium();
    router.back();
  };

  if (loading || authLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text variant="h2" style={styles.headerTitle}>分野を選択</Text>
          <View style={styles.backButton} />
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text variant="h2" style={styles.headerTitle}>分野を選択</Text>
          <View style={styles.backButton} />
        </View>
        <ErrorView
          message={error}
          onRetry={fetchCategories}
          retryLabel="再試行"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="h2" style={styles.headerTitle}>分野を選択</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {categories.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text variant="body" color={colors.textLight} style={styles.emptyText}>
              カテゴリが見つかりませんでした
            </Text>
          </Card>
        ) : (
          categories.map((category) => {
            const isDisabled = category.questionCount === 0;
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => {
                  if (!isDisabled) {
                    impactMedium();
                    handleCategorySelect(category.id, category.name);
                  }
                }}
                activeOpacity={isDisabled ? 1 : 0.7}
                disabled={isDisabled}
                style={styles.categoryItem}
              >
                <Card style={[
                  styles.categoryCard,
                  isDisabled && styles.categoryCardDisabled
                ]}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryInfo}>
                      <View style={styles.categoryNameRow}>
                        <Text variant="h3" style={[
                          styles.categoryName,
                          isDisabled && styles.categoryNameDisabled
                        ]}>
                          {category.name}
                        </Text>
                        {isDisabled && (
                          <View style={styles.preparingBadge}>
                            <Text variant="caption" style={styles.preparingText}>
                              準備中
                            </Text>
                          </View>
                        )}
                      </View>
                      {category.description && (
                        <Text variant="caption" color={colors.textLight} style={[
                          styles.categoryDescription,
                          isDisabled && styles.categoryDescriptionDisabled
                        ]}>
                          {category.description}
                        </Text>
                      )}
                    </View>
                    {!isDisabled && (
                      <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                    )}
                  </View>

                  {!isDisabled && (
                    <>
                      <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                          <Text variant="caption" color={colors.textLight}>問題数</Text>
                          <Text variant="body" style={styles.statValue}>
                            {category.questionCount}問
                          </Text>
                        </View>
                        {category.totalAnswers > 0 && (
                          <>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                              <Text variant="caption" color={colors.textLight}>回答数</Text>
                              <Text variant="body" style={styles.statValue}>
                                {category.totalAnswers}問
                              </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                              <Text variant="caption" color={colors.textLight}>正答率</Text>
                              <Text 
                                variant="body" 
                                style={[
                                  styles.statValue,
                                  { 
                                    color: category.accuracy >= 80 
                                      ? colors.correct 
                                      : category.accuracy >= 60 
                                      ? colors.secondary 
                                      : colors.incorrect 
                                  }
                                ]}
                              >
                                {category.accuracy}%
                              </Text>
                            </View>
                          </>
                        )}
                      </View>

                      {category.totalAnswers > 0 && (
                        <View style={styles.progressBarContainer}>
                          <View style={[
                            styles.progressBarFill,
                            {
                              width: `${category.accuracy}%`,
                              backgroundColor: category.accuracy >= 80 
                                ? colors.correct 
                                : category.accuracy >= 60 
                                ? colors.secondary 
                                : colors.incorrect,
                            }
                          ]} />
                        </View>
                      )}
                    </>
                  )}
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  categoryItem: {
    marginBottom: spacing.md,
  },
  categoryCard: {
    padding: spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  categoryInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  categoryName: {
    fontWeight: '600',
  },
  categoryDescription: {
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  categoryCardDisabled: {
    opacity: 0.5,
    backgroundColor: colors.surface,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  categoryNameDisabled: {
    color: colors.textLight,
  },
  categoryDescriptionDisabled: {
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

import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Text, ErrorView, SkeletonCard } from '../../components/ui';
import { colors, spacing, borderRadius } from '../../constants/theme';
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
      // 全カテゴリを取得
      const { data: allCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      if (!allCategories || allCategories.length === 0) {
        setError('カテゴリが見つかりませんでした');
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

      // 各カテゴリの問題数を取得
      const { data: questionCounts, error: questionCountsError } = await supabase
        .from('questions')
        .select('category_id')
        .not('category_id', 'is', null);

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

  const handleCategorySelect = async (categoryId: string, categoryName: string) => {
    // 問題が存在するか確認
    const category = categories.find(c => c.id === categoryId);
    if (category && category.questionCount === 0) {
      // アラート表示はクイズ画面で行うため、ここでは遷移のみ
    }

    router.push({
      pathname: '/quiz',
      params: { categoryId, categoryName }
    });
  };

  const handleGoBack = () => {
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
          categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleCategorySelect(category.id, category.name)}
              activeOpacity={0.7}
              style={styles.categoryItem}
            >
              <Card style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <Text variant="h3" style={styles.categoryName}>
                      {category.name}
                    </Text>
                    {category.description && (
                      <Text variant="caption" color={colors.textLight} style={styles.categoryDescription}>
                        {category.description}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                </View>

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
              </Card>
            </TouchableOpacity>
          ))
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
});

import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Text } from '../../components/ui';
import { colors, spacing, borderRadius, fontSizes } from '../../constants/theme';
import { impactMedium } from '../../lib/haptics';
import { useAuth } from '../../hooks/useAuth';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { supabase } from '../../lib/supabase';

const isExpoGo = Constants.appOwnership === 'expo';

const BannerAdFixed = isExpoGo
  ? null
  : require('../../components/ads/BannerAdFixed').BannerAdFixed;

interface Exam {
  id: string;
  name: string;
  description: string | null;
  questionCount: number;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { registerForPushNotifications } = usePushNotifications();
  const [dailyGoal, setDailyGoal] = useState('5');
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedExamName, setSelectedExamName] = useState<string>('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [showExamModal, setShowExamModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchExams();
    }
  }, [user]);

  const fetchExams = async () => {
    try {
      const { data: examsData, error } = await supabase
        .from('exams')
        .select('*')
        .order('name');

      if (error) throw error;

      if (examsData) {
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
      }
    } catch (err: any) {
      console.error('Error fetching exams:', err);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('daily_goal, notification_enabled, selected_exam_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      if (data) {
        // daily_goalがnullの場合はデフォルト値を使用
        if (data.daily_goal !== null && data.daily_goal !== undefined) {
          setDailyGoal(data.daily_goal.toString());
        }
        setNotificationEnabled(data.notification_enabled ?? true);
        if (data.selected_exam_id) {
          setSelectedExamId(data.selected_exam_id);
          // 試験名を取得
          const { data: examData } = await supabase
            .from('exams')
            .select('name')
            .eq('id', data.selected_exam_id)
            .single();
          if (examData) {
            setSelectedExamName(examData.name);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExamChange = async (examId: string) => {
    if (!user) return;

    const selectedExam = exams.find(e => e.id === examId);
    if (!selectedExam) return;

    // 問題数が0の試験は選択できない
    if (selectedExam.questionCount === 0) {
      return;
    }

    Alert.alert(
      '試験を切り替えますか？',
      `${selectedExam.name}に切り替えます。統計データは試験別に管理されます。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '切り替える',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ selected_exam_id: examId })
                .eq('id', user.id);

              if (error) throw error;

              setSelectedExamId(examId);
              setSelectedExamName(selectedExam.name);
              setShowExamModal(false);
              Alert.alert('成功', '試験を切り替えました');
            } catch (error: any) {
              Alert.alert('エラー', error.message);
            }
          },
        },
      ]
    );
  };

  const handleSaveDailyGoal = async () => {
    if (!user) return;

    const goal = parseInt(dailyGoal, 10);
    if (isNaN(goal) || goal < 1 || goal > 100) {
      Alert.alert('エラー', '1〜100の数値を入力してください');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ daily_goal: goal })
        .eq('id', user.id);

      if (error) throw error;
      
      Alert.alert('成功', '目標問題数を更新しました');
    } catch (error: any) {
      Alert.alert('エラー', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotification = async (value: boolean) => {
    if (!user) return;

    setNotificationEnabled(value);

    // 通知を有効にする場合は、Push通知の登録も行う
    if (value) {
      await registerForPushNotifications();
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_enabled: value })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating notification setting:', error);
      Alert.alert('エラー', '通知設定の更新に失敗しました');
      setNotificationEnabled(!value); // ロールバック
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'ログアウト',
      '本当にログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('エラー', error);
            } else {
              router.replace('/(auth)/login');
            }
          },
        },
      ]
    );
  };

  const performDeleteAccount = async () => {
    if (!user) return;

    try {
      setDeleting(true);

      const { error } = await supabase.functions.invoke('delete-account', {
        body: {},
      });

      if (error) {
        throw error;
      }

      // ローカルのセッションも破棄してログイン画面へ
      const { error: signOutError } = await signOut();
      if (signOutError) {
        console.error('Error signing out after account deletion:', signOutError);
      }

      Alert.alert('アカウントを削除しました', 'ご利用ありがとうございました。');
      router.replace('/(auth)/login');
    } catch (err: any) {
      console.error('Error deleting account:', err);

      // Edge Function 側から返ってきた詳細メッセージがあれば優先して表示
      const contextError =
        err?.context?.error ??
        err?.context?.message ??
        (typeof err?.context === 'string' ? err.context : null);

      const message =
        contextError ??
        err?.message ??
        'アカウントの削除に失敗しました。時間をおいて再度お試しください。';

      Alert.alert('エラー', message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!user) return;

    Alert.alert(
      'アカウントを削除しますか？',
      'アカウントを削除すると、すべての学習データ・ストリーク記録が完全に削除され、復元できません。本当に削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '最終確認',
              'この操作は取り消せません。本当にアカウントを削除しますか？',
              [
                { text: 'キャンセル', style: 'cancel' },
                {
                  text: '削除する',
                  style: 'destructive',
                  onPress: () => {
                    performDeleteAccount();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ヘッダー */}
        <Text variant="h2" style={styles.header}>設定</Text>

        {/* アカウント情報 */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>アカウント</Text>
          <Card style={styles.card}>
            <View style={styles.infoRow}>
              <Text variant="body" color={colors.textLight}>メールアドレス</Text>
              <Text variant="body" style={styles.infoValue}>{user?.email}</Text>
            </View>
          </Card>
        </View>

        {/* デイリーゴール設定 */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>学習目標</Text>
          <Card style={styles.card}>
            <View style={styles.goalContainer}>
              <View style={styles.goalInfo}>
                <Text variant="body" style={styles.goalLabel}>1日の目標問題数</Text>
                <Text variant="caption" color={colors.textLight}>
                  毎日解く問題数を設定できます
                </Text>
              </View>
              <View style={styles.goalInputContainer}>
                <TextInput
                  style={styles.goalInput}
                  value={dailyGoal}
                  onChangeText={setDailyGoal}
                  keyboardType="number-pad"
                  maxLength={3}
                />
                <Text variant="body" style={styles.goalUnit}>問</Text>
              </View>
            </View>
            <Button
              title="保存"
              onPress={handleSaveDailyGoal}
              loading={saving}
              disabled={loading || saving}
              style={styles.saveButton}
            />
          </Card>
        </View>

        {/* バナー広告 */}
        {!isExpoGo && BannerAdFixed && (
          <View style={styles.adContainer}>
            <BannerAdFixed />
          </View>
        )}

        {/* 試験選択 */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>学習する試験</Text>
          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { impactMedium(); setShowExamModal(true); }}
              activeOpacity={0.7}
            >
              <View style={styles.menuContent}>
                <View style={styles.menuTitleRow}>
                  <Ionicons name="school-outline" size={20} color={colors.primary} style={styles.menuIcon} />
                  <View style={styles.menuTextContainer}>
                    <Text variant="h3">現在の試験</Text>
                    <Text variant="body" color={colors.textLight} style={styles.menuDescription}>
                      {selectedExamName || '未選択'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* 通知設定 */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>通知設定</Text>
          <Card style={styles.card}>
            <View style={styles.notificationRow}>
              <View style={styles.notificationInfo}>
                <Text variant="body" style={styles.notificationLabel}>学習リマインダー</Text>
                <Text variant="caption" color={colors.textLight}>
                  毎日の学習をリマインドします
                </Text>
              </View>
              <Switch
                value={notificationEnabled}
                onValueChange={handleToggleNotification}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            </View>
          </Card>
        </View>

        {/* 統計 */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>その他</Text>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => { impactMedium(); router.push('/(tabs)/stats'); }}
          >
            <View style={styles.menuTitleRow}>
              <Ionicons name="stats-chart-outline" size={20} color={colors.primary} style={styles.menuIcon} />
              <Text variant="body">学習統計</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* ログアウト */}
        <View style={styles.accountActions}>
          <Button
            title="ログアウト"
            onPress={handleSignOut}
            variant="ghost"
            style={styles.logoutButton}
          />
          <Button
            title="アカウントを削除する"
            onPress={handleDeleteAccount}
            variant="ghost"
            loading={deleting}
            disabled={deleting}
            style={[styles.deleteAccountButton]}
            textStyle={styles.deleteAccountText}
          />
        </View>

        {/* バージョン情報 */}
        <Text variant="caption" color={colors.textLight} style={styles.version}>
          Version 1.1.2
        </Text>
      </ScrollView>

      {/* 試験選択モーダル */}
      <Modal
        visible={showExamModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExamModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h2" style={styles.modalTitle}>試験を選択</Text>
              <TouchableOpacity
                onPress={() => { impactMedium(); setShowExamModal(false); }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {exams.map((exam) => {
                const isDisabled = exam.questionCount === 0;
                return (
                  <TouchableOpacity
                    key={exam.id}
                    onPress={() => {
                      if (!isDisabled) {
                        impactMedium();
                        handleExamChange(exam.id);
                      }
                    }}
                    activeOpacity={isDisabled ? 1 : 0.7}
                    disabled={isDisabled}
                    style={styles.examOption}
                  >
                    <Card style={[
                      styles.examOptionCard,
                      selectedExamId === exam.id && styles.examOptionCardSelected,
                      isDisabled && styles.examOptionCardDisabled
                    ]}>
                      <View style={styles.examOptionContent}>
                        <Ionicons
                          name={selectedExamId === exam.id ? "radio-button-on" : "radio-button-off"}
                          size={24}
                          color={
                            isDisabled 
                              ? colors.textLight 
                              : selectedExamId === exam.id 
                                ? colors.primary 
                                : colors.textLight
                          }
                        />
                        <View style={styles.examOptionText}>
                          <View style={styles.examOptionTitleRow}>
                            <Text variant="body" style={[
                              styles.examOptionTitle,
                              selectedExamId === exam.id && styles.examOptionTitleSelected,
                              isDisabled && styles.examOptionTitleDisabled
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
                              styles.examOptionDescription,
                              isDisabled && styles.examOptionDescriptionDisabled
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 20, // タブバーの高さ分の余白を追加
  },
  header: {
    marginBottom: spacing.xxl,
    color: colors.text,
    fontWeight: 'bold',
  },
  adContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    marginBottom: spacing.lg,
    color: colors.text,
    fontWeight: '600',
    fontSize: fontSizes.lg,
  },
  card: {
    padding: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoValue: {
    fontWeight: '600',
    fontSize: fontSizes.md,
    color: colors.text,
  },
  goalContainer: {
    marginBottom: spacing.lg,
  },
  goalInfo: {
    marginBottom: spacing.md,
  },
  goalLabel: {
    fontWeight: '600',
    marginBottom: spacing.sm,
    fontSize: fontSizes.md,
  },
  goalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  goalInput: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 80,
    minHeight: 48,
    color: colors.text,
  },
  goalUnit: {
    fontWeight: '600',
  },
  saveButton: {
    width: '100%',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    minHeight: 64, // タップ領域を確保
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuIcon: {
    marginRight: spacing.xs,
  },
  logoutButton: {
    marginTop: spacing.lg,
  },
  version: {
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  accountActions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  deleteAccountButton: {
    borderColor: colors.incorrect,
  },
  deleteAccountText: {
    color: colors.incorrect,
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  notificationLabel: {
    fontWeight: '600',
    marginBottom: spacing.sm,
    fontSize: fontSizes.md,
  },
  menuContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  menuDescription: {
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '80%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalScrollView: {
    padding: spacing.lg,
  },
  examOption: {
    marginBottom: spacing.md,
  },
  examOptionCard: {
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  examOptionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  examOptionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  examOptionText: {
    flex: 1,
    gap: spacing.xs,
  },
  examOptionTitle: {
    fontWeight: '600',
  },
  examOptionTitleSelected: {
    color: colors.primary,
  },
  examOptionDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  examOptionCardDisabled: {
    opacity: 0.5,
    backgroundColor: colors.surface,
  },
  examOptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  examOptionTitleDisabled: {
    color: colors.textLight,
  },
  examOptionDescriptionDisabled: {
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

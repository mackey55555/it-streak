import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Text } from '../../components/ui';
import { colors, spacing, borderRadius, fontSizes } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { registerForPushNotifications } = usePushNotifications();
  const [dailyGoal, setDailyGoal] = useState('5');
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [notificationTime, setNotificationTime] = useState('19:00');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('daily_goal, notification_enabled, notification_time')
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
        if (data.notification_time) {
          // TIME型は "HH:MM:SS" 形式なので "HH:MM" に変換
          setNotificationTime(data.notification_time.substring(0, 5));
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
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

  const handleSaveNotificationTime = async () => {
    if (!user) return;

    // 時刻形式の検証（HH:MM）
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(notificationTime)) {
      Alert.alert('エラー', '正しい時刻形式（HH:MM）で入力してください');
      return;
    }

    setSaving(true);
    try {
      // TIME型は "HH:MM:SS" 形式が必要
      const timeWithSeconds = `${notificationTime}:00`;

      const { error } = await supabase
        .from('profiles')
        .update({ notification_time: timeWithSeconds })
        .eq('id', user.id);

      if (error) throw error;
      
      Alert.alert('成功', '通知時刻を更新しました');
    } catch (error: any) {
      Alert.alert('エラー', error.message);
    } finally {
      setSaving(false);
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

            {notificationEnabled && (
              <>
                <View style={styles.divider} />
                <View style={styles.timeContainer}>
                  <View style={styles.timeInfo}>
                    <Text variant="body" style={styles.timeLabel}>通知時刻</Text>
                    <Text variant="caption" color={colors.textLight}>
                      毎日この時刻に通知を送信します
                    </Text>
                  </View>
                  <View style={styles.timeInputContainer}>
                    <TextInput
                      style={styles.timeInput}
                      value={notificationTime}
                      onChangeText={setNotificationTime}
                      placeholder="19:00"
                      placeholderTextColor={colors.textLight}
                      maxLength={5}
                    />
                    <Button
                      title="保存"
                      onPress={handleSaveNotificationTime}
                      loading={saving}
                      disabled={loading || saving}
                      style={styles.timeSaveButton}
                      variant="ghost"
                    />
                  </View>
                </View>
              </>
            )}
          </Card>
        </View>

        {/* 統計 */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>その他</Text>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/stats')}
          >
            <View style={styles.menuTitleRow}>
              <Ionicons name="stats-chart-outline" size={20} color={colors.primary} style={styles.menuIcon} />
              <Text variant="body">学習統計</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* ログアウト */}
        <Button
          title="ログアウト"
          onPress={handleSignOut}
          variant="ghost"
          style={styles.logoutButton}
        />

        {/* バージョン情報 */}
        <Text variant="caption" color={colors.textLight} style={styles.version}>
          Version 1.0.0
        </Text>
      </ScrollView>
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  timeContainer: {
    gap: spacing.md,
  },
  timeInfo: {
    marginBottom: spacing.xs,
  },
  timeLabel: {
    fontWeight: '600',
    marginBottom: spacing.sm,
    fontSize: fontSizes.md,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  timeInput: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    textAlign: 'center',
    width: 100,
    minHeight: 48,
    color: colors.text,
  },
  timeSaveButton: {
    flex: 1,
  },
});

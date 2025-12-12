import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Card, Text } from '../../components/ui';
import { colors, spacing, borderRadius, fontSizes } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [dailyGoal, setDailyGoal] = useState('5');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('daily_goal')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setDailyGoal(data.daily_goal.toString());
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

        {/* 統計 */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>その他</Text>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/stats')}
          >
            <Text variant="body">📊 学習統計</Text>
            <Text variant="h3" color={colors.textLight}>›</Text>
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
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
    color: colors.text,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    color: colors.textLight,
  },
  card: {
    padding: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoValue: {
    fontWeight: '600',
  },
  goalContainer: {
    marginBottom: spacing.lg,
  },
  goalInfo: {
    marginBottom: spacing.md,
  },
  goalLabel: {
    fontWeight: '600',
    marginBottom: spacing.xs,
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
  },
  logoutButton: {
    marginTop: spacing.lg,
  },
  version: {
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

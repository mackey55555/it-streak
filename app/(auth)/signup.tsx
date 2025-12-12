import { useState } from 'react';
import { View, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Text } from '../../components/ui';
import { colors, spacing, borderRadius, fontSizes } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError('すべての項目を入力してください');
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
    const { error: signUpError } = await signUp(email, password);

    if (signUpError) {
      setError(signUpError);
    } else {
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
              <TouchableOpacity onPress={handleLoginNavigation}>
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
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: fontSizes.md,
    color: colors.text,
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
});


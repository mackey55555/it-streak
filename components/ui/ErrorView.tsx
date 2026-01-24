import { View, StyleSheet } from 'react-native';
import { Button, Text } from './';
import { colors, spacing } from '../../constants/theme';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorView = ({ message, onRetry, retryLabel = '再試行' }: ErrorViewProps) => {
  return (
    <View style={styles.container}>
      <Text variant="h3" color={colors.incorrect} style={styles.title}>
        エラーが発生しました
      </Text>
      <Text variant="body" style={styles.message}>
        {message}
      </Text>
      {onRetry && (
        <Button
          title={retryLabel}
          onPress={onRetry}
          style={styles.retryButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    marginBottom: spacing.sm,
  },
  message: {
    textAlign: 'center',
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  retryButton: {
    minWidth: 120,
    marginTop: spacing.md,
  },
});

import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { Card } from './Card';
import { spacing } from '../../constants/theme';

export const SkeletonCard = () => {
  return (
    <Card style={styles.card}>
      <Skeleton width="60%" height={24} style={styles.title} />
      <Skeleton width="40%" height={20} style={styles.subtitle} />
      <Skeleton width="100%" height={12} style={styles.line} />
      <Skeleton width="80%" height={12} style={styles.line} />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing.md,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
  line: {
    marginBottom: spacing.sm,
  },
});

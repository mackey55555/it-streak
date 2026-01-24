import { seedBasicInfoQuestions } from './seed-basic-info';
import { seedAppliedInfoQuestions } from './seed-applied-info';

async function seedAllQuestions() {
  try {
    console.log('🚀 全試験の問題データを投入開始...\n');
    console.log('='.repeat(50) + '\n');

    // 基本情報技術者試験
    await seedBasicInfoQuestions();
    console.log('='.repeat(50) + '\n');

    // 応用情報技術者試験
    await seedAppliedInfoQuestions();
    console.log('='.repeat(50) + '\n');

    console.log('🎉 すべての問題データの投入が完了しました！\n');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
seedAllQuestions()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

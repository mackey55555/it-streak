// 生成された問題JSONファイルをseed-questions.tsに統合するスクリプト
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// カテゴリIDのマッピング
const CATEGORY_ID_MAP: Record<string, string> = {
  technology: '00000000-0000-0000-0000-000000000011',
  management: '00000000-0000-0000-0000-000000000012',
  strategy: '00000000-0000-0000-0000-000000000013',
};

// JSONファイルを読み込んで、TypeScript形式に変換
function convertQuestions(jsonPath: string): string {
  const jsonContent = readFileSync(jsonPath, 'utf-8');
  const questions = JSON.parse(jsonContent);

  const converted = questions.map((q: any) => {
    const categoryId = CATEGORY_ID_MAP[q.category];
    if (!categoryId) {
      throw new Error(`Unknown category: ${q.category}`);
    }

    return `  {
    category_id: CATEGORY_IDS.${q.category === 'technology' ? 'technology' : q.category === 'management' ? 'management' : 'strategy'},
    question_text: ${JSON.stringify(q.question_text)},
    choice_a: ${JSON.stringify(q.choice_a)},
    choice_b: ${JSON.stringify(q.choice_b)},
    choice_c: ${JSON.stringify(q.choice_c)},
    choice_d: ${JSON.stringify(q.choice_d)},
    correct_answer: '${q.correct_answer}' as const,
    explanation: ${JSON.stringify(q.explanation)},
    difficulty: ${q.difficulty},
  },`;
  }).join('\n');

  return converted;
}

// 使用方法
const jsonFilePath = process.argv[2];
if (!jsonFilePath) {
  console.error('使用方法: tsx merge-questions.ts <questions.json>');
  console.error('例: tsx merge-questions.ts questions.json');
  process.exit(1);
}

try {
  const converted = convertQuestions(jsonFilePath);
  console.log('変換された問題データ:');
  console.log(converted);
  console.log('\nこの内容をseed-questions.tsのquestions配列に追加してください。');
} catch (error) {
  console.error('エラー:', error);
  process.exit(1);
}

/**
 * JSON問題ファイルをSupabaseにインポートするスクリプト
 *
 * 使い方:
 *   npx tsx import-questions.ts <JSONファイル>              # 本番投入
 *   npx tsx import-questions.ts <JSONファイル> --dry-run    # ドライラン（DBに書き込まない）
 *   npx tsx import-questions.ts incoming/*.json             # 複数ファイル一括
 *   npx tsx import-questions.ts incoming/*.json --dry-run   # 複数ファイル一括ドライラン
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { config } from 'dotenv';
import { readFileSync, renameSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, basename } from 'path';

// ---------- 設定 ----------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../.env.local') });

// 試験 × カテゴリ → category_id のマッピング
const CATEGORY_MAP: Record<string, Record<string, string>> = {
  basic: {
    technology: '00000000-0000-0000-0000-000000000011',
    management: '00000000-0000-0000-0000-000000000012',
    strategy: '00000000-0000-0000-0000-000000000013',
  },
  applied: {
    technology: '00000000-0000-0000-0000-000000000021',
    management: '00000000-0000-0000-0000-000000000022',
    strategy: '00000000-0000-0000-0000-000000000023',
  },
};

// ---------- 型定義 ----------

interface RawQuestion {
  exam: string;
  category: string;
  question_text: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct_answer: string;
  explanation: string;
  difficulty: number;
}

interface DbQuestion {
  category_id: string;
  question_text: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct_answer: string;
  explanation: string;
  difficulty: number;
}

// ---------- バリデーション ----------

function validate(questions: unknown, filePath: string): RawQuestion[] {
  if (!Array.isArray(questions)) {
    throw new Error(`${filePath}: JSONのルートが配列ではありません`);
  }

  const errors: string[] = [];

  questions.forEach((q: any, i: number) => {
    const prefix = `${filePath} [${i + 1}問目]`;

    // 必須フィールド
    const required = [
      'exam', 'category', 'question_text',
      'choice_a', 'choice_b', 'choice_c', 'choice_d',
      'correct_answer', 'explanation', 'difficulty',
    ] as const;
    for (const field of required) {
      if (q[field] === undefined || q[field] === null || q[field] === '') {
        errors.push(`${prefix}: "${field}" が未設定です`);
      }
    }

    // exam
    if (q.exam && !CATEGORY_MAP[q.exam]) {
      errors.push(`${prefix}: exam "${q.exam}" は不正です（basic / applied）`);
    }

    // category
    if (q.exam && q.category && CATEGORY_MAP[q.exam] && !CATEGORY_MAP[q.exam][q.category]) {
      errors.push(`${prefix}: category "${q.category}" は不正です（technology / management / strategy）`);
    }

    // correct_answer
    if (q.correct_answer && !['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
      errors.push(`${prefix}: correct_answer "${q.correct_answer}" は不正です（A / B / C / D）`);
    }

    // difficulty
    if (q.difficulty !== undefined && (typeof q.difficulty !== 'number' || q.difficulty < 1 || q.difficulty > 5)) {
      errors.push(`${prefix}: difficulty は 1〜5 の数値にしてください（現在: ${q.difficulty}）`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`バリデーションエラー:\n  ${errors.join('\n  ')}`);
  }

  return questions as RawQuestion[];
}

// ---------- メイン ----------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const filePaths = args.filter(a => !a.startsWith('--'));

  if (filePaths.length === 0) {
    console.error('使い方: npx tsx import-questions.ts <JSONファイル...> [--dry-run]');
    console.error('例:');
    console.error('  npx tsx import-questions.ts questions/incoming/2026-03-15_tech.json');
    console.error('  npx tsx import-questions.ts questions/incoming/*.json --dry-run');
    process.exit(1);
  }

  // Supabase 接続
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('環境変数 EXPO_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY が未設定です');
    process.exit(1);
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

  if (dryRun) {
    console.log('🔍 ドライランモード（DBには書き込みません）\n');
  }

  let totalNew = 0;
  let totalSkipped = 0;
  let totalError = 0;

  for (const filePath of filePaths) {
    console.log(`📄 ${basename(filePath)}`);
    console.log('-'.repeat(40));

    try {
      // 1. JSONを読み込み & パース
      const raw = readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);

      // 2. バリデーション
      const questions = validate(parsed, basename(filePath));
      console.log(`  読み込み: ${questions.length}問`);

      // 3. category_id に変換
      const dbQuestions: DbQuestion[] = questions.map(q => ({
        category_id: CATEGORY_MAP[q.exam][q.category],
        question_text: q.question_text,
        choice_a: q.choice_a,
        choice_b: q.choice_b,
        choice_c: q.choice_c,
        choice_d: q.choice_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
      }));

      // 4. 既存問題との重複チェック
      const categoryIds = [...new Set(dbQuestions.map(q => q.category_id))];
      const { data: existing, error: fetchError } = await supabase
        .from('questions')
        .select('question_text, category_id')
        .in('category_id', categoryIds);

      if (fetchError) throw fetchError;

      const existingSet = new Set(
        (existing || []).map(q => `${q.category_id}:${q.question_text}`)
      );

      const newQuestions = dbQuestions.filter(
        q => !existingSet.has(`${q.category_id}:${q.question_text}`)
      );
      const skipped = dbQuestions.length - newQuestions.length;

      console.log(`  新規: ${newQuestions.length}問 / 重複スキップ: ${skipped}問`);

      // 5. INSERT（ドライランでなければ）
      if (newQuestions.length > 0 && !dryRun) {
        const { data, error } = await supabase
          .from('questions')
          .insert(newQuestions as any)
          .select('id');

        if (error) throw error;
        console.log(`  ✅ ${data.length}問をDBに投入しました`);

        // 6. 処理済みファイルを done/ に移動
        const doneDir = resolve(dirname(filePath), 'done');
        if (!existsSync(doneDir)) {
          mkdirSync(doneDir, { recursive: true });
        }
        renameSync(filePath, resolve(doneDir, basename(filePath)));
        console.log(`  📁 → done/${basename(filePath)} に移動`);
      } else if (newQuestions.length === 0) {
        console.log('  ℹ️  新規問題なし（すべて重複）');
      } else {
        console.log('  ✅ ドライラン完了（投入はスキップ）');
      }

      totalNew += newQuestions.length;
      totalSkipped += skipped;
    } catch (err: any) {
      console.error(`  ❌ エラー: ${err.message}`);
      totalError++;
    }

    console.log('');
  }

  // サマリ
  console.log('='.repeat(40));
  console.log('📊 サマリ');
  console.log(`  新規投入: ${totalNew}問`);
  console.log(`  重複スキップ: ${totalSkipped}問`);
  if (totalError > 0) {
    console.log(`  エラー: ${totalError}ファイル`);
  }
  if (dryRun) {
    console.log('\n  ※ ドライランのため実際の投入は行っていません');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

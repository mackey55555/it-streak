/**
 * 重複問題の確認と削除スクリプト
 *
 * 使い方:
 *   npx tsx dedup-questions.ts              # 確認のみ（ドライラン）
 *   npx tsx dedup-questions.ts --execute    # 実行（載せ替え＋削除）
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が未設定です');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

const execute = process.argv.includes('--execute');

async function main() {
  if (!execute) {
    console.log('🔍 ドライランモード（確認のみ）\n');
  } else {
    console.log('⚡ 実行モード（DB変更あり）\n');
  }

  // 1. 全問題を取得
  const { data: allQuestions, error: qError } = await supabase
    .from('questions')
    .select('id, category_id, question_text')
    .order('created_at', { ascending: true });

  if (qError) throw qError;

  // 2. 重複グループを特定（category_id + question_text が同じ）
  const groups = new Map<string, string[]>();
  for (const q of allQuestions!) {
    const key = `${q.category_id}:${q.question_text}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(q.id);
  }

  const dupGroups = [...groups.entries()].filter(([, ids]) => ids.length > 1);

  if (dupGroups.length === 0) {
    console.log('✅ 重複問題はありません');
    return;
  }

  // 3. サマリ表示
  const keepIds: string[] = [];
  const deleteIds: string[] = [];

  for (const [, ids] of dupGroups) {
    keepIds.push(ids[0]);       // 最も古いものを残す
    deleteIds.push(...ids.slice(1));
  }

  console.log(`📊 重複状況:`);
  console.log(`  総問題数: ${allQuestions!.length}問`);
  console.log(`  重複グループ: ${dupGroups.length}グループ`);
  console.log(`  削除対象: ${deleteIds.length}問`);
  console.log(`  削除後の総問題数: ${allQuestions!.length - deleteIds.length}問\n`);

  // 載せ替え先のマッピングを作成
  const redirectMap = new Map<string, string>();
  for (const [, ids] of dupGroups) {
    const keepId = ids[0];
    for (const dupId of ids.slice(1)) {
      redirectMap.set(dupId, keepId);
    }
  }

  // 4. 影響を受ける回答履歴を確認（全件取得してコード側でフィルタ）
  const deleteIdSet = new Set(deleteIds);
  const { data: allAnswers, error: aError } = await supabase
    .from('user_answers')
    .select('id, question_id');

  if (aError) throw aError;

  const affectedAnswers = (allAnswers || []).filter(a => deleteIdSet.has(a.question_id));
  const affectedCount = affectedAnswers.length;
  console.log(`📝 影響を受ける回答履歴: ${affectedCount}件`);

  if (affectedCount > 0) {
    console.log(`  → ${affectedCount}件を残す問題IDに載せ替えます\n`);

    if (execute) {
      // 5. 回答履歴を載せ替え（バッチ処理）
      console.log('📝 回答履歴を載せ替え中...');
      let updatedCount = 0;

      // 同じ keepId に向かうものをまとめる
      const byKeepId = new Map<string, string[]>();
      for (const [dupId, keepId] of redirectMap) {
        if (!byKeepId.has(keepId)) {
          byKeepId.set(keepId, []);
        }
        byKeepId.get(keepId)!.push(dupId);
      }

      const batchSize = 30;
      for (const [keepId, dupIds] of byKeepId) {
        for (let i = 0; i < dupIds.length; i += batchSize) {
          const batch = dupIds.slice(i, i + batchSize);
          const { data, error } = await supabase
            .from('user_answers')
            .update({ question_id: keepId } as any)
            .in('question_id', batch)
            .select('id');

          if (error) throw error;
          updatedCount += data?.length || 0;
        }
      }

      console.log(`  ✅ ${updatedCount}件の回答履歴を載せ替えました\n`);
    }
  } else {
    console.log('  → 載せ替え不要\n');
  }

  if (execute) {
    // 6. 重複問題を削除（バッチ処理）
    console.log(`🗑️  重複問題を削除中（${deleteIds.length}問）...`);

    const batchSize = 30;
    let deletedCount = 0;

    for (let i = 0; i < deleteIds.length; i += batchSize) {
      const batch = deleteIds.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('questions')
        .delete()
        .in('id', batch)
        .select('id');

      if (error) throw error;
      deletedCount += data?.length || 0;
    }

    console.log(`  ✅ ${deletedCount}問を削除しました\n`);

    // 7. 最終確認
    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 削除後の総問題数: ${count}問`);
  } else {
    console.log('--execute オプションを付けて再実行すると、載せ替え＋削除を実行します');
    console.log('  npx tsx dedup-questions.ts --execute');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ エラー:', err);
    process.exit(1);
  });

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { questions } from './questions/applied-info';

// ES modules用の__dirname取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.localファイルから環境変数を読み込む
config({ path: resolve(__dirname, '../.env.local') });

// 環境変数から取得
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が設定されていません');
  console.error('SUPABASE_SECRET_KEY または SUPABASE_SERVICE_ROLE_KEY を設定してください');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

async function seedAppliedInfoQuestions() {
  try {
    console.log('📚 応用情報技術者試験の問題を投入中...\n');

    // 応用情報のカテゴリID
    const categoryIds = [
      '00000000-0000-0000-0000-000000000021', // テクノロジ系
      '00000000-0000-0000-0000-000000000022', // マネジメント系
      '00000000-0000-0000-0000-000000000023', // ストラテジ系
    ];

    // カテゴリが存在するか確認
    const { data: existingCategories, error: categoryCheckError } = await supabase
      .from('categories')
      .select('id')
      .in('id', categoryIds);

    if (categoryCheckError) {
      throw categoryCheckError;
    }

    // 存在しないカテゴリを追加
    const existingCategoryIds = new Set((existingCategories || []).map(c => c.id));
    const categoriesToInsert = [
      { id: '00000000-0000-0000-0000-000000000021', exam_id: '00000000-0000-0000-0000-000000000002', name: 'テクノロジ系', description: 'コンピュータ科学基礎、ハードウェア、ソフトウェア、ネットワーク等' },
      { id: '00000000-0000-0000-0000-000000000022', exam_id: '00000000-0000-0000-0000-000000000002', name: 'マネジメント系', description: 'プロジェクトマネジメント、サービスマネジメント等' },
      { id: '00000000-0000-0000-0000-000000000023', exam_id: '00000000-0000-0000-0000-000000000002', name: 'ストラテジ系', description: '経営戦略、システム戦略、法務等' },
    ].filter(c => !existingCategoryIds.has(c.id));

    if (categoriesToInsert.length > 0) {
      console.log(`📝 カテゴリが存在しないため、${categoriesToInsert.length}件のカテゴリを追加します...\n`);
      const { error: categoryInsertError } = await supabase
        .from('categories')
        .insert(categoriesToInsert);

      if (categoryInsertError) {
        throw categoryInsertError;
      }
      console.log('✅ カテゴリの追加が完了しました。\n');
    }

    // 既存の問題を取得（重複チェック用）
    const { data: existingQuestions, error: fetchError } = await supabase
      .from('questions')
      .select('question_text, category_id')
      .in('category_id', categoryIds);

    if (fetchError) {
      throw fetchError;
    }

    // 既存の問題のquestion_textとcategory_idの組み合わせをSetで管理
    const existingSet = new Set(
      (existingQuestions || []).map(q => `${q.category_id}:${q.question_text}`)
    );

    // 重複していない問題のみをフィルタリング
    const newQuestions = questions.filter(
      q => !existingSet.has(`${q.category_id}:${q.question_text}`)
    );

    if (newQuestions.length === 0) {
      console.log('ℹ️  すべての問題が既に存在しています。新しい問題はありません。\n');
      
      // 既存の件数を表示
      const techCount = (existingQuestions || []).filter(q => q.category_id === '00000000-0000-0000-0000-000000000021').length;
      const mgmtCount = (existingQuestions || []).filter(q => q.category_id === '00000000-0000-0000-0000-000000000022').length;
      const stratCount = (existingQuestions || []).filter(q => q.category_id === '00000000-0000-0000-0000-000000000023').length;

      console.log('📊 既存の問題数:');
      console.log(`  - テクノロジ系: ${techCount}件`);
      console.log(`  - マネジメント系: ${mgmtCount}件`);
      console.log(`  - ストラテジ系: ${stratCount}件\n`);
      return;
    }

    console.log(`${newQuestions.length}件の新しい問題を投入中...（既存: ${questions.length - newQuestions.length}件）\n`);

    // 新しい問題のみを投入
    const { data, error } = await supabase
      .from('questions')
      .insert(newQuestions as any)
      .select();

    if (error) {
      throw error;
    }

    console.log('✅ 応用情報技術者試験の問題データの投入が完了しました！');
    console.log(`新規投入された問題数: ${data?.length || 0}件\n`);

    // カテゴリ別の件数を表示（既存 + 新規）
    const allQuestions = [...(existingQuestions || []), ...(data || [])];
    const techCount = allQuestions.filter(q => q.category_id === '00000000-0000-0000-0000-000000000021').length;
    const mgmtCount = allQuestions.filter(q => q.category_id === '00000000-0000-0000-0000-000000000022').length;
    const stratCount = allQuestions.filter(q => q.category_id === '00000000-0000-0000-0000-000000000023').length;

    console.log('📊 カテゴリ別の総問題数:');
    console.log(`  - テクノロジ系: ${techCount}件`);
    console.log(`  - マネジメント系: ${mgmtCount}件`);
    console.log(`  - ストラテジ系: ${stratCount}件\n`);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  }
}

export { seedAppliedInfoQuestions };

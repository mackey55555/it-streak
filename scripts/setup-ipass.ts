/**
 * ITパスポート試験のセットアップスクリプト
 * exams と categories にデータを追加する
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

const EXAM_ID = '00000000-0000-0000-0000-000000000003';
const CATEGORY_IDS = {
  technology: '00000000-0000-0000-0000-000000000031',
  management: '00000000-0000-0000-0000-000000000032',
  strategy: '00000000-0000-0000-0000-000000000033',
};

async function main() {
  console.log('📚 ITパスポート試験をセットアップ中...\n');

  // 1. 試験を追加
  const { error: examError } = await supabase
    .from('exams')
    .upsert({
      id: EXAM_ID,
      name: 'ITパスポート試験',
      description: '情報処理技術者試験のうち、ITを利活用するすべての社会人が備えておくべきIT知識を問う国家試験',
    } as any);

  if (examError) throw examError;
  console.log('✅ 試験「ITパスポート試験」を追加しました');

  // 2. カテゴリを追加
  const categories = [
    { id: CATEGORY_IDS.technology, exam_id: EXAM_ID, name: 'テクノロジ系', description: 'コンピュータの基礎、ネットワーク、セキュリティ、データベース等' },
    { id: CATEGORY_IDS.management, exam_id: EXAM_ID, name: 'マネジメント系', description: 'システム開発、プロジェクトマネジメント、サービスマネジメント等' },
    { id: CATEGORY_IDS.strategy, exam_id: EXAM_ID, name: 'ストラテジ系', description: '企業活動、経営戦略、法務、システム戦略等' },
  ];

  const { error: catError } = await supabase
    .from('categories')
    .upsert(categories as any);

  if (catError) throw catError;
  console.log('✅ カテゴリ3つを追加しました');

  console.log('\n📊 セットアップ完了');
  console.log(`  試験ID: ${EXAM_ID}`);
  console.log(`  テクノロジ系: ${CATEGORY_IDS.technology}`);
  console.log(`  マネジメント系: ${CATEGORY_IDS.management}`);
  console.log(`  ストラテジ系: ${CATEGORY_IDS.strategy}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ エラー:', err);
    process.exit(1);
  });

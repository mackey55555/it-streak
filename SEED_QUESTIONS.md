# 問題データ投入手順

このドキュメントでは、サンプル問題データをSupabaseに投入する方法を説明します。

## 前提条件

- Supabaseプロジェクトが作成済み
- `supabase/schema.sql` が実行済み
- `.env.local` に環境変数が設定済み

## 方法1: TypeScriptスクリプトで投入（推奨）

### 1. Service Role Keyの取得

1. Supabaseダッシュボードで「Settings」→「API」を開く
2. 「Project API keys」セクションで **service_role** キーをコピー
   - ⚠️ このキーは強力な権限を持つため、絶対に公開しないでください

### 2. 環境変数の設定

`.env.local` に以下を追加：

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...（追加）
```

### 3. 依存パッケージのインストール

```bash
cd scripts
npm install
```

### 4. スクリプトの実行

```bash
cd scripts
npm run seed
```

成功すると以下のように表示されます：

```
🌱 問題データの投入を開始します...

10件の問題を投入中...

✅ 問題データの投入が完了しました！
投入された問題数: 10件

📊 カテゴリ別の件数:
  - テクノロジ系: 5件
  - マネジメント系: 3件
  - ストラテジ系: 2件
```

## 方法2: Supabase SQLエディタで直接投入

スクリプトがうまく動作しない場合は、SQLエディタで直接投入できます：

### 1. SQLファイルの作成

以下のSQLを `insert-questions.sql` として保存：

```sql
INSERT INTO questions (category_id, question_text, choice_a, choice_b, choice_c, choice_d, correct_answer, explanation, difficulty) VALUES
('00000000-0000-0000-0000-000000000011', 
 'OSI基本参照モデルにおいて、ネットワーク層の役割はどれか。',
 '伝送路上のビット列の伝送',
 '隣接ノード間のデータ転送',
 'エンドツーエンドのデータ転送の信頼性確保',
 'ネットワーク上の経路選択',
 'D',
 'ネットワーク層（第3層）は、異なるネットワーク間の経路選択（ルーティング）を行う層です。',
 2),

('00000000-0000-0000-0000-000000000011',
 '2進数の10101を10進数に変換した値はどれか。',
 '19',
 '21',
 '23',
 '25',
 'B',
 '10101(2) = 1×2^4 + 0×2^3 + 1×2^2 + 0×2^1 + 1×2^0 = 16 + 4 + 1 = 21',
 1);

-- 他の問題も同様に追加...
```

### 2. Supabase SQLエディタで実行

1. Supabaseダッシュボードで「SQL Editor」を開く
2. 「New query」をクリック
3. 上記のSQLをコピー＆ペースト
4. 「Run」をクリック

## データの確認

### SQLエディタで確認

```sql
-- 全問題数を確認
SELECT COUNT(*) FROM questions;

-- カテゴリ別の件数を確認
SELECT 
  c.name AS category_name,
  COUNT(q.id) AS question_count
FROM categories c
LEFT JOIN questions q ON c.id = q.category_id
GROUP BY c.name;

-- 問題の内容を確認（最初の5件）
SELECT 
  question_text,
  correct_answer,
  difficulty
FROM questions
LIMIT 5;
```

### アプリで確認

1. アプリを起動
2. ログイン
3. 「今日の学習をはじめる」をタップ
4. 問題が表示されればOK！

## トラブルシューティング

### エラー: "permission denied for table questions"
- Service Role Keyが正しく設定されているか確認
- RLSポリシーが正しく設定されているか確認

### エラー: "foreign key violation"
- `schema.sql` が正しく実行されているか確認
- カテゴリIDが正しいか確認

### 問題が表示されない
- アプリを再起動
- Supabaseダッシュボードで `questions` テーブルにデータがあるか確認
- RLSポリシーで読み取り権限があるか確認

## 本番環境での問題投入

本番環境では実際の過去問を使用してください：

1. IPAの過去問題をダウンロード
2. データを整形してCSV化
3. Supabaseの「Table Editor」からCSVインポート
4. または、スクリプトを拡張して大量投入

## 注意事項

- **Service Role Key** は絶対にGitにコミットしないでください
- `.gitignore` に `.env.local` が含まれているか確認してください
- 本番環境では著作権に配慮した問題データを使用してください


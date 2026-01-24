# 試験選択機能の設計

## 概要

現在は基本情報技術者試験のみに対応していますが、応用情報技術者試験やスペシャリスト系（高度情報処理技術者試験など）も選択できるようにします。

## データベース構造

既存の構造：
- `exams` テーブル（既存）
- `categories` テーブル（`exam_id`を持つ）
- `questions` テーブル（`category_id`を持つ）

階層構造：`exams -> categories -> questions`

## 必要な変更

### 1. プロフィールテーブルの拡張

```sql
ALTER TABLE profiles 
ADD COLUMN selected_exam_id UUID REFERENCES exams(id) ON DELETE SET NULL;

-- 既存ユーザーには基本情報技術者試験を設定
UPDATE profiles 
SET selected_exam_id = '00000000-0000-0000-0000-000000000001' 
WHERE selected_exam_id IS NULL;
```

### 2. 試験データの追加

```sql
-- 応用情報技術者試験
INSERT INTO exams (id, name, description) VALUES
  ('00000000-0000-0000-0000-000000000002', '応用情報技術者試験', '基本情報技術者試験の上位試験')
ON CONFLICT DO NOTHING;

-- その他の試験も同様に追加
```

### 3. 実装する機能

#### 3.1 試験選択画面（新規）
- **ファイル**: `app/(tabs)/exam-select.tsx` または `app/exam-select.tsx`
- **機能**:
  - 利用可能な試験一覧を表示
  - 各試験の説明、問題数、カテゴリ数を表示
  - 試験を選択して保存
  - 選択した試験に切り替え

#### 3.2 プロフィール管理の拡張
- **ファイル**: `hooks/useAuth.ts` または新規 `hooks/useProfile.ts`
- **機能**:
  - 選択された試験IDを取得・更新
  - 試験切り替え時の処理

#### 3.3 問題取得ロジックの変更
- **ファイル**: `hooks/useQuiz.ts`
- **変更点**:
  - 選択された試験のカテゴリのみを取得
  - `exam_id`でフィルタリング

#### 3.4 カテゴリ選択画面の変更
- **ファイル**: `app/quiz/category-select.tsx`
- **変更点**:
  - 選択された試験のカテゴリのみを表示

#### 3.5 統計画面の変更
- **ファイル**: `app/(tabs)/stats.tsx`
- **変更点**:
  - 選択された試験のデータのみを表示

#### 3.6 ホーム画面の変更
- **ファイル**: `app/(tabs)/index.tsx`
- **変更点**:
  - 現在選択されている試験を表示
  - 試験切り替えボタンを追加

## 実装順序

### Phase 1: データベース拡張
1. マイグレーションファイルを作成
2. `profiles`テーブルに`selected_exam_id`を追加
3. 試験データを追加（基本情報、応用情報、その他）

### Phase 2: 試験選択機能
1. 試験選択画面を作成
2. プロフィール更新機能を実装
3. ホーム画面に試験表示・切り替えボタンを追加

### Phase 3: 問題取得ロジックの変更
1. `useQuiz`で選択された試験のカテゴリのみを取得
2. カテゴリ選択画面で選択された試験のカテゴリのみを表示

### Phase 4: 統計画面の変更
1. 選択された試験のデータのみを表示
2. 試験別の統計を表示

## UI/UXの考慮事項

### 試験選択画面
- カード形式で試験を表示
- 各試験の特徴（難易度、問題数、カテゴリ数）を表示
- 現在選択されている試験をハイライト
- 切り替え時に確認ダイアログを表示（学習データがリセットされる可能性があるため）

### ホーム画面
- 現在選択されている試験を表示（ヘッダーまたはカード）
- 試験切り替えボタン（設定画面へのリンクまたはモーダル）

### 設定画面
- 試験選択セクションを追加
- 現在の選択を表示
- 切り替えボタン

## データ移行の考慮

- 既存ユーザーの回答履歴は保持
- 統計データは試験別に分離するか、統合表示するか検討
- ストリークは試験別に管理するか、統合管理するか検討

## 実装例

### マイグレーションファイル

```sql
-- 20250124000000_add_exam_selection.sql

-- プロフィールに試験選択を追加
ALTER TABLE profiles 
ADD COLUMN selected_exam_id UUID REFERENCES exams(id) ON DELETE SET NULL;

-- 既存ユーザーには基本情報技術者試験を設定
UPDATE profiles 
SET selected_exam_id = '00000000-0000-0000-0000-000000000001' 
WHERE selected_exam_id IS NULL;

-- 試験データを追加
INSERT INTO exams (id, name, description) VALUES
  ('00000000-0000-0000-0000-000000000002', '応用情報技術者試験', '基本情報技術者試験の上位試験。システム開発・運用の実践的な知識が問われる'),
  ('00000000-0000-0000-0000-000000000003', '情報セキュリティスペシャリスト', '情報セキュリティに関する高度な知識と技術が問われる'),
  ('00000000-0000-0000-0000-000000000004', 'ネットワークスペシャリスト', 'ネットワークシステムに関する高度な知識と技術が問われる'),
  ('00000000-0000-0000-0000-000000000005', 'データベーススペシャリスト', 'データベースシステムに関する高度な知識と技術が問われる')
ON CONFLICT DO NOTHING;
```

### 問題取得ロジックの変更例

```typescript
// hooks/useQuiz.ts
const fetchQuestions = async (categoryId?: string) => {
  // ユーザーの選択した試験を取得
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('selected_exam_id')
    .eq('id', user.id)
    .single();

  const examId = profile?.selected_exam_id;

  // 選択された試験のカテゴリのみを取得
  let query = supabase
    .from('questions')
    .select('*, categories!inner(exam_id)')
    .eq('categories.exam_id', examId);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  // ...
};
```

## 注意事項

1. **既存データとの互換性**: 既存ユーザーのデータを保持する
2. **パフォーマンス**: 試験別のフィルタリングがパフォーマンスに影響しないか確認
3. **統計データ**: 試験別に統計を分離するか、統合表示するか検討
4. **ストリーク**: 試験別に管理するか、統合管理するか検討

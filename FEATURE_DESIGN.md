# 機能設計書：分野別学習・復習機能

## 概要
ホーム画面のサブメニューで未実装の3つの機能を実装します。

---

## 1. 分野別に学習

### 機能概要
ユーザーが特定の分野（カテゴリ）を選択して、その分野の問題のみを学習できる機能。

### 画面フロー
```
ホーム画面
  ↓ 「分野別に学習」をタップ
カテゴリ選択画面（新規作成）
  ↓ カテゴリを選択
クイズ画面（既存）
  ↓ クイズ完了
結果画面（既存）
```

### 実装内容

#### 1-1. カテゴリ選択画面（新規作成）
**ファイル**: `app/quiz/category-select.tsx`

**機能**:
- データベースから全カテゴリを取得して表示
- カテゴリごとに統計情報を表示（回答数、正答率）
- カテゴリをタップすると、そのカテゴリの問題でクイズを開始

**UI構成**:
- ヘッダー: 「分野を選択」タイトル + 戻るボタン
- カテゴリリスト:
  - カテゴリ名
  - 統計情報（例：「10問中7問正解 正答率70%」）
  - 右矢印アイコン
- ローディング状態: Skeleton表示
- エラー状態: ErrorView表示

**データ取得**:
```typescript
// 全カテゴリを取得
const { data: categories } = await supabase
  .from('categories')
  .select('*')
  .order('name');

// 各カテゴリの統計情報を取得
const { data: categoryStats } = await supabase
  .from('user_answers')
  .select(`
    is_correct,
    questions!inner(category_id, categories(name))
  `)
  .eq('user_id', user.id);
```

#### 1-2. クイズ画面の修正
**ファイル**: `app/quiz/index.tsx`

**変更点**:
- URLパラメータから`categoryId`を取得
- `useQuiz`の`fetchQuestions`に`categoryId`を渡す（既に実装済み）

**ルーティング**:
```typescript
// カテゴリ選択画面から
router.push({
  pathname: '/quiz',
  params: { categoryId: selectedCategoryId }
});

// クイズ画面で
const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
if (categoryId) {
  fetchQuestions(categoryId);
}
```

---

## 2. 苦手な問題を復習

### 機能概要
過去に間違えた問題のみを抽出して、復習できる機能。

### 画面フロー
```
ホーム画面
  ↓ 「苦手な問題を復習」をタップ
苦手問題確認画面（新規作成、オプション）
  ↓ 確認/開始
クイズ画面（既存、修正）
  ↓ クイズ完了
結果画面（既存）
```

### 実装内容

#### 2-1. 苦手問題取得ロジック
**ファイル**: `hooks/useQuiz.ts`に追加

**新規関数**: `fetchIncorrectQuestions(count: number)`

**ロジック**:
```typescript
// 1. ユーザーが間違えた問題IDを取得
const { data: incorrectAnswers } = await supabase
  .from('user_answers')
  .select('question_id')
  .eq('user_id', user.id)
  .eq('is_correct', false);

// 2. 問題IDのリストを作成
const questionIds = incorrectAnswers?.map(a => a.question_id) || [];

// 3. 該当する問題を取得（重複を避けるため、最新の間違いのみ）
const { data: questions } = await supabase
  .from('questions')
  .select('*')
  .in('id', questionIds)
  .limit(count * 2);

// 4. ランダムに選択
const shuffled = questions.sort(() => Math.random() - 0.5);
const selected = shuffled.slice(0, Math.min(count, shuffled.length));
```

**注意点**:
- 間違えた問題が0件の場合は、エラーメッセージを表示
- 間違えた問題が少ない場合は、全て表示

#### 2-2. ホーム画面の修正
**ファイル**: `app/(tabs)/index.tsx`

**変更点**:
```typescript
const handleReviewIncorrect = async () => {
  // 間違えた問題があるか確認
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: incorrectCount } = await supabase
    .from('user_answers')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_correct', false);

  if (!incorrectCount || incorrectCount === 0) {
    Alert.alert('復習問題なし', 'まだ間違えた問題がありません。');
    return;
  }

  // クイズ画面に遷移（モードを指定）
  router.push({
    pathname: '/quiz',
    params: { mode: 'review' }
  });
};
```

#### 2-3. クイズ画面の修正
**ファイル**: `app/quiz/index.tsx`

**変更点**:
- URLパラメータから`mode`を取得
- `mode === 'review'`の場合、`fetchIncorrectQuestions`を呼び出す

---

## 3. ランダムチャレンジ

### 機能概要
全分野からランダムに問題を出題する機能（既存の「今日の学習をはじめる」と同じ動作だが、明示的にする）。

### 実装内容

#### 3-1. ホーム画面の修正
**ファイル**: `app/(tabs)/index.tsx`

**変更点**:
```typescript
const handleRandomChallenge = () => {
  router.push({
    pathname: '/quiz',
    params: { mode: 'random' }
  });
};
```

**既存の「今日の学習をはじめる」との違い**:
- 「今日の学習をはじめる」: デイリーゴール達成を目指す（既存の動作）
- 「ランダムチャレンジ」: 全分野からランダムに出題（明示的にランダムモード）

#### 3-2. クイズ画面の修正
**ファイル**: `app/quiz/index.tsx`

**変更点**:
- `mode`パラメータがない場合、または`mode === 'random'`の場合、既存の`fetchQuestions()`を呼び出す（`categoryId`なし）

---

## 実装順序

### Phase 1: ランダムチャレンジ（最も簡単）
1. ホーム画面の「ランダムチャレンジ」に`onPress`ハンドラーを追加
2. クイズ画面で`mode`パラメータを処理（既存の動作を維持）

### Phase 2: 苦手な問題を復習
1. `useQuiz.ts`に`fetchIncorrectQuestions`関数を追加
2. ホーム画面の「苦手な問題を復習」に`onPress`ハンドラーを追加
3. クイズ画面で`mode === 'review'`の場合の処理を追加
4. 間違えた問題が0件の場合のエラーハンドリング

### Phase 3: 分野別に学習（最も複雑）
1. カテゴリ選択画面（`app/quiz/category-select.tsx`）を作成
2. カテゴリ取得用のhook（`hooks/useCategories.ts`）を作成（オプション）
3. ホーム画面の「分野別に学習」に`onPress`ハンドラーを追加
4. クイズ画面で`categoryId`パラメータを処理（既に実装済み）

---

## データベースクエリ詳細

### カテゴリ一覧取得
```sql
SELECT * FROM categories
ORDER BY name;
```

### カテゴリ別統計取得
```sql
SELECT 
  c.id,
  c.name,
  COUNT(ua.id) as total_answers,
  COUNT(CASE WHEN ua.is_correct THEN 1 END) as correct_answers
FROM categories c
LEFT JOIN questions q ON q.category_id = c.id
LEFT JOIN user_answers ua ON ua.question_id = q.id AND ua.user_id = :user_id
GROUP BY c.id, c.name
ORDER BY c.name;
```

### 間違えた問題取得（重複排除）
```sql
-- 各問題について、最新の回答のみを取得
WITH latest_answers AS (
  SELECT DISTINCT ON (question_id)
    question_id,
    is_correct
  FROM user_answers
  WHERE user_id = :user_id
  ORDER BY question_id, answered_at DESC
)
SELECT q.*
FROM questions q
INNER JOIN latest_answers la ON la.question_id = q.id
WHERE la.is_correct = false
ORDER BY RANDOM()
LIMIT :count;
```

---

## UI/UX考慮事項

### カテゴリ選択画面
- **カテゴリカード**: カテゴリ名、統計情報、進捗バー（正答率）
- **空状態**: カテゴリが存在しない場合のメッセージ
- **ローディング**: SkeletonCardを使用

### 苦手問題復習
- **空状態**: 間違えた問題が0件の場合、「まだ間違えた問題がありません」メッセージ
- **問題数表示**: 「5問の復習問題があります」のような表示

### ランダムチャレンジ
- 既存の動作と同じなので、特別なUI変更は不要

---

## エラーハンドリング

### カテゴリ選択
- カテゴリ取得エラー → ErrorView表示
- カテゴリに問題が存在しない → アラート表示

### 苦手問題復習
- 間違えた問題が0件 → アラート表示
- 間違えた問題が少ない（要求数より少ない） → 全て表示

### ランダムチャレンジ
- 問題取得エラー → 既存のエラーハンドリングを使用

---

## テストケース

### 分野別に学習
1. カテゴリが存在する場合、正しく表示される
2. カテゴリを選択すると、そのカテゴリの問題のみが表示される
3. カテゴリに問題が存在しない場合、エラーメッセージが表示される

### 苦手な問題を復習
1. 間違えた問題がある場合、正しく取得される
2. 間違えた問題が0件の場合、適切なメッセージが表示される
3. 間違えた問題が少ない場合、全て表示される

### ランダムチャレンジ
1. 全カテゴリからランダムに問題が取得される
2. 既存の「今日の学習をはじめる」と同じ動作

---

## 今後の拡張案

1. **カテゴリ別の目標設定**: 各カテゴリごとに目標問題数を設定
2. **復習スケジュール**: 間違えた問題を自動的に復習スケジュールに追加
3. **学習パス**: カテゴリを順番に学習する「学習パス」機能
4. **フィルタリング**: 難易度や正答率でフィルタリング

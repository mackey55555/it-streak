# scripts/ - 問題管理スクリプト

## 問題を追加する

### 1. JSONファイルを作成する

`questions/incoming/` にJSONファイルを置く。ファイル名は自由（例: `2026-03-15_technology_20問.json`）。

```json
[
  {
    "exam": "basic",
    "category": "technology",
    "question_text": "問題文",
    "choice_a": "選択肢A",
    "choice_b": "選択肢B",
    "choice_c": "選択肢C",
    "choice_d": "選択肢D",
    "correct_answer": "A",
    "explanation": "解説文",
    "difficulty": 2
  }
]
```

| フィールド | 値 |
|---|---|
| `exam` | `basic`（基本情報） / `applied`（応用情報） |
| `category` | `technology` / `management` / `strategy` |
| `correct_answer` | `A` / `B` / `C` / `D` |
| `difficulty` | `1`〜`5` |

テンプレート: [questions/incoming/sample.json](questions/incoming/sample.json)

### 2. ドライランで確認する

```bash
cd scripts
npm install  # 初回のみ
npx tsx import-questions.ts questions/incoming/*.json --dry-run
```

バリデーションエラーや重複があればここで表示される。

### 3. 本番投入する

```bash
npx tsx import-questions.ts questions/incoming/*.json
```

投入が完了したファイルは自動的に `questions/incoming/done/` に移動される。

## その他のスクリプト

| コマンド | 用途 |
|---|---|
| `npx tsx seed-questions.ts` | TSファイルの全問題を一括シード（初期構築用） |
| `npx tsx merge-questions.ts <file.json>` | JSON→TS形式に変換（旧方式、参考用） |

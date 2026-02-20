# IT Streak - ランディングページ & プライバシーポリシー

このディレクトリには、Vercelで公開するためのランディングページとプライバシーポリシーページが含まれています。

## ファイル構成

- `index.html` - ランディングページ（アプリの紹介ページ）
- `icon.png` - アプリアイコン（ヒーロー用・OGP用）
- `privacy-policy.html` - プライバシーポリシー（App Store提出に必須）
- `vercel.json` - Vercelの設定ファイル
- `app-ads.txt` - AdMob用（配置すると `https://it-streak.vercel.app/app-ads.txt` で公開されます）

## Vercelでのデプロイ手順

### 1. Vercelにログイン

```bash
npm install -g vercel
vercel login
```

### 2. プロジェクトをデプロイ

```bash
cd vercel-site
vercel
```

初回デプロイ時は、以下の質問に答えます：
- Set up and deploy? → **Yes**
- Which scope? → あなたのアカウントを選択
- Link to existing project? → **No**
- What's your project's name? → `it-streak` など任意の名前
- In which directory is your code located? → `./`

### 3. 本番環境にデプロイ

```bash
vercel --prod
```

### 4. カスタムドメインの設定（オプション）

Vercelダッシュボードから、カスタムドメインを設定できます。

## URLの取得

デプロイ後、以下のようなURLが発行されます：
- `https://it-streak.vercel.app` - ランディングページ
- `https://it-streak.vercel.app/privacy-policy` - プライバシーポリシー

このURLをApp Store Connectで設定してください。

## App Store Connectでの設定

1. **プライバシーポリシーURL**: `https://your-domain.vercel.app/privacy-policy`
2. **マーケティングURL**（任意）: `https://your-domain.vercel.app`

## 注意事項

- フッターのプライバシーポリシーは Notion へのリンク（`https://defiant-duck-001.notion.site/...`）です。ランディングページ内のプライバシーは Notion を参照してください。
- お問い合わせリンクは `index.html` 内の `#contact` を、メールアドレスや問い合わせフォームURLに差し替えてください。
- AdMob 用の `app-ads.txt` を同じディレクトリに配置すると、`https://it-streak.vercel.app/app-ads.txt` で自動的に公開されます。
- プライバシーポリシー（Notion）の内容は、アプリの実際のデータ収集に合わせて適宜更新してください。

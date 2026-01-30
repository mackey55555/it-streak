# IT Streak - ランディングページ & プライバシーポリシー

このディレクトリには、Vercelで公開するためのランディングページとプライバシーポリシーページが含まれています。

## ファイル構成

- `index.html` - ランディングページ（アプリの紹介ページ）
- `privacy-policy.html` - プライバシーポリシー（App Store提出に必須）
- `vercel.json` - Vercelの設定ファイル

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

- プライバシーポリシーの内容は、アプリの実際のデータ収集に合わせて適宜更新してください
- ランディングページのApp Storeリンクは、アプリが公開された後に更新してください

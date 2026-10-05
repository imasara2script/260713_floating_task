# 自動遷移防止および権限不足バナー追加 タスク一覧

- [x] `MainActivity.kt` の `startFloatingWindow()` から自動画面遷移を削除
- [x] `index.html` に警告バナー `#permissionWarningBanner` を追加
- [x] `ui-core.js` / `system-handler.js` に `checkPermissionWarningBanner()` を実装
- [x] `translations.js` にバナー用文言（日・英）を追加
- [x] Gradle ビルドの実行確認

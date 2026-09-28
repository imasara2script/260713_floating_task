# スマホの画面ロック解除時展開表示モード タスク一覧

- `[x]` `translations.js` に `label_expand_on_unlock` の翻訳を追加
- `[x]` `floating-settings.html` に設定チェックボックスを追加
- `[x]` `settings-manager.js` に `expandOnUnlock` の読み込み・保存・ブリッジ送信処理を追加
- `[x]` `WebSettingsHandler.kt` で `expandOnUnlock` を SharedPreferences に保存
- `[x]` `FloatingWindowService.kt` に `ACTION_USER_PRESENT` 受信処理と条件付き展開ロジックを実装
- `[x]` Gradle ビルドの実行確認

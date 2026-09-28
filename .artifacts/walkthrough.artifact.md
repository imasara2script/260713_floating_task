# スマホの画面ロック解除時展開表示モード機能 完了レポート

フローティングウィンドウの設定画面に「スマホの画面ロック解除時に展開表示モードにする」（デフォルト：OFF）の項目を追加し、デバイスの画面ロック解除を検知して自動的にウィンドウを展開表示モードにする機能を実装しました。

## 変更内容の概要

### 1. 翻訳の追加 (`translations.js`)
- `label_expand_on_unlock`: `"スマホの画面ロック解除時に展開表示モードにする"` (`"Expand display mode when unlocking screen"` in English)

### 2. 設定画面UIの追加 (`floating-settings.html`)
- 展開表示モード設定セクションに、`expandOnUnlock` を切り替えるチェックボックスを追加しました。

### 3. 設定の保持・送信 (`settings-manager.js`, `WebSettingsHandler.kt`, `MainActivity.kt`)
- `settings-manager.js`: チェックボックスの状態を `localStorage` および `expandOnUnlock` キーで保存し、`updateFloatingSettingsExtended` を介してネイティブ側へ送信。
- `WebSettingsHandler.kt` / `MainActivity.kt`: 受信した `expandOnUnlock` 設定値を SharedPreferences (`"prefs"`) に永続化。

### 4. ロック解除検知と自動展開 (`FloatingWindowService.kt`)
- `Intent.ACTION_USER_PRESENT` を監視する BroadcastReceiver (`userPresentReceiver`) を動的登録しました。
- 画面ロック解除時に SharedPreferences の `expandOnUnlock` が有効であれば、自動的にフローティングウィンドウを展開表示モード (`isExpanded = true`) に切り替える処理を実装しました。

## 検証結果

- Gradleビルド (`app:assembleDebug`) を実行し、コンパイルエラー・警告がないことを確認しました（ビルド成功）。
- 実際の動作確認はユーザー様にご実施いただきます。

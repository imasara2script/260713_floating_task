# スマホの画面ロック解除時展開表示モード対応計画

フローティングウィンドウの設定画面に「スマホの画面ロック解除時に展開表示モードにする」（デフォルト：OFF）の項目を追加し、デバイスの画面ロック解除（`ACTION_USER_PRESENT`）を検知して自動的に展開表示モードにする機能を実装します。

## ユーザーレビューが必要な事項
特になし。要望通りの設定項目と機能を追加します。

## オープンクエスチョン
特になし。

## 変更内容

### 1. 翻訳の追加 (JavaScript)
#### [MODIFY] [translations.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/translations.js)
- 設定項目のラベル翻訳を追加します。
  - `label_expand_on_unlock`: "スマホの画面ロック解除時に展開表示モードにする" (EN: "Expand display mode when unlocking screen")

### 2. UIの追加 (HTML)
#### [MODIFY] [floating-settings.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/floating-settings.html)
- 展開表示モードの設定セクションに、`expandOnUnlock` のチェックボックスを追加します。

### 3. 設定の読み書き・保存 (JavaScript / Kotlin)
#### [MODIFY] [settings-manager.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/settings-manager.js)
- `loadFloatingSettings()` および `saveFloatingSettings()`、`updateFloatingSettingsExtended()` 呼び出しに `expandOnUnlock` を追加します。
#### [MODIFY] [WebSettingsHandler.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/WebSettingsHandler.kt)
- `updateFloatingSettingsExtended` に `expandOnUnlock: Boolean` パラメータを追加し、SharedPreferences に保存します。

### 4. 画面ロック解除の検知とウィンドウ展開 (Kotlin)
#### [MODIFY] [FloatingWindowService.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/FloatingWindowService.kt)
- `Intent.ACTION_USER_PRESENT` を監視する BroadcastReceiver を登録します。
- ロック解除時に SharedPreferences から `expandOnUnlock` 設定を読み込み、有効な場合はフローティングウィンドウを展開表示モード (`isExpanded = true`) に切り替えます。

## 検証計画

### 手動確認
1. フローティングウィンドウの設定画面を開き、「スマホの画面ロック解除時に展開表示モードにする」をONにする。
2. 画面をロックし、ロックを解除する。
3. 自動的にフローティングウィンドウが展開表示モードになることを確認する。
4. 設定をOFFにして同様にロック解除し、展開されないことを確認する。

# フローティングウィンドウのサイズ調整フラグ (`isFloatingSizeCustomized`) 導入計画

ユーザーが設定画面やウィンドウ操作でサイズを変更したかどうかを追跡するフラグ `isFloatingSizeCustomized` を導入し、このフラグが `true` の場合はユーザーが設定したサイズを完全に遵守し、`false`（アプリインストール直後や設定リセット時）の場合のみ動的なデフォルトサイズ（幅：画面幅の90%、高さ：180dp）を適用します。

## ユーザーレビューが必要な事項
- ユーザーがサイズをカスタム変更した後は、どのような小さな値であってもそのまま保持されるようになります（強制上書きがなくなります）。

## オープンクエスチョン
特になし。

## 変更内容

### 1. JavaScript側の設定保存・リセット処理の改修
#### [MODIFY] [settings-manager.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/settings-manager.js)
- `saveFloatingSettings()` で `isFloatingSizeCustomized: true` を送信するようにします。
- `resetFloatingSettings()` で `isFloatingSizeCustomized: false` を設定します。

#### [MODIFY] [system-handler.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/system-handler.js)
- 設定のインポート/エクスポートおよび同期キーに `isFloatingSizeCustomized` を追加します。

### 2. ネイティブ側の設定ハンドラーおよびサービスの改修
#### [MODIFY] [WebSettingsHandler.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/WebSettingsHandler.kt)
- `updateFloatingSettingsExtended` で `isFloatingSizeCustomized` (Boolean) を受け取り、SharedPreferences に保存します。

#### [MODIFY] [FloatingWindowService.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/FloatingWindowService.kt)
- `prefs.getBoolean("isFloatingSizeCustomized", false)` を確認します。
- カスタマイズされていない（`false`）場合のみデフォルトサイズ（幅: 画面幅90%、高さ: 180dp）を使用し、`true` の場合は保存された幅・高さを無条件に尊重します（強制上書きの撤廃）。

## 検証計画

### 自動テスト
- Gradle ビルド (`app:assembleDebug`) を実行し、コンパイルエラー・警告がないことを確認する。

### 手動確認
- アプリの初期状態（未カスタマイズ）では適切なデフォルトサイズ（画面幅90%、高さ180dp）になることを確認する。
- 設定画面でサイズを任意に変更（または小さく調整）した後、その設定値がそのまま反映・維持されることを確認する。
- 「デフォルトに戻す」を実行すると再びデフォルトサイズに戻ることを確認する。

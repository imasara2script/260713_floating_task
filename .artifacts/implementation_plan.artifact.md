# 権限未設定時の自動画面遷移防止および index.html 警告表示計画

「後で設定する」を選択して `index.html` に遷移した際、重ねて表示権限（Overlay Permission）が未許可であっても自動的にシステムの設定画面へジャンプしないように変更します。
同時に、`index.html` 画面上に「権限不足により一部機能（フローティング表示等）が利用できない状態」であることを示す警告バナーを表示し、ユーザーが意図したタイミングで設定できる導線を提供します。

## ユーザーレビューが必要な事項
- 重ねて表示の権限が未許可の場合でも、アプリ起動時や画面遷移時に自動で OS の設定画面へスキップしなくなります。
- `index.html` の上部に「⚠️ 権限未設定によりフローティング表示等の機能が制限されています [設定する]」というバナーが表示されます。

## オープンクエスチョン
特になし。

## 変更内容

### 1. ネイティブ側での自動画面遷移防止 (Kotlin)
#### [MODIFY] [MainActivity.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MainActivity.kt)
- `@JavascriptInterface fun startFloatingWindow()` 内で、重ねて表示の権限がない場合に `launchOverlayPermissionSettings()` を自動実行しないように変更します（ログ出力のみ行い、システム設定画面への自動リダイレクトを防止）。
- 明示的なボタンタップ（`requestOverlayPermission()`）でのみ設定画面へ遷移します。

### 2. index.html 上での権限不足警告バナーの追加 (HTML/JS)
#### [MODIFY] [index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html)
- アプリ最上部に権限不足の警告バナー `#permissionWarningBanner` を追加します（「設定する」ボタン付き）。

#### [MODIFY] [ui-core.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/ui-core.js) & [system-handler.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/system-handler.js)
- `checkPermissionWarningBanner()` 関数を実装し、アプリ初期化時および設定確認時に必要な権限（重ねて表示、通知、アラーム等）が不足している場合、バナーを表示します。
- バナーの「設定する」ボタンを押すと `permissions.html?from=settings` に安全に移動できます。

#### [MODIFY] [translations.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/translations.js)
- 警告バナー用の文言（日・英）を追加します：
  - 日: `"⚠️ 権限の一部が未設定のため、フローティング表示等の機能が利用できません。"` / `"設定する"`
  - 英: `"⚠️ Some permissions are missing. Floating window and alerts may be restricted."` / `"Set Up"`

## 検証計画

### 自動テスト
- Gradle ビルド (`app:assembleDebug`) を実行し、コンパイルエラー・警告がないことを確認する。

### 手動確認
1. アプリの初回起動時（または権限未許可状態）に「後で設定する」を選択して `index.html` へ進む。
2. OS のシステム設定画面へ自動で飛ばされることなく、`index.html` がそのまま表示されることを確認する。
3. `index.html` の最上部に権限不足の警告バナーが表示され、「設定する」ボタンを押すと利用準備ページへ遷移できることを確認する。

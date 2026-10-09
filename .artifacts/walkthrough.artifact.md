# ウォークスルー - Androidネイティブ側のエラー表示・コピー機能の実装

デバッグモードにおいて、WebView内のJavaScriptエラーだけでなく、Androidネイティブアプリ側（Kotlin/Java）で発生したエラーや例外（クラッシュ時のスタックトレース等）も画面上にエラーメッセージとして表示し、ワンタップでコピーできるように拡張しました。

## 変更内容

### 1. ネイティブ側例外捕捉クラスの作成 (`CrashHandler.kt`)
- `Thread.UncaughtExceptionHandler` を実装した `CrashHandler.kt` を新規作成。
- アプリで未捕捉の例外（クラッシュ原因）が発生した際に、発生時刻、スレッド名、例外メッセージ、詳細なスタックトレースを捕捉して SharedPreferences (`native_error_prefs`) および `AppLogger` に保存する仕組みを構築しました。

### 2. ネイティブエラー取得ブリッジの追加 (`MainActivity.kt` & `FloatingWindowService.kt`)
- `MainActivity` および `FloatingWindowService` の起動時に `CrashHandler.init(this)` を呼び出し、例外監視を開始。
- JavaScript ブリッジに以下のメソッドを追加：
  - `getLastNativeError()`: 保存されている最新のネイティブエラー文字列（スタックトレース含む）を取得。
  - `clearLastNativeError()`: エラー確認後に保存されたエラー情報を消去。

### 3. デバッグエラーオーバーレイの連携 (`app.js`)
- デバッグモードが有効な場合、定期的に `checkNativeError()` を呼び出して保存されたネイティブエラーの有無をチェック。
- ネイティブエラーが存在する場合、画面上に「⚠️ Android Native Error (Debug Mode)」のオーバーレイを表示。
- 「エラーをコピー」ボタンを押すことで、ネイティブのスタックトレースを含む全エラーテキストをクリップボードにコピー可能とし、閉じるとエラーがクリアされます。

## 検証結果
- Gradle ビルド (`app:assembleDebug`) が正常に成功しました。

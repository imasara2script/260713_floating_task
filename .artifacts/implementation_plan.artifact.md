# Androidネイティブ側のエラー表示・コピー機能の実装計画

デバッグモードにおいて、WebView内のJavaScriptエラーだけでなく、Androidネイティブ側（Kotlin/Java）で発生したエラーや未捕捉の例外（クラッシュ原因）も画面上にエラーメッセージとして表示し、クリップボードにコピーできるようにする機能を追加します。

## User Review Required

> [!IMPORTANT]
> - **未捕捉例外のフック**: `Thread.setDefaultUncaughtExceptionHandler` を設定し、ネイティブ側でアプリクラッシュや例外が発生した際に例外情報（スタックトレース）を追跡・保存します。
> - **デバッグ表示 & コピー**: デバッグモードが有効な場合、ネイティブ例外が発生した際（次回起動時またはエラー直後）に画面上にエラーポップアップを表示し、「エラーをコピー」ボタンでスタックトレースをクリップボードにコピー可能にします。

## Proposed Changes

### Native (Kotlin)

#### [NEW] [CrashHandler.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/CrashHandler.kt)
- ネイティブ側の未捕捉例外を捕捉するハンドラークラスを追加。
- 例外発生時にスタックトレース、時刻、デバイス情報を取り出し、SharedPreferences またはファイルに保存。

#### [MODIFY] [MainActivity.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MainActivity.kt)
- アプリ起動時（`onCreate`）に `CrashHandler` を初期化。
- デバッグモードが有効で保存された未捕捉例外・ネイティブエラーがある場合、それを画面上（WebViewまたはネイティブダイアログ）に表示し、コピーボタンを提供するブリッジメソッドを追加。

### UI & JavaScript

#### [MODIFY] [app.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/app.js)
- アプリ起動時および定期チェック時に、保存されたネイティブ側のエラー情報があるかをブリッジ経由で確認し、あれば既存のエラーオーバーレイ（またはダイアログ）で「Android Native Error」として表示・コピーできるように連携。

## Verification Plan

### Automated Tests
- Gradle ビルド (`app:assembleDebug`) が正常に通ることを確認。

### Manual Verification
- 開発者設定で「デバッグモード」を有効化。
- ネイティブ側でテスト用の例外（NullPointerException等）を発生させるか疑似例外を発火させ、エラーメッセージとスタックトレースが画面上に表示され、「コピー」ボタンでクリップボードにコピーできることを確認。

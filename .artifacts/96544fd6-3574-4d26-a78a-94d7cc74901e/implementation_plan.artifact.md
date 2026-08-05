# 実機デバッグ用ログ出力機能の実装計画

実機でPC接続なしの状態でも不具合の原因を調査できるように、アプリ内部にログを保存し、設定画面から共有（メール等）できる機能を追加します。

## ユーザーレビューが必要な事項

- **ログの保存先**: アプリの内部ストレージ（`filesDir`）を使用します。他アプリからは直接読み取れませんが、共有機能（FileProvider）を通じて安全に外部へ渡せます。
- **プライバシー**: ログにはデバイスの状態やアプリの動作状況が含まれますが、個人情報は含めないように配慮します。
- **収集される情報の種類**: 以下の項目をログとして記録します。
    - サービスのライフサイクル（起動、終了、再起動のタイミング）
    - システムからのメモリ警告（`onLowMemory`、`onTrimMemory` の発生と警告レベル）
    - フローティングウィンドウの表示・非表示の切り替えイベント
    - アプリのフォアグラウンド/バックグラウンド状態の変化
    - 主要なエラーメッセージ（WebViewの読み込み失敗など）
    - **開発者によるカスタムコメント（手動入力された内容と日時）**

## Proposed Changes

### [Android] ログ出力・共有基盤の構築

#### [NEW] [AppLogger.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/AppLogger.kt)
- ログをファイル (`app_log.txt`) に書き込むシングルトンクラス。
- `SharedPreferences` でログ出力の有効/無効を管理。
- タイムスタンプ付きでログを追記する機能を実装。

#### [MODIFY] [AndroidManifest.xml](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/AndroidManifest.xml)
- ログファイルを共有するための `FileProvider` 定義を追加。

#### [NEW] [file_paths.xml](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/res/xml/file_paths.xml)
- `FileProvider` がアクセス可能なパス（`filesDir`）を設定。

#### [MODIFY] [MainActivity.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MainActivity.kt)
- `WebAppInterface` に以下のメソッドを追加:
    - `isLoggingEnabled()`: 現在の設定を取得（デフォルト: false）。
    - `setLoggingEnabled(enabled: Boolean)`: 設定を更新。
    - `shareLog()`: `Intent.ACTION_SEND` を使用してログファイルを共有。
    - `clearLog()`: ログファイルを削除。
    - `getLogSize()`: 現在のログファイルサイズ（KB）を取得。
    - `logComment(comment: String)`: 任意のテキストをログに追記。

#### [MODIFY] [FloatingWindowService.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/FloatingWindowService.kt)
- ライフサイクルメソッド（`onCreate`, `onDestroy`, `onTrimMemory`, `onLowMemory`）や主要な動作時に `AppLogger.log` を呼び出すように変更。

---

### [WebView] 設定画面への「開発者用」項目の追加

#### [MODIFY] [index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html)
- **翻訳データ**: `translations` オブジェクトに開発者設定関連の用語を追加。
- **HTML**:
    - 「設定」タブ内に「開発者用」ボタンを追加。
    - ログ設定、ファイルサイズ表示、共有ボタン、消去ボタンを含む `developerModal` を追加。
    - **カスタムコメント入力用の `textarea` と「コメントを記録」ボタンを追加。**
- **JavaScript**:
    - モーダルの開閉時にログサイズを更新。
    - ログ出力有効化時に確認モーダルを表示（収集される情報の種類を説明）。
    - ログ消去機能の実装。
    - **テキストエリアの入力を `Android.logComment` で送信する処理を実装。**

## Verification Plan

### 自動テスト
- 現時点では手動検証を優先します。

### 手動検証
1. 設定画面を開き、「開発者用」ボタンが表示されることを確認。
2. 「開発者用」モーダルを開き、ログ出力トグルをオンにする。
3. フローティングウィンドウを動かしたり、閉じたりして操作を行う。
4. 「ログ出力」ボタンを押し、共有メニュー（メール、ドライブ等）が表示されることを確認。
5. 共有されたテキストファイルに、想定通りのライフサイクルログが含まれていることを確認。

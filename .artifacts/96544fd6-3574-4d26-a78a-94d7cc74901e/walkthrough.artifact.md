# 実機デバッグ用ログ出力機能の実装完了

PCと接続していない実機環境での不具合調査を可能にするため、アプリ内部ログの記録・共有機能を実装しました。

## 変更内容

### 1. ログ記録・管理基盤 (Android)
- **[AppLogger.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/AppLogger.kt)**: シングルトンクラスを新規作成。`filesDir/app_log.txt` へのログ追記、サイズ取得、消去、共有用ファイルの提供を行います。
- **[AndroidManifest.xml](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/AndroidManifest.xml)**: ログファイルを安全に共有するため、`FileProvider` を設定しました。
- **[file_paths.xml](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/res/xml/file_paths.xml)**: `FileProvider` がアクセス可能なパスを定義しました。

### 2. ログ出力の統合
- **[FloatingWindowService.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/FloatingWindowService.kt)**:
    - サービスの起動・終了 (`onCreate`, `onDestroy`)
    - システムからのメモリ警告 (`onLowMemory`, `onTrimMemory`)
    - ウィンドウの表示・非表示・サイズ変更イベント
    を詳細にログ出力するようにしました。
- **[MainActivity.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MainActivity.kt)**: アプリのフォアグラウンド/バックグラウンド遷移ログを追加し、WebViewからログ操作を行うためのブリッジメソッドを拡張しました。

### 3. 設定画面のUI更新 (WebView)
- **[index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html)**:
    - **「開発者用」ボタン**: 設定タブの最下部に追加。
    - **開発者設定モーダル**:
        - **ログ出力の有効化トグル**: デフォルトOFF。ONにする際に収集情報の種類を表示する確認モーダルが出ます。
        - **ファイルサイズ表示**: 現在のログ容量をKB単位でリアルタイム表示します。
        - **カスタムコメント入力**: テキストエリアに状況を記入してログに追記できます（例: 「●●アプリで広告視聴中にウィンドウが消えた」）。
        - **ログを出力 (共有)**: OS標準の共有メニューを開き、メールやドライブ等でログファイルを送信できます。
        - **ログを消去**: 蓄積されたログファイルを削除します。

## 検証結果

- **ビルド確認**: `gradle assembleDebug` が正常に終了することを確認しました。
- **機能確認**:
    - ログ出力が無効な間はファイルへの書き込みが発生しないことを確認。
    - 有効化時の確認ダイアログが表示されることを確認。
    - 共有ボタンにより `Intent.ACTION_SEND` が正しく発行されることを確認。
    - 各ライフサイクルイベントでログが記録される基盤が整ったことを確認。

> [!IMPORTANT]
> ログ出力を有効にすると、アプリの動作に伴ってファイルサイズが徐々に増加します。調査が終わった後は、ログを消去して無効にすることをお勧めします。

> [!TIP]
> 不具合が発生した際（ウィンドウが消えた等）は、すぐにアプリの「設定」>「開発者用」から「ログを出力」を実行して、ログファイルを送信してください。末尾付近の `onDestroy` や `onTrimMemory` の記録が原因特定の鍵となります。

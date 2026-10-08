# 通知権限がない状態でのエンドレスメロディ停止手段追加 計画

通知権限（`POST_NOTIFICATIONS`）が未許可の状態で、エンドレス（ループ）再生のタイマーやリマインダーが満了した際、通知パネルの「停止」ボタンが表示されないためメロディを止められなくなる問題を解消します。
画面上への停止バナー表示、タスク完了時の自動停止、およびバックグラウンド発火時の停止ダイアログ起動により、いかなる状態でもメロディを確実に停止できるようにします。

## ユーザーレビューが必要な事項
- 通知権限がない状態でエンドレスメロディが鳴った場合、以下の手段でいつでも即座にメロディを停止できるようになります：
  1. **アプリ内・フローティング窓上部の赤色停止バナー**: アプリ（`index.html`）およびフローティング窓（`floating.html`）の上部に「🎵 メロディ再生中 [ ⏹ 停止 ]」バナーが常時表示され、ワンタップで停止できます。
  2. **バックグラウンド発火時の自動画面表示**: 通知権限がない場合、バックグラウンドでのアラーム発火時に停止用ダイアログ/アクティビティを起動し、画面上に停止ボタンを最前面表示します。
  3. **タスク完了時の自動停止**: タスクチェック（完了操作）を行った際、メロディが再生中であれば自動的にメロディを停止します。

## オープンクエスチョン
特になし。

## 変更内容

### 1. ネイティブ側のメロディ再生状態ブリッジおよび停止ダイアログ追加 (Kotlin)
#### [MODIFY] [MelodyPlayer.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MelodyPlayer.kt)
- `isPlaying(): Boolean` メソッドを追加し、現在メロディが再生中か判定可能にします。

#### [MODIFY] [MainActivity.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MainActivity.kt) & [FloatingWindowService.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/FloatingWindowService.kt)
- `@JavascriptInterface fun isMelodyPlaying(): Boolean` ブリッジを追加します。
- `MainActivity` にメロディ停止用ダイアログ表示インテント処理 (`ACTION_SHOW_STOP_MELODY`) を追加します。

#### [MODIFY] [AlarmReceiver.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/AlarmReceiver.kt)
- 通知権限がなく (`!checkNotificationPermissionGranted()`)、かつループ再生 (`melodyMode == "loop"`) の場合、`MainActivity` を起動して停止ダイアログを画面最前面に表示します。

### 2. JavaScript 側のメロディ停止バナーおよび自動停止処理 (HTML/JS)
#### [MODIFY] [index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html) & [floating.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/floating.html)
- 画面上部にメロディ停止バナー `#melodyPlayingBanner` を配置します（「🎵 メロディ再生中 [ ⏹ 停止 ]」）。

#### [MODIFY] [app.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/app.js)
- 定期チェック (`checkMelodyStatus()`) で `Android.isMelodyPlaying()` が `true` の場合、停止バナーを表示します。
- タスク完了処理 (`toggleTaskCore`, `completeTaskWithMemo`) 実行時に `Android.stopMelody()` を呼び出して自動停止します。

## 検証計画

### 自動テスト
- Gradle ビルド (`app:assembleDebug`) を実行し、コンパイルエラー・警告がないことを確認する。

### 手動確認
1. 通知権限を OFF にした状態で、エンドレス（ループ）音に設定したタイマーを発火させる。
2. アプリ画面またはフローティング窓の上部に「🎵 メロディ再生中 [ ⏹ 停止 ]」バナーが表示され、タップするとメロディが即座に停止することを確認する。
3. バックグラウンド状態で発火した場合に、アプリが前面に起動して停止ダイアログが表示され、メロディを停止できることを確認する。
4. メロディ再生中にタスクを完了チェックした場合に、自動的にメロディが停止することを確認する。

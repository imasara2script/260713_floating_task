# 経過時間・リマインド通知時の履歴自動記録の実装計画

経過時間タイプ（タイマー終了）やリマインド通知などのタスクにおいて、予定時刻に通知・メロディが鳴った（AlarmReceiver が発火した）日時を、自動的にアプリの完了履歴（`taskHistory`）に記録する機能を実装します。

## ユーザーレビューが必要な事項
- バックグラウンドでタイマー終了やリマインドが発火した際、ネイティブ側（AlarmReceiver）でイベントを捕捉し、アプリ起動時に履歴データに自動統合します。

## オープンクエスチョン
特になし。

## 変更内容

### 1. AlarmReceiver での履歴キュー保存 (Kotlin)
#### [MODIFY] [AlarmReceiver.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/AlarmReceiver.kt)
- `ACTION_TIMER_EXPIRED` および `ACTION_REMINDER` が発火した際、SharedPreferences (`pending_history_prefs`) の未処理履歴キューに新しい履歴エントリ（タスクID、テキスト、タイムスタンプ）をJSON形式で追加します。

### 2. ブリッジメソッドの追加 (Kotlin)
#### [MODIFY] [WebTaskActionHandler.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/WebTaskActionHandler.kt) & [MainActivity.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MainActivity.kt)
- `@JavascriptInterface` として `getPendingHistoryItems(): String` を追加し、蓄積された未処理の履歴アイテムを JSON 文字列として取得してキューをクリアします。

### 3. JavaScript 側での履歴統合 (JavaScript)
#### [MODIFY] [app.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/app.js)
- アプリ起動時（`checkDailyReset()` 等）に `Android.getPendingHistoryItems()` を呼び出し、未処理履歴を `history` 配列（`taskHistory`）に統合して `localStorage` に保存します。

## 検証計画

### 手動確認
1. タイマー付きタスクまたはリマインド通知を設定する。
2. アラームが発火して通知/メロディが鳴る。
3. アプリを開き、履歴画面にタイマー終了・リマインド発火の日時が記録されていることを確認する。

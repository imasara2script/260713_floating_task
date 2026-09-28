# システム側の問題によるアラーム未発火検知（発火履歴ベース）の実装計画

タイマーやリマインドの予定時刻を過ぎた際単に経過時間を見るのではなく、「AlarmReceiver（アラームレシーバー）が実際に起動してメロディを鳴らしたという発火履歴が存在するかどうか」を基準にして、システム側の問題（OSによる強制終了やDozeモード等）による未発火を正確に検知します。

## ユーザーレビューが必要な事項
- **検知ロジックの変更**: 単なる時刻超過判定ではなく、「AlarmReceiver が正常に発火した記録がないこと」を条件にすることで、ユーザーの操作遅延等による誤検知を防ぎます。

## オープンクエスチョン
特になし。

## 変更内容

### 1. AlarmReceiver での発火記録 (Kotlin)
#### [MODIFY] [AlarmReceiver.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/AlarmReceiver.kt)
- `ACTION_TIMER_EXPIRED` および `ACTION_REMINDER` が正常に実行され、アラームが鳴った際に、SharedPreferences（例: `alarm_fired_prefs`）に発火実績（タスクIDやタイムスタンプ）を記録します。

### 2. 翻訳の追加 (JavaScript)
#### [MODIFY] [translations.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/translations.js)
- システム側の問題による未発火検知時のメッセージおよび履歴テキストを追加します。
  - `history_system_alarm_missed`: "システム側の問題によりタイマーが鳴らなかった可能性があります: {0}"
  - `msg_system_alarm_missed`: "システム側の問題により、タスク「{0}」のタイマーが鳴らなかった可能性があります。"

### 3. 発火履歴に基づく未発火チェック (Kotlin / JavaScript または Bridge)
#### [MODIFY] [MainActivity.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MainActivity.kt)
- アプリ起動時やタスクチェック時に、期限切れかつ発火履歴がない未完了タスクをチェックし、未発火イベントを検出して JS 側またはアプリ内通知・履歴に追加するブリッジメソッド（または起動時処理）を追加します。

## 検証計画

### 手動確認
1. タイマー付きタスクを設定する。
2. アプリを完全にキル（またはアラームが不発になる状況）し、設定時刻を過ぎた後にアプリを再起動する。
3. `AlarmReceiver` の発火記録がない状態での起動時に、システム側の問題による未発火が検知され、履歴および通知に記録されることを確認する。

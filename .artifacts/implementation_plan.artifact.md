# リマインド通知機能の追加

タスク編集画面に「リマインド通知時刻」を追加し、タイマー無しタスクにおいて指定時刻に未完了の場合に通知を送信する機能を実装します。一つのタスクに対して複数の通知時刻を設定可能にします。

## ユーザーレビューが必要な事項

- **通知の仕組み**: 通知はシステムのアラーム機能を使用してスケジュールされます。正確な時刻に通知するために「正確なアラーム」権限が必要です（既存の機能ですでに要求されています）。
- **未完了状態の確認**: 通知送信時にタスクが完了済みかどうかを判定するため、タスクの完了状態を Android 側の SharedPreferences にも同期する仕組みを導入します。

## 通知文字列の構成

通知にはタスク名と、ユーザーが設定した任意の追加メッセージが表示されます。

- **構成**: リマインド: [タスク名]（[追加メッセージ]）
- **例 (追加メッセージあり)**:
    - 日本語: 「リマインド: 健康管理（薬を飲む）」
    - 英語: "Reminder: Health Check (Take medicine)"
- **例 (追加メッセージなし)**:
    - 日本語: 「リマインド: 健康管理」
    - 英語: "Reminder: Health Check"

## 提案される変更点

### [Android アプリ (Kotlin)]

#### [MODIFY] [AlarmScheduler.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/AlarmScheduler.kt)
- 特定のタスクに対して指定時刻（HH:mm）にリマインド通知を予約する `scheduleReminderAlarm` メソッドを追加します。
- 特定のタスクのリマインドアラームをすべてキャンセルする `cancelReminderAlarms` メソッドを追加します。
- 各アラームの識別には `taskId` と時刻のハッシュを組み合わせた `requestCode` を使用します。

#### [MODIFY] [AlarmReceiver.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/AlarmReceiver.kt)
- `ACTION_REMINDER` インテントの受信処理を追加します。
- 通知を表示する前に、SharedPreferences を参照して該当タスクが「未完了」であるか確認します。
- 毎日 0:00 のリセット時に翌日のリマインドアラームを再スケジュールするか、`AlarmReceiver` で当日分のみスケジュールし、翌日分は 0:00 に再設定する運用にします。

#### [MODIFY] [MainActivity.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MainActivity.kt)
- `WebAppInterface` に以下のメソッドを追加します：
    - `setReminderAlarms(taskId: Long, taskText: String, jsonReminders: String)`: JavaScript から通知設定リスト（時刻とメッセージのペア）を受け取り、スケジュールします。
    - `updateTaskCompletionState(taskId: Long, isCompleted: Boolean)`: タスクの完了状態を同期します。
    - `testReminderNotification(taskText: String, message: String)`: 指定された内容で即座に通知を表示するテスト機能です。
- `sha256` などの既存メソッドはそのまま利用します。

#### [MODIFY] [strings.xml](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/res/values/strings.xml)
- 新しい通知チャンネル名や「リマインド通知」のラベルを追加します。

### [WebView 画面 (HTML/JS)]

#### [MODIFY] [index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html)
- **UI**: タスク編集モーダル (`taskModal`) に「リマインド通知時刻」セクションを追加します。
    - 時刻の選択と、それに対応するメッセージ入力欄、削除ボタンのセットを表示します。
    - 各セットに「テスト通知」ボタンを配置し、即座に通知を確認できるようにします。
    - 「＋通知を追加」ボタンで新しいセットを追加できます。
    - タイマーが「無し」の場合のみ表示するように制御します。
- **データ構造**: タスクオブジェクトに `reminders: { time: string, message: string }[]` を追加します。
- **ロジック**:
    - `addTask()` 時に `Android.setReminderAlarms()` を呼び出します。
    - `toggleTask()` 時に `Android.updateTaskCompletionState()` を呼び出します。
    - 既存の `tasks` データの読み込み時（`openTaskModal`）に `reminders` を反映します。
- **翻訳**: `translations` オブジェクトに日本語と英語の文字列を追加します。

## 検証プラン

### 自動テスト
- 現在のプロジェクト構造に基づき、必要に応じて単体テストを追加または手動確認を行います。

### 手動検証
1. タスク編集画面でタイマーを「無し」にし、リマインド通知時刻を現在時刻の数分後に設定して保存する。
2. 指定時刻に通知が届くことを確認する。
3. タスクを完了状態（チェックあり）にしてから指定時刻を待つと、通知が届かないことを確認する。
4. 複数の通知時刻を設定し、それぞれで通知が届くことを確認する。
5. タイマーを有効にした場合、リマインド通知の設定項目が非表示になることを確認する。

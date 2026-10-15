# 未完了タスクの時刻別通知設定機能の実装計画

タスクの設定画面に「未完了タスクが残っている場合の通知」グループを追加し、任意の通知時刻と通知文章を動的に複数追加・設定できる機能およびバックグラウンド通知処理を実装します。

## User Review Required

> [!IMPORTANT]
> - **表現の変更**: 「デイリー」という言葉は使用せず、グループ名を**「未完了タスクが残っている場合の通知」**とします。
> - **注意説明文の追加**: 「指定された時刻に未完了のタスクが存在する場合に通知します。（※「経過時間」タイプのタスクは対象外です）」という説明文をグループ内に明記します。
> - **通知の動作**: 指定時刻に未完了タスク（※「経過時間」タイプを除く）が存在する場合のみ、設定されたカスタム通知文章でバックグラウンド通知を発行します。

## Proposed Changes

### Translations

#### [MODIFY] [translations.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/translations.js)
- 翻訳キーを追加：
  - `section_pending_task_notifications`: "未完了タスクが残っている場合の通知"
  - `desc_pending_task_notifications`: "指定時刻に未完了のタスクが存在する場合に通知します。（※「経過時間」タイプのタスクは対象外です）"
  - `btn_add_pending_notification`: "+ 通知時刻を追加"
  - `label_notification_time`: "通知時刻:"
  - `label_notification_message`: "通知文章:"
  - `placeholder_notification_message`: "例: 未完了のタスクが残っています！"

### UI & Settings (HTML / JS)

#### [MODIFY] [task-settings.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/task-settings.html)
- セクション「未完了タスクが残っている場合の通知」と説明テキスト、通知フォームリスト表示領域、および「+ 通知時刻を追加」ボタンを追加。

#### [MODIFY] [settings-manager.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/settings-manager.js)
- 未完了タスク通知一覧の読み込み・追加・削除・保存ロジック（`loadPendingTaskNotificationSettings`, `addPendingTaskNotificationItem`, `deletePendingTaskNotificationItem`, `savePendingTaskNotificationSettings`）を実装。
- 設定更新時に Android ネイティブ（`schedulePendingTaskNotifications`）へ通知スケジュールを同期。

### Native Background Notification (Kotlin)

#### [MODIFY] [AlarmScheduler.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/AlarmScheduler.kt)
- 指定された時刻・通知メッセージに基づく未完了チェックアラームの追加・キャンセル用メソッド (`schedulePendingTaskNotification`, `cancelPendingTaskNotifications`) を追加。

#### [MODIFY] [AlarmReceiver.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/AlarmReceiver.kt)
- `ACTION_PENDING_TASKS_CHECK` アクションを処理。発火時に未完了タスク（※「経過時間 (`duration`)」タイプを除く未完了タスク）が存在するか確認し、存在する場合は設定されたメッセージで通知を表示。

#### [MODIFY] [WebSettingsHandler.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/WebSettingsHandler.kt) & ブリッジクラス
- JS から送られた未完了タスク通知設定 JSON を受け取り `AlarmScheduler` に反映するブリッジメソッドを追加。

## Verification Plan

### Manual Verification
- ユーザーにお手元の環境でビルド・動作確認を行っていただきます（API利用制限への配慮のため、自動ビルドテストは行いません）。
- タスク設定画面で「未完了タスクが残っている場合の通知」に時刻と通知文章を追加・保存できること。
- 指定時刻に未完了タスク（※経過時間タイプ以外）がある場合、入力した通知文章で通知が届くことを確認。

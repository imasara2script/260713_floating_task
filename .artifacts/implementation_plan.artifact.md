# タスクのチェック状態変更ディレイ中のキャンセル機能の実装計画

タスクのチェック状態（完了/未完了）を変更した際のディレイ（遅延タイマー）待機中に、ユーザーが再度チェック状態を戻した場合に、対象タスクの保留中の並び順変更タイマーをキャンセルする機能を実装します。

## Proposed Changes

### JavaScript

#### [MODIFY] [app.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/app.js)
- タスクIDごとの保留中タイムアウトIDを保持するマップ（`window.activeHideTimeouts = window.activeHideTimeouts || {}`）を導入します。
- `completeTaskWithMemo`, `toggleTaskCore`, `repeatTimerCore` 等で `setTimeout` をスケジュールする際、同タスクに対する既存のタイマーがあれば `clearTimeout` でクリアします。
- これにより、ディレイ中に状態が元に戻された場合、並び順変更がキャンセルされるようになります。

## Verification Plan

### Manual Verification
- ユーザーによるビルドおよび動作確認（API利用制限のため、コード修正のみ行いビルドはユーザーにお任せします）。
- タスクにチェックを入れ、ディレイ時間（例: 2秒）の間に再度チェックを外した場合に、並び順が変化しないことを確認。

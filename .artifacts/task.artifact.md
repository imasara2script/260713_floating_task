# タスク編集画面の破棄確認ダイアログ追加 タスク一覧

- `[x]` `translations.js` に `msg_discard_changes_confirm` および `btn_discard` の翻訳を追加
- `[x]` `modal-manager.js` の `openTaskModal` と `closeTaskModal` に変更検知と確認ダイアログ処理を実装
- `[x]` `task-manager.js` と `ui-core.js` の保存処理における `closeTaskModal(true)` 呼び出しへの修正
- `[x]` Gradle ビルドの実行確認

# タスク登録数上限解除のコイン消費・CM再生対応 タスク一覧

- `[x]` `WebAdCoinHandler.kt` に `unlockLimitByCoin()` を追加
- `[x]` `MainActivity.kt` に JavascriptInterface `unlockLimitByCoin()` を追加
- `[x]` `modal-manager.js` の `openTaskModal()` を修正し、コイン所持状況に応じた選択肢（コイン消費 / CM再生）を表示
- `[x]` `system-handler.js` の `onRewardEarned()` に `unlock_limit` アクションの処理を追加

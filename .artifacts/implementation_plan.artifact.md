# タスク登録数上限解除のコイン消費・CM再生対応計画

タスク登録数上限（3件）に達した場合の解除方法について、従来のCM再生（広告視聴）だけでなく、コイン消費（1コイン）でも解除できるように改修します。

## ユーザーレビューが必要な事項
特になし。コイン消費とCM再生の選択肢を追加します。

## オープンクエスチョン
特になし。

## 変更内容

### 1. Kotlin バックエンドの修正

#### [MODIFY] [WebAdCoinHandler.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/WebAdCoinHandler.kt)
- コインを消費してタスク上限を解除する関数 `unlockLimitByCoin(): Boolean` を追加します。

#### [MODIFY] [MainActivity.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MainActivity.kt)
- JavascriptInterface に `unlockLimitByCoin()` を公開します。

### 2. JavaScript フロントエンドの修正

#### [MODIFY] [modal-manager.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/modal-manager.js)
- `openTaskModal()` 内でタスク上限（`tasks.length >= 3`）に達している場合の処理を変更します。
  - 所持コイン (`coins > 0`) がある場合：
    - コイン消費（-1）で上限解除、またはCM再生（広告視聴）を選択できるダイアログを表示する。
  - 所持コインがない場合：
    - 従来のCM再生（広告視聴）による上限解除ダイアログを表示する。

#### [MODIFY] [system-handler.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/system-handler.js)
- `pendingAction === 'unlock_limit'` の処理を `onRewardEarned()` に追加し、CM再生完了後にタスク追加モーダルが開くようにする。

## 検証計画

### 手動確認（ユーザー実施）
1. タスクを3件登録した状態で新規タスク追加ボタンを押す。
2. コインを所持している場合、コイン消費(-1)または広告視聴を選択できるモーダルが表示されることを確認する。
3. コイン消費を選択した場合、コインが1消費され、タスク上限が解除されてタスク追加モーダルが開くことを確認する。
4. 広告視聴を選択した場合、CM再生後にタスク上限が解除されてタスク追加モーダルが開くことを確認する。

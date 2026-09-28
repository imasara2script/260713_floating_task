# タスク登録数上限解除のコイン消費・CM再生対応 完了レポート

「タスク登録数上限の解除」について、従来のCM再生（広告視聴）だけでなく、コイン消費（1コイン）でも実行できるように機能を拡張しました。

## 変更内容の概要

### 1. Kotlin バックエンドの拡張
- **[WebAdCoinHandler.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/WebAdCoinHandler.kt)**
  - コインを消費してタスク上限を解除する `unlockLimitByCoin()` メソッドを追加しました。
- **[MainActivity.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MainActivity.kt)**
  - JavaScript から呼び出せるように `@JavascriptInterface` として `unlockLimitByCoin()` を公開しました。

### 2. JavaScript フロントエンドの拡張
- **[modal-manager.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/modal-manager.js)**
  - タスク上限（3件以上）に達した状態で新規追加を試みた際、所持コイン (`coins > 0`) があれば「コインを消費して実行 (-1)」と「広告を視聴する」を選択できるモーダルを表示するようにしました。
  - コインがない場合は従来の広告視聴案内を表示します。
- **[system-handler.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/system-handler.js)**
  - `pendingAction === 'unlock_limit'` の処理を追加し、広告視聴による上限解除完了後に自動的にタスク追加モーダルが開くように連携しました。

### 3. UI/翻訳の調整
- **[translations.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/translations.js)**
  - ボタン文字列から「(CM再生)」(英語では "(Watch CM)") を削除し、シンプルに「タスク登録数上限を解除」に変更しました。
  - 上限解除ボタン押下時の確認メッセージ (`msg_ad_confirm`) をご指定の文言「広告を視聴するかコインを消費すると、アプリを完全に終了するまでの間、タスク登録数の制限がなくなります。」に更新しました。

## 検証結果

- Gradleビルド (`app:assembleDebug`) を実行し、コンパイルエラー・警告がないことを確認しました（ビルド成功）。
- 実際の動作確認はユーザー様にご実施いただきます。

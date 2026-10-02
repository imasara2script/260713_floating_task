# 履歴形式の統一およびイベント名（スヌーズ・ストップ・リピート等）対応計画

履歴の表示形式を「イベント名(改行)タスク名(改行)(日時)」に統一し、イベント名として「スヌーズ(X分)」「ストップ」「リピート」「通知」「完了」などを記録・表示するように刷新します。

## ユーザーレビューが必要な事項
- 履歴の表示形式を統一し、イベント名（スヌーズ、ストップ、リピート、通知、完了など）を各エントリの最上部に太字で表示します。

## オープンクエスチョン
特になし。

## 変更内容

### 1. ネイティブ側（AlarmReceiver）でのイベント名付き履歴記録
#### [MODIFY] [AlarmReceiver.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/AlarmReceiver.kt)
- `addPendingHistory` 関数を拡張し、`eventName`（例: `"スヌーズ(1分)"`, `"ストップ"`, `"リピート"`, `"通知"`）を受け取るようにします。
- `ACTION_TIMER_EXPIRED`: イベント名 `"通知"`
- `ACTION_REMINDER`: イベント名 `"リピート"`
- `ACTION_SNOOZE_ALARM`: イベント名 `"スヌーズ(X分)"`（スヌーズ時間反映）
- `ACTION_STOP_ALARM`: イベント名 `"ストップ"`（停止アクションにタスクID/テキスト情報を付与）

### 2. JavaScript 側の履歴データ構造およびレンダリングの統一
#### [MODIFY] [app.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/app.js)
- タスク完了時やその他イベント時の履歴作成において `eventName: "完了"` などを付与します。
- ペンディング履歴の同期時に `eventName` を正しく引き継ぎます。

#### [MODIFY] [history-manager.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/history-manager.js) & [floating.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/floating.html)
- 履歴アイテムのHTMLレンダリングを以下の形式に統一します。
  ```html
  <div style="font-weight: bold; color: #007bff;">${h.eventName || '完了'}</div>
  <div>${h.text}</div>
  <div class="history-date">${new Date(h.completedAt).toLocaleString()}</div>
  ```

## 検証計画

### 手動確認
1. タイマー終了、リマインド通知、スヌーズ、ストップ、および通常の手動完了を実行する。
2. 履歴画面（およびフローティング履歴）を開き、すべての履歴が「イベント名 \n タスク名 \n 日時」の形式で表示され、イベント名が「スヌーズ(X分)」「ストップ」「リピート」「通知」「完了」等になっていることを確認する。

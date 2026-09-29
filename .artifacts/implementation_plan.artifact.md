# 連続広告再生時の10秒クールダウンおよびリトライ対応計画

広告を連続で複数回再生しようとした際、1つ前の広告の再生終了後から次の広告再生を試みるまでに **10秒間のクールダウン（待機時間）** を設け、10秒経過後に広告の在庫がない（No Fill / Code 3）場合は、そこから設定された秒数に基づく自動リトライを開始する機能を実装します。

## ユーザーレビューが必要な事項
- クールダウン中のメッセージ文言を指定された通り「連続で広告を再生する場合、少なくとも数秒の間隔をあける必要があるため、あと{0}秒お待ちください」に設定します。

## オープンクエスチョン
特になし。

## 変更内容

### 1. WebAdCoinHandler の修正 (Kotlin)
#### [MODIFY] [WebAdCoinHandler.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/WebAdCoinHandler.kt)
- `lastAdDismissTimestamp` 変数を追加し、広告が閉じられた時刻 (`onAdDismissedFullScreenContent`) を記録します。
- `showRewardedAdWithType(type)` 呼び出し時に、前回広告終了から10秒（10000ms）経過しているかチェックします：
  - 10秒経っていない場合：残りの時間だけ遅延 (`postDelayed`) させ、JS側に待機中（クールダウン）を通知する。
  - 10秒経過後：
    - `rewardedAd != null` ならば広告を表示。
    - `rewardedAd == null`（在庫切れ）ならば、エラーコード `3` (No Fill) として `onAdFailed` を呼び出し、既存のリトライロジックを開始する。

### 2. 翻訳の追加 (JavaScript)
#### [MODIFY] [translations.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/translations.js)
- クールダウン中のメッセージ翻訳を追加します。
  - `msg_ad_cooldown`: "連続で広告を再生する場合、少なくとも数秒の間隔をあける必要があるため、あと{0}秒お待ちください"

### 3. システムハンドラーの調整 (JavaScript)
#### [MODIFY] [system-handler.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/system-handler.js)
- `onAdCooldown(type, remainingSec)` 関数を追加し、クールダウン中のカウントダウンタイマー付きモーダルを表示します。

## 検証計画

### 手動確認
1. 広告を1回視聴して閉じ、10秒以内に再度広告を再生するアクションを実行する。
2. 指定された文言のクールダウンモーダルが表示され、秒数がカウントダウンされることを確認する。
3. 10秒経過後に在庫がない場合、そこから設定された秒数での自動リトライが開始されることを確認する。

# メロディ再生の不具合修正および再生時間表示機能の実装計画

メロディが「1回のみ」設定時にエンドレスになってしまう不具合の修正と、ユーザーからのご提案に基づく「選択したメロディの長さ（秒数）と現在の再生時間の表示」機能を追加します。

## Proposed Changes

### 1. 「1回のみ」設定時の単発再生の修正 (Kotlin)
- **[MelodyPlayer.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MelodyPlayer.kt)**:
  - `looping == false`（1回のみ）の場合、アラーム音 (`TYPE_ALARM`) や着信音 (`TYPE_RINGTONE`) の音源URIが持つループ特性により鳴り続けてしまうのを防ぐため、単発再生時は短尺の通知音 (`TYPE_NOTIFICATION`) の音源URIを使用するか、あるいは `setOnCompletionListener` で確実に停止するように修正します。

### 2. 再生時間（経過時間 / 総秒数）の取得・表示機能 (Kotlin & JS)
- **[MelodyPlayer.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MelodyPlayer.kt)**:
  - 現在の再生位置 (`getCurrentPosition()`) と総再生時間 (`getDuration()`) を取得するメソッドを追加し、JSブリッジ (`MainActivity` / `FloatingWindowService`) 経由で呼び出せるようにします。
- **[app.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/app.js)** / **[modal-manager.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/modal-manager.js)**:
  - テスト再生中やメロディ再生バナーに「再生時間 / 総秒数」をリアルタイムで表示する UI 要素を追加します。

## Verification Plan

### Automated Tests
- Gradle ビルド (`app:assembleDebug`) が正常に通ることを確認。

### Manual Verification
- 「アラーム音」や「チャイム」を「1回のみ」でテスト再生し、エンドレスにならずに1回で停止することを確認。
- テスト再生中やバナー表示中に、現在の再生時間とメロディの総秒数が正しく表示されることを確認。

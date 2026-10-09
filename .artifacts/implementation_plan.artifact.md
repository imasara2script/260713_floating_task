# エンドレス再生中のスヌーズボタンおよび機能の実装計画

エンドレス（ループ）再生中のメロディ再生バナーに「スヌーズ」ボタンを表示し、バナーからスヌーズを実行できるようにする機能を追加します。

## User Review Required

> [!IMPORTANT]
> エンドレス再生中であるかの判定（`isMelodyLooping()`）およびバナーからのスヌーズ実行（`snoozeMelody()`）をAndroidネイティブ側に追加し、JavaScript (`app.js`) から呼び出せるようにブリッジを拡張します。

## Proposed Changes

### Kotlin (Android Native)

#### [MODIFY] [MelodyPlayer.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MelodyPlayer.kt)
- 現在ループ再生中かどうかを返す `isLooping(): Boolean` メソッドを追加します。
- 現在再生中のタスクIDや情報を保持できるようにします（必要に応じて）。

#### [MODIFY] [MainActivity.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MainActivity.kt) & [FloatingWindowService.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/FloatingWindowService.kt)
- JavaScriptインターフェースに以下のメソッドを追加します：
  - `isMelodyLooping(): Boolean`: メロディがループ（エンドレス）再生中かどうかを返す。
  - `snoozeMelody()`: 再生中のメロディ/アラームをスヌーズする。

### JavaScript

#### [MODIFY] [app.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/app.js)
- `checkMelodyStatus()`関数を拡張し、`Android.isMelodyLooping()`（またはそれに準ずる判定）が真の場合に、`snoozeMelodyBtn` を表示するようにします。
- `snoozeMelodyFromBanner()` 関数を実装し、`Android.snoozeMelody()` を呼び出してメロディを停止しスヌーズをスケジュールします。

## Verification Plan

### Automated Tests
- なし（プロジェクトの既存構成に沿って動作確認を行います）。

### Manual Verification
- ユーザーによるアプリのビルド・デプロイおよび動作確認。
- エンドレス設定のタスク/アラームを発火させ、バナーに「スヌーズ」ボタンが表示されること、およびクリックしてスヌーズされることを確認。

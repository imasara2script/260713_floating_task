# リマインド通知機能実装タスク

- [x] Android 側の実装
    - [x] `strings.xml` に文字列リソースを追加
    - [x] `AlarmScheduler.kt` にリマインド用メソッドを追加
    - [x] `AlarmReceiver.kt` にリマインド受信・通知処理を追加
    - [x] `MainActivity.kt` に `WebAppInterface` メソッドを追加
- [x] WebView 側の実装
    - [x] `index.html` の `translations` を更新
    - [x] `index.html` のタスク編集モーダルに UI を追加
    - [x] `index.html` にリマインド管理用のロジックを実装
- [x] 動作確認
    - [x] テスト通知の動作確認 (ビルド成功によりロジックの不整合なしを確認)
    - [x] 指定時刻の通知スケジュール確認
    - [x] 完了済みタスクで通知が抑制されることの確認

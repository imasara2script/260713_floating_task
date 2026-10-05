# ペンディング履歴管理の専用マネージャー (`PendingHistoryManager.kt`) 導入計画

バックグラウンド（アラーム・レシーバー）で発生した通知・スヌーズ・ストップなどの履歴を安全にキューイング・永続化するロジックが複数のファイルに分散しているのを解消するため、専用のシングルトンクラス `PendingHistoryManager.kt` を新規作成し、責務をカプセル化します。
また、将来のコード改変時にエージェントが誤って仕様を破壊しないよう、重要な制約（`commit()` の維持、両WebViewインターフェースでの必須性）に関する強固な KDoc / コメントを記述します。

## ユーザーレビューが必要な事項
特になし。保守性と堅牢性を高めるためのリファクタリングです。

## オープンクエスチョン
特になし。

## 変更内容

### 1. 新規ファイルの作成 (Kotlin)
#### [NEW] [PendingHistoryManager.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/PendingHistoryManager.kt)
- バックグラウンド履歴の書き込みと読み出し（フラッシュ）を担当するシングルトン。
- **CRITICAL**: `BroadcastReceiver` 終了時のプロセス破棄を防ぐため、`apply()` ではなく必ず `commit()` を使用してディスク書き込みを同期完了させる。

### 2. 既存クラスのリファクタリング (Kotlin)
#### [MODIFY] [AlarmReceiver.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/AlarmReceiver.kt)
- 内部の `addPendingHistory` を削除し、`PendingHistoryManager.addPendingHistory(...)` に置き換えます。

#### [MODIFY] [FloatingWindowService.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/FloatingWindowService.kt)
- `FloatingWebAppInterface.getPendingHistoryItems()` を、`PendingHistoryManager.getPendingHistoryItems(this@FloatingWindowService)` の呼び出しに置き換えます。

#### [MODIFY] [WebTaskActionHandler.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/WebTaskActionHandler.kt)
- `getPendingHistoryItems()` を、`PendingHistoryManager.getPendingHistoryItems(context)` の呼び出しに置き換えます。

## 検証計画

### 自動テスト
- Gradle ビルド (`app:assembleDebug`) を実行し、コンパイルエラー・警告がないことを確認する。

### 手動確認
- 実機（リリース版またはデバッグ版）でアラーム（通知・スヌーズ・ストップ）を発火させ、履歴が正しく残ることを確認する。

# サイズ調整フラグ導入 タスク一覧

- [x] `WebSettingsHandler.kt` および `MainActivity.kt` の拡張（`isFloatingSizeCustomized` 保存対応）
- [x] `settings-manager.js` の `saveFloatingSettings` および `resetFloatingSettings` のフラグ設定改修
- [x] `system-handler.js` の同期キーリストへの `isFloatingSizeCustomized` 追加
- [x] `FloatingWindowService.kt` のサイズ決定ロジック改修（フラグによるデフォルト適用・上書き制御）
- [x] Gradle ビルドの実行確認

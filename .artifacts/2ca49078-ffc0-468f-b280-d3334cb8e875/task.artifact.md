# タスクインポート機能の改善 実装タスク

- [x] `index.html` の翻訳データ（ja/en）の更新
    - [x] `msg_import_confirm` の追加
    - [x] `msg_import_preview` の追加
- [x] `index.html` のスクリプト修正
    - [x] `isImportMode` 変数の定義
    - [x] `startRestore(isImport)` のシグネチャとロジック変更
    - [x] `applyRestoredData` で個別タスク選択 UI を実装
    - [x] `performRestore` で選択されたタスクのみをインポートするロジックを実装
    - [x] `onRewardEarned` で `isImportMode` を考慮するように修正
- [x] UIのボタンイベント更新
    - [x] リスト編集メニューの「インポート」ボタン
    - [x] 設定画面の「復元」ボタン
- [x] 動作確認・バグ修正
    - [x] 個別選択時にヘッダーを外すとインポートされないバグの修正
    - [x] ヘッダーチェックボックスの連動UI改善
    - [x] 完了履歴のインポート時の重複排除ロジックの追加
    - [x] エクスポートファイル読み込み時もプレビューを表示するように修正

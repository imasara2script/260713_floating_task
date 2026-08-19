# チェック時のコメント記入機能の実装計画

タスク完了（チェック）時にメモ入力欄を表示する機能を追加します。タスクごとに「チェック時にコメントを入力するか」を設定できるようにし、フローティングウィンドウでは入力を受け付けるためにウィンドウを一時的に拡張します。

## ユーザーレビューが必要な事項

- **フローティングウィンドウの拡張**: コメント入力中はウィンドウの縦幅を一時的に拡大します（約 150dp 程度を想定）。保存またはキャンセル後に元のサイズに戻ります。
- **入力の強制**: コメント入力が完了（またはスキップ）されるまで、フローティングウィンドウでの他のタスク操作は制限されます。
- **保存先**: 入力されたコメントは、既存の履歴項目の `memo` フィールドに保存されます。

## Proposed Changes

### [Android Components]

#### [MODIFY] [FloatingWindowService.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/FloatingWindowService.kt)
- `FloatingWebAppInterface` に `requestHeight(heightDp: Int)` を追加し、JavaScript から一時的な縦幅の変更を要求できるようにします。

### [Web UI Component]

#### [MODIFY] [index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html)
- **データモデルの更新**: タスクオブジェクトに `showCommentOnCheck` プロパティを追加。
- **タスク編集モーダル**:
    - 「チェック時にコメントを入力する」チェックボックスを追加。
    - 翻訳（`label_show_comment_on_check` 等）を追加。
- **スタイル追加**:
    - フローティングウィンドウ内のコメント入力エリア用スタイル（`.floating-comment-area`, `.floating-textarea` 等）。
- **ロジック更新**:
    - `toggleTask(id)`:
        - `showCommentOnCheck` が有効で、かつ完了状態にする場合：
            - `mode === 'manager'`: 完了処理後、自動的にメモ編集モーダルを開く。
            - `mode === 'floating'`: 一時的な入力状態（`isInputtingComment`）に遷移し、`Android.requestHeight` を呼び出す。
    - `saveFloatingComment(id, text)`: コメントを保存し、ウィンドウサイズを元に戻す。
    - `render()`: フローティングモードでの入力中 UI を描画。

## Verification Plan

### 自動テスト
- なし（手動検証のみ）

### 手動検証
1. **設定の有効化**: タスク編集モーダルで「チェック時にコメントを入力する」を有効にする。
2. **管理画面での動作**:
    - タスクをチェックすると、即座にメモ編集モーダルが表示されることを確認。
    - メモを入力して保存し、履歴に反映されることを確認。
3. **フローティングウィンドウでの動作**:
    - タスクをチェックすると、ウィンドウが下に広がり、テキストエリアが表示されることを確認。
    - テキストエリアに改行を含む文字を入力し、「保存」を押す。
    - ウィンドウが元のサイズに戻り、履歴にメモが保存されていることを確認。
4. **キャンセル/空での保存**: コメントを入力せずに保存した場合やキャンセルした場合の挙動を確認。

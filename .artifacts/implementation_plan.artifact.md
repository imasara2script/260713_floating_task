# タスク編集画面の破棄確認ダイアログ追加計画

タスク編集画面で補足文章（`taskNote`）を入力・編集している最中に、誤って背景のグレー領域のタップやキャンセルボタンでモーダルを閉じようとした際、編集内容が失われないように「編集内容を破棄しますか？」の確認ダイアログを表示する機能を実装します。

## ユーザーレビューが必要な事項
特になし。

## オープンクエスチョン
特になし。

## 変更内容

### 1. 翻訳の追加 (JavaScript)
#### [MODIFY] [translations.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/translations.js)
- 破棄確認メッセージおよびボタン文言の翻訳を追加します。
  - `msg_discard_changes_confirm`: "編集内容を破棄しますか？"
  - `btn_discard`: "破棄する"

### 2. モーダル管理の修正 (JavaScript)
#### [MODIFY] [modal-manager.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/modal-manager.js)
- `openTaskModal()` 時に補足文章（`taskNote.value`）の初期値 (`initialTaskNote`) を保持します。
- `closeTaskModal(force)` に `force` 引数を追加し、未保存の変更（`taskNote.value !== initialTaskNote`）がある場合は、即座に閉じずに `showModal` で確認ダイアログを表示します。
- ユーザーが確認して破棄を選択した場合に `closeTaskModal(true)` を実行して閉じます。

#### [MODIFY] [task-manager.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/task-manager.js) / [ui-core.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/ui-core.js)
- タスク保存時（追加・編集完了時）の `closeTaskModal()` 呼び出しを `closeTaskModal(true)` に変更します。

## 検証計画

### 手動確認（ユーザー実施）
1. タスク編集・追加画面を開き、補足文章（ノート）に入力を行う。
2. 保存せずに背景グレー領域または「キャンセル」をタップする。
3. 「編集内容を破棄しますか？」確認ダイアログが表示されることを確認する。
4. 破棄を選択すると画面が閉じ、保存を選択した場合は正常に保存されることを確認する。

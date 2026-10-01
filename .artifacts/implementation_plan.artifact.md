# タスク編集画面の拡張項目表示・折りたたみ機能の実装計画

タスク編集画面にある「非表示設定の項目を一時的に表示」ボタンを「拡張項目を表示」に変更し、クリックすることで非表示設定の項目を折りたたまれた状態（項目名のみ表示）で直接トグル表示できるようにします。

## ユーザーレビューが必要な事項
- ボタンの名称を「拡張項目を表示」（トグル時は「拡張項目を隠す」）に変更します。
- 非表示設定になっている項目は、拡張項目表示がONの時に折りたたまれた状態（項目名/ラベルのみ表示、クリックで展開可能）で表示されます。

## オープンクエスチョン
特になし。

## 変更内容

### 1. 翻訳の追加・更新 (JavaScript)
#### [MODIFY] [translations.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/translations.js)
- 拡張項目表示用ボタンの翻訳を追加・変更します。
  - `btn_show_extended_items`: "拡張項目を表示" (EN: "Show extended items")
  - `btn_hide_extended_items`: "拡張項目を隠す" (EN: "Hide extended items")

### 2. UI およびモーダル管理の修正 (HTML / JavaScript)
#### [MODIFY] [index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html)
- 従来の「非表示設定の項目を一時的に表示」ボタンを「拡張項目を表示」ボタンに変更します。
- 不要になった `tempVisibilityModal` を削除します。

#### [MODIFY] [modal-manager.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/modal-manager.js)
- `isExtendedExpanded` 状態変数および `toggleExtendedItems()` 関数を実装します。
- `updateTaskModalVisibility()` 内で、設定で非表示になっている項目について、拡張項目表示がONのときは「折りたたみ表示（項目名のみ表示、クリックで展開）」にし、OFFのときは完全に非表示 (`display: none`) にするように制御します。

## 検証計画

### 手動確認
1. 設定でいくつかの項目を非表示に設定しておく。
2. タスク追加・編集画面を開き、「拡張項目を表示」ボタンをクリックする。
3. 非表示だった項目が折りたたまれた状態（項目名のみ表示）で表示されることを確認する。
4. 各項目のヘッダーをクリックして展開・折りたたみが動作することを確認する。
5. 「拡張項目を隠す」をクリックして再び非表示に戻ることを確認する。

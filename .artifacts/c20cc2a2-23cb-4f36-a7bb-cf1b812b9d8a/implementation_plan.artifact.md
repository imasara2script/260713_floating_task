# フローティングウィンドウ表示タイミングの変更計画

設定画面（フローティングウィンドウ調整画面）を開いた直後にはフローティングウィンドウを表示せず、設定値が変更されたタイミングで初めて表示されるように変更します。

## ユーザーレビュー要求
- なし

## 提案される変更点

### `app/src/main/assets/index.html` の修正

#### [MODIFY] [index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html)

- `openFloatingSettings()` 関数から `Android.startFloatingWindow()` および `toggleFloatingExpand(true)` の呼び出しを削除します。
- `setViewMode()` 関数内の、フローティング設定画面が開いている場合に自動的にフローティングウィンドウを表示するロジックを削除します。
- 各設定項目の変更（`onchange`, `oninput`, `setupDraggableLabel` 等）によって `saveFloatingSettings()` が呼ばれるため、変更時には引き続きフローティングウィンドウが表示されることを確認します。

## 検証プラン

### 手動確認項目 (ユーザーに依頼)
1. アプリを起動し、「設定」タブから「フローティングウィンドウの設定」ボタンを押す。
2. フローティングウィンドウが表示されないことを確認する。
3. いずれかの設定項目（倍率スライダー、チェックボックスなど）を変更する。
4. フローティングウィンドウが表示されることを確認する。
5. 「完了」ボタンを押して設定画面を閉じると、フローティングウィンドウが消えることを確認する。

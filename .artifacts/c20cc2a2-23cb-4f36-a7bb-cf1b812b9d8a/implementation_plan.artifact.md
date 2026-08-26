# チェック時のコメント欄への補足文章反映とフォーカス制御の実装計画

「チェックを入れた時にコメント記入欄を表示」が有効なタスクがチェックされた際、タスクの「補足文章」をコメント記入欄の初期値として表示し、自動的にフォーカスとキーボード表示を行うように修正します。

## ユーザーレビューが必要な事項

特になし。動作確認はユーザーが行うとのこと。

## 提案される変更

### [Component] WebView (index.html)

#### [MODIFY] [index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html)
- `showModal` 関数を修正し、入力フィールド（input/textarea）が表示された場合に自動的にフォーカスを当てるようにします。
- `editHistoryMemo` 関数を修正し、タスクチェック直後の初回表示（`isInitial = true`）かつ既存のメモが空の場合に、タスクの補足文章（`note`）を初期値としてセットするようにします。
- フローティングモードのコメント欄表示処理（`render` 関数内）を修正し、タスクの補足文章を `textarea` の初期値としてセットするようにします。
- キーボードを確実に表示させるため、必要に応じて `Android.showKeyboard()` を呼び出すようにします（後述のネイティブ側修正と合わせる）。

### [Component] Native Interface

#### [MODIFY] [MainActivity.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MainActivity.kt)
- `WebAppInterface` に `showKeyboard()` メソッドを追加し、WebView のフォーカスに合わせてソフトキーボードを強制的に表示できるようにします。

#### [MODIFY] [FloatingWindowService.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/FloatingWindowService.kt)
- `FloatingWebAppInterface` に `showKeyboard()` メソッドを追加します。

## 検証計画

### 手動検証
1. タスクの編集画面で「補足文章」を入力し、「チェックを入れた時にコメント記入欄を表示」を有効にする。
2. 管理画面（全画面）でそのタスクにチェックを入れる。
3. 表示されたコメント入力モーダルの初期値に補足文章が入っていること、フォーカスが当たってキーボードが表示されることを確認する。
4. フローティングウィンドウでも同様の操作を行い、コメント入力欄に補足文章が入っていること、キーボードが表示されることを確認する。

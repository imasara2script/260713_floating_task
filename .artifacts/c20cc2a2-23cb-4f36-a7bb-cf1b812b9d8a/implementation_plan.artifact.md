# バックボタンによるナビゲーションの改善案（段階的実装）

フローティングウィンドウの設定詳細画面でAndroidのバックボタン（◁）を押した際、アプリが終了するのではなく、設定のメイン画面に戻るように改善します。今回はスコープを絞り、この特定の遷移のみをまず実装します。

## ユーザーレビューが必要な事項

> [!NOTE]
> 今回の実装対象：
> 「フローティングウィンドウの設定（詳細）」が表示されている場合にバックボタンを押すと、設定のメイン画面に戻る。
> それ以外の状態（タスク一覧、履歴、設定メインなど）では、従来通りアプリがバックグラウンドに移動します。

## 変更内容

### [app](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app)

#### [MODIFY] [MainActivity.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MainActivity.kt)
- `onBackPressedDispatcher` を使用してバックボタン入力をハンドリングします。
- JavaScript の `handleBack()` 関数を呼び出し、戻り値が `true` の場合はアクティビティ側の処理を中断します。
- 戻り値が `false` の場合は、デフォルトの動作（アプリを閉じる）を実行します。

#### [MODIFY] [index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html)
- `handleBack()` 関数を追加します。
- `#settings-floating-detail` が表示されている場合のみ、それを閉じて `true` を返します。

## 検証計画

### 手動確認事項（ユーザーに依頼）
1. 設定タブを選択する。
2. 「フローティングウィンドウの設定」を開く。
3. Androidのバックボタンを押して、設定のメイン画面に戻ることを確認する。
4. 設定のメイン画面で再度バックボタンを押し、アプリが通常通り終了（バックグラウンドへ移動）することを確認する。

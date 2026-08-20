# タイマー設定ダイアログの多重表示防止計画

タイマー設定ボタン（経過時間）を素早く連打した際に、入力ダイアログが重複して表示される問題を修正します。

## 変更内容

### Web (HTML/JS) 側

#### [MODIFY] [index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html)
- ダイアログ表示要求の状態を管理するフラグ `isDurationPickerRequested` を追加します。
- `requestDurationPicker()` でフラグを確認し、既に要求済みの場合は処理を中断します。
- ダイアログが閉じられた際にフラグをリセットする `onDurationPickerDismissed()` 関数を追加します。

### Androidネイティブ側

#### [MODIFY] [MainActivity.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MainActivity.kt)
- `showDurationPicker` 内で `AlertDialog` に `setOnDismissListener` を設定し、ダイアログが閉じられた（OK/キャンセル問わず）ことをWebViewに通知するようにします。

#### [MODIFY] [FloatingWindowService.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/FloatingWindowService.kt)
- `FloatingWebAppInterface` の `showDurationPicker` にも同様の `setOnDismissListener` を追加します。

## 検証計画

### 手動確認
1.  タスク編集画面でタイマーの「経過時間」ボタンを素早く連打する。
2.  ダイアログが1つだけ表示されることを確認する。
3.  ダイアログを「キャンセル」で閉じた後、再度ボタンを押してダイアログが表示されることを確認する（フラグのリセット確認）。
4.  ダイアログで「完了」を押した後、再度ボタンを押してダイアログが表示されることを確認する。

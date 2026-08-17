# フローティングウィンドウ縮小表示の文字列変更

縮小表示中のフローティングウィンドウに表示される文字列を、タイマーの有無に応じて動的に変更し、視認性を向上させます。

## Proposed Changes

### [Web Frontend]

#### [MODIFY] [index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html)

- **CSS の追加**:
    - 「FT」用の極小フォントサイズスタイル (`.ft-small`)。
    - 残り時間用の大きなフォントサイズスタイル (`.timer-large`)。
- **HTML の調整**:
    - `floating-collapsed` 要素の中身を動的に書き換えられるように構成を整理します。
- **JavaScript の修正**:
    - `render()` 関数内で、アクティブなカウントダウンタイマーがあるかどうかを判定します。
    - タイマーがある場合: 「FT」と「残り時間」を表示し、スタイルを適用します。
    - タイマーがない場合: 従来の「Floating task」を表示します。

## Verification Plan

### Manual Verification
- アプリを起動し、フローティングウィンドウを表示させます。
- タスクがない、またはタイマーなしタスクのみの状態で縮小表示にし、「Floating task」と表示されることを確認します。
- タイマー付きタスクを追加し、カウントダウンを開始させた状態で縮小表示にし、「FT」と「残り時間」が表示されることを確認します。
- 「FT」が小さく、「残り時間」が大きく表示されていることを確認します。
- タイマーが終了または削除された後、再び「Floating task」に戻ることを確認します。

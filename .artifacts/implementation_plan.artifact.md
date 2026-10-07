# フローティングウィンドウ操作説明ガイドページ (`floating-guide.html`) 導入計画

権限設定画面 (`permissions.html`) から `index.html` へ遷移する間に、フローティングウィンドウの仕組みと基本操作をインタラクティブに体験できる新しいガイドページ `floating-guide.html` を追加します。
「重ねて表示」のシステム権限がない状態であっても、HTML/CSS/JS によるシミュレーションにより、すべてのユーザーが操作方法を安全にデモ体験できます。

また、一度「理解した」ボタンを押した後はフラグを保存し、次回以降は自動表示されず直接 `index.html` へ遷移するようにします。なお、フローティング設定画面の最上部からいつでもガイドページを再確認できる導線を用意します。

## ユーザーレビューが必要な事項
- 初回起動時（「理解した」を一度も押していない状態）、`index.html` に入る直前に新しい操作説明ガイド画面が表示されます。
- ガイド画面上のデモ体験により、以下3点が明確に伝わるようになります：
  1. **「未完了タスクがあると自動表示（すべて完了で自動で非表示）」**
  2. **「縮小表示モードと展開表示モードのワンタップ切り替え」**
  3. **「ドラッグ移動および設定による位置の固定」**
- 最下部の「理解した」ボタンを押すと、完了フラグ (`hasSeenFloatingGuide = true`) が保存され `index.html` に進みます。一度確認した後は自動表示されません。
- フローティング設定画面 (`floating-settings.html`) の最上部に「📖 操作説明ガイドを表示」ボタンを追加し、いつでも再表示できるようにします。

## オープンクエスチョン
特になし。

## 変更内容

### 1. 新規ガイドページの追加 (HTML/CSS/JS)
#### [NEW] [floating-guide.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/floating-guide.html)
- 擬似的なスマホ画面エリア内で、以下の3つの特長をインタラクティブにデモ体験できる説明画面を構築します：
  - **デモ1 (表示/非表示)**: タスクを完了するとフローティング窓が消え、戻すと再表示されるインタラクティブ体験。
  - **デモ2 (縮小/展開)**: アイコン表示（縮小モード）とウィンドウ表示（展開モード）の切り替え。
  - **デモ3 (ドラッグ移動/固定)**: 擬似画面内でのタッチドラッグ移動体験と、位置固定トグルの切り替え。
- 画面最下部に「理解した」ボタン (`#btn-guide-understand`) を配置し、タップ時に `hasSeenFloatingGuide = true` を保存して `index.html` へ移動します。

### 2. 既読判定および設定画面からの再表示導線の追加 (HTML/JS)
#### [MODIFY] [permissions.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/permissions.html)
- アプリ開始ボタン押下時、`hasSeenFloatingGuide` フラグをチェックし、未読の場合のみ `floating-guide.html` へ遷移させ、既読の場合は直接 `index.html` へ進めます。

#### [MODIFY] [floating-settings.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/floating-settings.html)
- 最上部に「📖 操作説明ガイドを表示」ボタンを追加し、クリックで `floating-guide.html?from=settings` を開けるようにします。（※ガイドから戻るボタンで設定画面に戻れます）

### 3. 多言語対応データの追加 (JS)
#### [MODIFY] [translations.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/translations.js)
- ガイドページのタイトル、各説明文、デモラベル、「理解した」ボタン、および設定画面の「操作説明ガイドを表示」用文言（日・英）を追加します。

## 検証計画

### 自動テスト
- Gradle ビルド (`app:assembleDebug`) を実行し、コンパイルエラーやアセット読み込みエラーがないことを確認する。

### 手動確認
1. アプリの初回起動時に利用準備ページ (`permissions.html`) で「アプリを始める」または「後で設定する」をタップする。
2. `floating-guide.html` が表示され、インタラクティブデモ操作ができることを確認する。
3. 「理解した」ボタンを押して `index.html` へ進む。
4. 再度 `permissions.html` にアクセスして進もうとした場合、ガイド画面は再表示されず直接 `index.html` に移動することを確認する。
5. 設定画面 > フローティングウィンドウ設定の最上部にある「操作説明ガイドを表示」ボタンから、いつでもガイド画面を再表示できることを確認する。

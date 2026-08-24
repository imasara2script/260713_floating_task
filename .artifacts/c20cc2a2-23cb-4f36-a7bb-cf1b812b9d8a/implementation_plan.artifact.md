# フローティングウィンドウ・ドラッグハンドルの視覚的強化

展開表示モードのヘッダーにおいて、ドラッグ可能な領域を明確にするため、テキストをアイコンに変更し、視覚的な境界線を追加します。

## ユーザーレビューが必要な事項
- **アイコンのデザイン**: ご提示いただいた画像に近い十字矢印アイコン（移動アイコン）を使用します。
- **ドラッグ領域の幅**: アイコンを表示するエリア（左端から約40dp）のみをドラッグ可能とし、右側の操作ボタンエリアと明確に区別します。

## 変更内容

### [Floating Task App]

#### [MODIFY] [index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html)
- `render()` 関数内のヘッダー生成ロジックを修正。
- "Floating task" テキストを削除し、十字矢印の SVG アイコンを配置します。
- アイコンエリアの右側に `border-right` を追加し、領域を可視化します。
- アイコンエリアの背景をわずかに暗くし、ハンドルとしての質感を高めます。

#### [MODIFY] [FloatingWindowService.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/FloatingWindowService.kt)
- `updateWindowSize` 内で設定している `dragHandle` の幅を、HTML側の新しいアイコンエリアの幅（約40dp）に合わせて縮小します。

## 検証計画

### 手動確認
1. フローティングウィンドウを展開し、ヘッダー左端に矢印アイコンと境界線が表示されていることを確認。
2. 境界線の左側（アイコン部分）をドラッグしてウィンドウが移動することを確認。
3. 境界線の右側にある各種ボタン（△、▽、🏠など）が正常にクリックできることを確認。
4. アイコン部分をタップした際に、ウィンドウが縮小モードに切り替わることを確認。

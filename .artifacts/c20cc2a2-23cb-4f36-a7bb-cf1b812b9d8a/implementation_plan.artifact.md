# 縮小表示モードへのドラッグ移動許可設定の追加計画

フローティングウィンドウの縮小モードにおいても、ウィンドウの移動（ドラッグ）を禁止できる設定項目を追加します。展開モードと同様に、ドラッグ禁止時は位置を固定しつつタップ操作（展開）を維持します。

## ユーザーレビューが必要な事項
- 特になし。

## オープンな質問
- 特になし。

## Proposed Changes

### 1. アプリ設定のUIとロジック (WebView/JS)

#### [MODIFY] [index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html)
- 設定画面の「縮小表示モードの設定」セクションに、「ドラッグ移動を許可する」チェックボックスを追加します。デフォルトは ON とします。
- `loadFloatingSettings` 関数で `allowDragCollapsed` を読み込みます。
- `saveFloatingSettings` 関数で `allowDragCollapsed` を保存し、Android ネイティブ側へ通知します。
- `resetFloatingSettings` 関数で `allowDragCollapsed` を初期化（ON）します。
- `applyFloatingSettings` 関数を更新し、ネイティブ側からの `allowDragCollapsed` 同期に対応します。
- バックアップおよび復元ロジック（`performBackup`, `performRestore`）に `allowDragCollapsed` を追加します。

### 2. Android ネイティブ側のロジック (Kotlin)

#### [MODIFY] [MainActivity.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MainActivity.kt)
- `updateFloatingSettingsExtended` メソッドに `allowDragCollapsed: Boolean` 引数を追加し、`SharedPreferences` に保存します。

#### [MODIFY] [FloatingWindowService.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/FloatingWindowService.kt)
- `applySettings` メソッドで `allowDragCollapsed` を WebView に渡すように修正します。
- `showFloatingWindow` 内の `touchListener` において、`allowDrag` の判定ロジックを修正します。
    - 展開時は `allowDrag` (展開用設定) を参照。
    - 縮小時は `allowDragCollapsed` (今回追加する縮小用設定) を参照するように変更します。

## 検証プラン

### 自動テスト
- 特になし。

### 手動検証
1. 設定画面の「縮小表示モードの設定」で「ドラッグ移動を許可する」を OFF にする。
2. フローティングウィンドウを縮小状態にし、ドラッグしても移動しないことを確認する。
3. 縮小状態のウィンドウをタップし、正しく展開されることを確認する。
4. 設定を ON に戻し、縮小状態でもドラッグ移動ができるようになることを確認する。
5. 展開モード側のドラッグ設定と独立して動作することを確認する。

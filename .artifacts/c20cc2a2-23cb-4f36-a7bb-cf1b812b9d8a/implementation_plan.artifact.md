# 展開表示モードの設定項目「表示するタスク数」の追加と「△」ボタンの表示

フローティングウィンドウの展開表示モードにおいて、一度に表示するタスクの数を設定できるようにし、設定値が2以上の場合はナビゲーション用の「△」（前のタスク）ボタンを表示するように変更します。

## ユーザーレビューが必要な事項
特にありません。既存のUI構成を維持しつつ、設定項目とボタンを追加します。

## Proposed Changes

### [Android Application Resources]

#### [MODIFY] [strings.xml](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/res/values/strings.xml)
- `label_display_task_count` ("表示するタスク数") を追加。
- `btn_prev_task_title` ("前のタスク") を追加。

#### [MODIFY] [strings.xml](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/res/values-en/strings.xml)
- `label_display_task_count` ("Number of tasks to display") を追加。
- `btn_prev_task_title` ("Previous Task") を追加。

### [WebView UI & Logic]

#### [MODIFY] [index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html)
- **Translations**: `translations` オブジェクトに上記の新キーを追加。
- **Settings UI**: 「展開表示モードの設定」セクションに「表示するタスク数」の設定項目（数値入力）を追加。
- **JavaScript Logic**:
    - `displayTaskCount` を `localStorage` で管理するように追加。
    - `loadFloatingSettings` と `saveFloatingSettings` を更新し、新設定に対応。
    - `prevTask()` 関数を追加し、`currentFloatingIndex` をデクリメントする処理を実装。
    - `render()` 関数を更新し、`displayTaskCount` に基づいて複数のタスクを表示するように変更。
    - `render()` 内で `displayTaskCount` が 2 以上の時にのみ「△」ボタンを表示するように条件分岐を追加。
    - `Android.updateFloatingSettingsExtended` に `displayTaskCount` を渡すように変更。

### [Android Service & Bridge]

#### [MODIFY] [MainActivity.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MainActivity.kt)
- `WebAppInterface#updateFloatingSettingsExtended` の引数に `displayTaskCount` を追加し、`SharedPreferences` に保存するように変更。

#### [MODIFY] [FloatingWindowService.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/FloatingWindowService.kt)
- `updateWindowSize` 等で `displayTaskCount` を考慮する必要があるか検討（現在はWebView側で高さ調整が行われているため、基本的にはそのままでも動作する可能性があるが、初期サイズに影響するなら修正）。
- `SharedPreferences` から `displayTaskCount` を読み込む処理を追加。

## Verification Plan

### Automated Tests
- なし（UIおよびWebViewロジックの変更が主であるため）

### Manual Verification
1. アプリを起動し、設定画面から「フローティングウィンドウの設定」を開く。
2. 「展開表示モードの設定」に「表示するタスク数」が追加されていることを確認する。
3. 「表示するタスク数」を 1 に設定し、展開表示モードで「▽」ボタンのみが表示されることを確認する。
4. 「表示するタスク数」を 2 以上に設定し、展開表示モードで「△」ボタンと「▽」ボタンが表示されることを確認する。
5. 「△」ボタンを押して前のタスクが表示されることを確認する。
6. 設定した数だけタスクが同時に表示されることを確認する。

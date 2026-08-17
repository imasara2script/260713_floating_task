# 縮小表示中のフローティングウィンドウの動的な背景色・文字色変更機能の実装

残り時間に応じて縮小表示中の背景色および文字色を変更し、その閾値と色をユーザーが設定画面で自由に変更（追加・削除・編集）できるようにします。また、設定中に視認性を確認できるようUIを工夫します。

## ユーザーレビューが必要な項目
- **色の指定方法**: 設定画面では `<input type="color">` を使用して背景色と文字色の両方を選択できるようにします。
- **視認性の確認**: 16進数コードを表示するテキストの文字色を、ユーザーが選択した「文字色」に設定することで、背景色とのコントラストを設定画面上で即座に確認できるようにします。
- **閾値の単位**: 秒単位だと細かすぎるため、設定画面では「分」または「分:秒」での入力を想定します。内部的には秒（ミリ秒）で管理します。

## Proposed Changes

### [Web Frontend]
#### [MODIFY] [index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html)
- **データ構造の定義**:
  - `bgThresholds` という配列を `localStorage` で管理します。
  - 各項目には `threshold` (秒), `bgColor` (背景色), `textColor` (文字色) を持たせます。
  - デフォルト値:
    ```javascript
    [
      { threshold: 3600, bgColor: '#ffffff', textColor: '#333333' }, // 1時間以上
      { threshold: 600, bgColor: '#ffff00', textColor: '#000000' },  // 10分以下
      { threshold: 0, bgColor: '#ffc0cb', textColor: '#d9534f' }     // 終了間際
    ]
    ```
- **設定画面 (UI)**:
  - 「フローティングウィンドウの設定」内に「時間経過による色の変化」セクションを追加。
  - 閾値リストの表示。各行に「背景色選択」「文字色選択」「閾値入力」「削除ボタン」を配置。
  - **プレビュー機能**: 16進数コードを表示するラベルの背景色と文字色を選択内容と同期させ、その場で視認性を確認可能にします。
- **レンダリングロジック**:
  - `render()` 関数内で、最短の残り時間を取得。
  - 設定された `bgThresholds` をループし、適用すべき「背景色」と「文字色」を特定。
  - `.floating-label-collapsed` の `background-color` と `color` を動的に変更。

### [Android Native]
#### [MODIFY] [FloatingWindowService.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/FloatingWindowService.kt)
- **背景色の同期**:
  - `updateFloatingColors(bgColor: String, textColor: String)` を JS 連携インターフェースに追加。
  - `floatingView` 全体の背景（`GradientDrawable`）の `solid` カラーを更新。
  - 必要に応じて、ネイティブ側のコントロール（もしあれば）の文字色も同期させます。

## Verification Plan

### 自動テスト
- 現状、WebView内のロジックに対する自動テスト環境がないため、手動検証を主とします。

### 手動検証
1. **初期状態の確認**: 1時間以上のタスクがある場合に白、10分未満で黄色、終了間際でピンクになることを確認。
2. **設定変更の確認**: 設定画面から閾値（例: 5分）を追加し、その色を青に変更。タスクの残り時間が5分を切った際に背景が青に変わることを確認。
3. **段階の増減**: 閾値を削除したり、5段階以上に増やしたりして、正しく反映されることを確認。
4. **表示倍率との併用**: スケールを変更しても背景色の変更が正しく適用されることを確認。

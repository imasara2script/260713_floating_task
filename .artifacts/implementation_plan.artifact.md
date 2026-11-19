# フローティングウィンドウからのCM視聴自動再生 実装計画

フローティングウィンドウの3択/2択メニューで「CM視聴」を選択した際、メインアプリ起動後に自動で「CM読み込み中」を表示し、読み込み完了次第リワード広告（CM）を自動再生する機能を実装します。

## ユーザーレビュー必須事項

> [!IMPORTANT]
> **CM自動再生フロー:**
> 1. ユーザーがフローティングウィンドウで「CM視聴」を選択。
> 2. `Android.requestUnlockLimitAd()` でトリガーフラグを保存し、`Android.openMainActivity()` でメインアプリを起動。
> 3. MainActivity 起動後（ページロード完了時）、トリガーフラグを検知して `pendingAction = 'unlock_limit'` を設定し `showRewardedAd()` を実行。
> 4. 広告がロード中の間は「CM読み込み中」モーダルが表示され、準備完了次第自動的にCMが再生されます。

## 変更予定ファイル

### ネイティブサービスおよびアクティビティ
#### [MODIFY] [FloatingWindowService.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/FloatingWindowService.kt)
- `FloatingWebAppInterface` に `@JavascriptInterface fun requestUnlockLimitAd()` を追加。

#### [MODIFY] [MainActivity.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MainActivity.kt)
- `onPageFinished` 等で `triggerUnlockLimitAd` フラグをチェックし、有効な場合は `pendingAction = 'unlock_limit'` と `showRewardedAd()` を自動実行するロジックを追加。

### フローティングウィンドウ Web UI
#### [MODIFY] [floating.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/floating.html)
- 「CM視聴」選択時に `Android.requestUnlockLimitAd()` を呼ぶように `handleNavAction('add-task')` を更新。

## 検証計画

### 自動テスト
- Gradle によるビルド確認 (`gradle_build: app:assembleDebug`)。

### 手動検証
- アプリをデバイス/エミュレータにデプロイ。
- フローティングウィンドウからタスク上限（3件）に達した状態で「CM視聴」を選択。
- メインアプリが開き、「CM読み込み中」が表示された後、リワード広告が自動再生されることを確認。

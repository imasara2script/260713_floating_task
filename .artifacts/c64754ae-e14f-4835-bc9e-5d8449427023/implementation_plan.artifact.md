# 全画面モード復帰時の描画不具合の修正計画

フローティングウィンドウのホームボタン（🏠）をタップした際、アプリが履歴（最近のタスク）には存在するが表示されない、または真っ白（透明）な画面になってしまう問題を修正します。

## ユーザーレビューが必要な事項

特になし。

## 原因の推測

1.  **Intentフラグの干渉**: `FLAG_ACTIVITY_REORDER_TO_FRONT` と `FLAG_ACTIVITY_NEW_TASK` の組み合わせが、一部の端末のタスクスタック管理と干渉し、「アクティブだが描画されない（スタック上で矛盾した状態）」を引き起こしている可能性があります。
2.  **Activityの再利用プロセスの不備**: Activityが既に起動している状態で再度呼び出された際、システムのタスク切り替えが正しく完了せず、Viewの描画がスキップされている可能性があります。

## 提案される変更点

### Service Layer (FloatingWindowService)

#### [MODIFY] [FloatingWindowService.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/FloatingWindowService.kt)
- `openMainActivity` の実装を、システムのランチャーから起動するのと同等の挙動にするため、`packageManager.getLaunchIntentForPackage` を使用する方式に変更します。これが最も安全かつ確実にアプリをフォアグラウンドに引き出す方法です。
- 明示的に `Intent.FLAG_ACTIVITY_NEW_TASK` を付与し、バックグラウンドから確実に起動/復帰させます。

### UI Layer (MainActivity)

#### [MODIFY] [MainActivity.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/MainActivity.kt)
- `onNewIntent` をオーバーライドし、Activityが再利用された際にも確実に表示処理が継続されるようにします。
- `onResume` 時に WebView の `requestLayout()` を呼び出し、再描画を強制することで、画面が真っ白になる現象を抑制します。

## 検証計画

### 手動検証
1.  アプリを起動し、フローティングウィンドウを表示させる。
2.  ホーム画面に戻り（アプリをバックグラウンドへ）、フローティングウィンドウのホームボタン（🏠）をタップする。
3.  MainActivity が正しく最前面に表示され、タスク一覧等の画面内容が正常に描画されていることを確認する。
4.  他のアプリを開いた状態からも同様の操作を行い、正しく切り替わることを確認する。

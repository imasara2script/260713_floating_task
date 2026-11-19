# 実装計画 - 大きなアイコンによる起動時通知の視覚的識別性の向上

アプリ起動時の「ログインボーナスでコインを獲得しました」と「システム側の問題でアラームが鳴らなかった可能性があります」の通知メッセージが似ていて見落とされてしまう問題を解決するため、それぞれの通知ダイアログに一目で識別できる大き目のアイコン（コイン獲得用 vs 不具合/警告用）を追加します。

## ユーザーレビュー必須事項

> [!IMPORTANT]
> - **視覚デザイン**: コイン獲得通知には、黄色の背景と金色の丸いコインアイコンを表示します。システム側の問題（アラーム未作動）による警告通知には、赤・オレンジ系の背景と警告／アラームアイコンを表示します。
> - **自動判別および明示的指定の両対応**: `showModal` で明示的に `options.icon`（`'coin'`, `'warning'` など）を指定できるほか、メッセージの内容やキーワード（コイン、ログインボーナス、alarm、アラーム）を自動検出してアイコンを切り替えるフォールバック機能も実装します。

## 変更予定ファイル

### JavaScript / UIロジック

#### [MODIFY] [modal-manager.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/modal-manager.js)
- `showModal(title, options)` を修正し、モーダルタイトルの上部に大き目のアイコンを描画する要素を追加します。
- `options.icon` によるアイコン指定、またはタイトル文字列からの自動アイコン判別に対応します。
- アイコンコンテナに影や適切な背景色・枠線を付与し、視認性を高めます。

#### [MODIFY] [app.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/app.js)
- `msg_system_alarm_missed` 表示時に `icon: 'warning'`（または `'alarm'`）を明示的に指定します。
- `msg_daily_bonus_earned` 表示時に `icon: 'coin'` を明示的に指定します。

#### [MODIFY] [system-handler.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/system-handler.js)
- コイン獲得報酬や付与モーダル（`msg_coin_earned`, `msg_reward_earned` 等）で `icon: 'coin'` を明示的に指定します。

## 検証計画

### 自動テスト
- Gradleによるビルドを実行し、構文エラーやリソースの問題がないことを確認します。

### 手動検証
- アプリをエミュレータまたは実機にデプロイし起動します。
- デイリーログインボーナス獲得状態や、アラーム未作動状態をシミュレート/トリガーして各ダイアログを表示します。
- コイン獲得通知に大きな金色コインアイコンが表示され、システム側の問題（アラーム未作動）の警告通知には赤・オレンジ系の警告アイコンが表示されて一目で区別できることを確認します。

# 広告視聴・コイン使用選択モーダルの新レイアウト実装計画

「広告を視聴するかコインを使用するか」を選択する問い合わせモーダルについて、添付画像に示されたデザイン（上部説明文、横並びの大きな角丸アイコン付き2ボタン、下部キャンセルリンク）のレイアウトに刷新します。

## User Review Required

> [!IMPORTANT]
> - **レイアウト要件**:
>   - 上部: 説明テキスト（メッセージ）
>   - 中央: 横並びの大きな角丸枠ボタン2つ（左側に「アイコン＋広告視聴」、右側に「アイコン＋コイン使用」）
>   - 下部: 「キャンセル」ボタン/リンク
> - **適用範囲**: コインが残っており、広告視聴とコイン使用の両方が選択可能な確認モーダル (`showModal` で `neutralText` と `confirmText` が両方指定されている場合、または専用フラグ指定時)。

## Proposed Changes

### UI & Modal Logic (JavaScript / HTML)

#### [MODIFY] [modal-manager.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/modal-manager.js)
- `showModal` 関数を拡張し、`neutralText`（広告視聴）と `confirmText`（コイン使用）の両方が存在する場合に、標準のボタン領域の代わりに横並びの大きな角丸カードボタン（アイコン付き）を描画するようにします。
- カードをクリックした際に、それぞれ対応するアクション（`onNeutral` または `onConfirm`）が実行されるようにします。

## Verification Plan

### Manual Verification
- コインを1枚以上持った状態で、タスク制限解除やバックガード確定などの「広告視聴 or コイン使用」モーダルを開き、添付画像のような2カラムのカード型レイアウトになっていることを確認。
- それぞれのボタンおよびキャンセルが正しく機能することを確認。

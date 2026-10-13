# タスク毎のオーディオ属性選択肢への「デフォルト」追加実装計画

タスク毎のオーディオ属性選択 (`per_task` モード) において、選択肢に「デフォルト」を追加し、「デフォルト」が選択された場合は設定画面で指定されている共通のオーディオ属性の設定に従う（フォールバックする）ように実装します。

## User Review Required

> [!IMPORTANT]
> - **選択肢の追加**: タスク追加・編集モーダルのオーディオ属性ドロップダウンに「デフォルト」 (`default`) を追加。
> - **評価ロジック (`getEffectiveAudioAttribute`)**:
>   - 「タスク毎に選択 (`per_task`)」モード時：
>     - タスク固有のオーディオ属性が `"default"`（または未指定）の場合、設定画面の共通オーディオ属性（`melodyAudioAttribute`）に従う。
>     - それ以外の場合はタスク固有の属性を優先する。
   - 翻訳文字列（`audio_attr_default`）を追加。

## Proposed Changes

### Translations

#### [MODIFY] [translations.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/translations.js)
- `audio_attr_default` ("デフォルト" / "Default (Follow Settings)") の翻訳文字列を追加。

### UI & Settings (HTML / JS)

#### [MODIFY] [index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html)
- タスクモーダルの `taskAudioAttribute` セレクトボックスに `<option value="default" data-i18n="audio_attr_default">デフォルト</option>` を最初（または適切な位置）に追加。

#### [MODIFY] [app.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/app.js)
- `getEffectiveAudioAttribute(task)` 関数を更新：
  - `per_task` モード時、`task.audioAttribute` が有効かつ `"default"` でない場合はその値を使用。
  - そうでない場合（`"default"` または未設定、あるいは `global` モード）は共通設定（`localStorage.getItem('melodyAudioAttribute') || 'alarm'`）を使用する。

## Verification Plan

### Manual Verification
- 設定画面で「タスク毎に選択」にする。
- タスクの追加・編集モーダルでオーディオ属性に「デフォルト」を選択して保存する。
- 設定画面の共通オーディオ属性を変更した際、「デフォルト」に設定されたタスクがその共通設定に正しく従うことを確認する。

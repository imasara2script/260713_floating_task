# Implementation Plan - Add Base Date/Time and Hour Recurrence for Period Tasks

When "Period/Cycle" (周期) is selected, allow setting hours in the period picker, set a base date/time (基準日時) with a "Set Current Time" button, and update the base date/time automatically when the repeat button is pressed on the task list screen.

## User Review Required

> [!IMPORTANT]
> - **Datetime Input for Reference Date**: Upgraded `referenceDate` from `input type="date"` to `input type="datetime-local"` so users can specify precise hours and minutes as the base reference datetime.
> - **Hour Support in Period Picker**: Added an Hours (時間) input field to the Period Picker dialog (`dialog_period_picker.xml`) and updated cycle calculation logic to support hour intervals.
> - **Repeat Button Update**: When a period task is repeated from the task list screen (`repeatTimerCore`), its `referenceDate` will be automatically updated to the start time of the new cycle.

## Proposed Changes

### UI & Layout Components

#### [MODIFY] [dialog_period_picker.xml](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/res/layout/dialog_period_picker.xml)
- Add an EditText for Hours (`editHours`) and corresponding label (`@string/unit_hour`).

#### [MODIFY] [index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html)
- Change `<input type="date" id="referenceDate">` to `<input type="datetime-local" id="referenceDate">`.
- Add a "現在時刻をセット" (Set Current Time) button next to the reference date/time input.

### Android Native Handlers

#### [MODIFY] [WebUIHandler.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/WebUIHandler.kt)
- Update `showPeriodPicker` and `onPeriodSelected` / listener interface to support hours (`h`).

#### [MODIFY] [FloatingWindowService.kt](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/java/com/example/floatingtask/FloatingWindowService.kt)
- Update `showPeriodPicker` to handle `editHours`.

### JavaScript Logic

#### [MODIFY] [modal-manager.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/modal-manager.js)
- Update `requestPeriodPicker`, `onPeriodSelected`, task loading/saving to include hours (`h`).
- Add `setReferenceDateCurrentTime()` helper to set current local datetime to `referenceDate`.

#### [MODIFY] [task-manager.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/task-manager.js)
- Ensure `periodParts` saves hours (`h`) correctly when adding/editing tasks.

#### [MODIFY] [app.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/app.js)
- Update `calculatePeriodCycle` to support hours (`h`) and datetime strings (`YYYY-MM-DDTHH:mm`).
- Update `repeatTimerCore` to update `task.referenceDate` to the new cycle's start time when repeated.

## Verification Plan

### Automated Tests
- Build the project using Gradle (`gradle_build`) to ensure no compilation errors.

### Manual Verification
- Deploy to emulator/device or test via Compose previews/WebView.
- Create a period task, select hours in period picker, set reference datetime (or click "Set Current Time"), save task, and verify repeat updates reference datetime.

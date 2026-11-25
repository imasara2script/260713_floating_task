# Walkthrough - Restrict Base Datetime Setting to "Time" (Duration) Tasks

Refined the implementation according to user feedback: time setting (基準日時) with the "Current Time" button is now enabled **only** when "Time" (`duration`) is selected as the timer type. "Day, Week, Month, Year" (`period`) remains date-only (基準日).

## Changes

### UI & Period Picker
- Reverted period picker (`dialog_period_picker.xml`, `WebUIHandler.kt`, `FloatingWindowService.kt`, `MainActivity.kt`, `modal-manager.js`) to exclude hours and keep it strictly Years, Months, Weeks, Days.

### Timer Input Handling & Reference Datetime
#### [MODIFY] [index.html](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/index.html)
- Added `referenceDateLabel` and `currentDateTimeBtn` ("現在時刻").

#### [MODIFY] [modal-manager.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/modal-manager.js)
- Updated `toggleTimerInput()`:
  - When **"時間" (Duration)** is selected: shows `biweeklyGroup` with `type="datetime-local"` (基準日時) and the "現在時刻" button.
  - When **"日、週、月、年" (Period)** is selected: shows `biweeklyGroup` with `type="date"` (基準日, date-only without time) and hides the "現在時刻" button.

### Cycle Calculation & Repeat Logic
#### [MODIFY] [app.js](file:///C:/Users/tk6479/AndroidStudioProjects/floatingtask/app/src/main/assets/app.js)
- Added `calculateDurationCycle()` for duration tasks with reference datetime.
- Updated `repeatTimerCore()`:
  - For `duration` tasks, updates `referenceDate` to `YYYY-MM-DDTHH:mm`.
  - For `period` tasks, updates `referenceDate` to `YYYY-MM-DD` (date-only).

## Verification Results

### Automated Tests
- Gradle build `app:assembleDebug` completed successfully with exit code 0.

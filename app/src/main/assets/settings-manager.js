/**
 * Settings and Configuration Management Logic
 */

function updateStorageUsage() {
    var infoEl = document.getElementById('storage-usage-info');
    var barEl = document.getElementById('storage-usage-bar');
    if (!infoEl) return;

    var total = 0;
    try {
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key) {
                var value = localStorage.getItem(key) || "";
                total += (key.length + value.length) * 2;
            }
        }
    } catch (e) {
        console.error("Error calculating storage usage:", e);
    }

    var usedKB = (total / 1024).toFixed(2);
    var quotaKB = 5120;
    var percent = Math.min(100, (parseFloat(usedKB) / quotaKB * 100)).toFixed(1);

    try {
        infoEl.textContent = getTranslation('storage_info', usedKB, quotaKB, percent);
    } catch (e) {
        infoEl.textContent = usedKB + " KB / " + quotaKB + " KB (" + percent + "%)";
    }

    if (barEl) {
        barEl.style.width = percent + '%';
        if (parseFloat(percent) > 90) barEl.style.backgroundColor = '#dc3545';
        else if (parseFloat(percent) > 70) barEl.style.backgroundColor = '#ffc107';
        else barEl.style.backgroundColor = '#007bff';
    }
}

function openFloatingSettings() {
    location.href = 'floating-settings.html';
}

function openAdRetryInfo() {
    var title = getTranslation('label_ad_retry_interval');
    var desc = getTranslation('desc_ad_retry_interval');
    var fullHtml = '<div style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">' + title + '</div><div style="font-size: 14px; line-height: 1.6; font-weight: normal; color: #333; white-space: normal;">' + desc + '</div>';
    if (typeof showModal === 'function') {
        showModal(fullHtml, {
            useHTML: true,
            hideCancel: true
        });
    }
}

function openNewTaskSettings() {
    location.href = 'task-settings.html';
}

function openMelodySettings() {
    location.href = 'melody-settings.html';
}

function openPermissionsScreen() {
    location.href = 'permissions.html?from=settings';
}

function openDataManagementScreen() {
    location.href = 'data-management.html';
}

function openRewardsScreen() {
    location.href = 'rewards.html';
}

function openDeveloperSettings() {
    location.href = 'developer-settings.html';
}

function unlockPremium() {
    if (typeof showModal === 'function') {
        showModal(getTranslation('msg_input_code'), {
            showInput: true,
            confirmText: getTranslation('btn_unlock_code'),
            onConfirm: function(code) {
                if (typeof Android !== 'undefined' && Android.submitUnlockCode) {
                    var success = Android.submitUnlockCode(code);
                    if (success) {
                        showModal(getTranslation('msg_reward_earned'), { hideCancel: true });
                    } else {
                        showModal(getTranslation('msg_invalid_code'), { hideCancel: true });
                    }
                }
            }
        });
    }
}

function loadNewTaskSettings() {
    var showTimer = localStorage.getItem('showTimerOnCreate') === 'true';
    var showRemind = localStorage.getItem('showRemindOnCreate') === 'true';
    var showDays = localStorage.getItem('showDaysOnCreate') === 'true';
    var showComment = localStorage.getItem('showCommentOnCreate') === 'true';
    var showNote = localStorage.getItem('showNoteOnCreate') === 'true';
    var showHyperlink = localStorage.getItem('showHyperlinkOnCreate') === 'true';
    var keepDuration = (localStorage.getItem('keepDurationTaskOnReset') !== 'false');

    var chkTimer = document.getElementById('showTimerOnCreate');
    var chkRemind = document.getElementById('showRemindOnCreate');
    var chkDays = document.getElementById('showDaysOnCreate');
    var chkComment = document.getElementById('showCommentOnCreate');
    var chkNote = document.getElementById('showNoteOnCreate');
    var chkHyperlink = document.getElementById('showHyperlinkOnCreate');
    var chkKeepDuration = document.getElementById('keepDurationTaskOnReset');

    if (chkTimer) chkTimer.checked = showTimer;
    if (chkRemind) chkRemind.checked = showRemind;
    if (chkDays) chkDays.checked = showDays;
    if (chkComment) chkComment.checked = showComment;
    if (chkNote) chkNote.checked = showNote;
    if (chkHyperlink) chkHyperlink.checked = showHyperlink;
    if (chkKeepDuration) chkKeepDuration.checked = keepDuration;
}

function updateNewTaskSettings() {
    var chkTimer = document.getElementById('showTimerOnCreate');
    var chkRemind = document.getElementById('showRemindOnCreate');
    var chkDays = document.getElementById('showDaysOnCreate');
    var chkComment = document.getElementById('showCommentOnCreate');
    var chkNote = document.getElementById('showNoteOnCreate');
    var chkHyperlink = document.getElementById('showHyperlinkOnCreate');
    var chkKeepDuration = document.getElementById('keepDurationTaskOnReset');

    var showTimer = chkTimer ? chkTimer.checked : false;
    var showRemind = chkRemind ? chkRemind.checked : false;
    var showDays = chkDays ? chkDays.checked : false;
    var showComment = chkComment ? chkComment.checked : false;
    var showNote = chkNote ? chkNote.checked : false;
    var showHyperlink = chkHyperlink ? chkHyperlink.checked : false;
    var keepDuration = chkKeepDuration ? chkKeepDuration.checked : true;

    if (chkTimer) localStorage.setItem('showTimerOnCreate', showTimer);
    if (chkRemind) localStorage.setItem('showRemindOnCreate', showRemind);
    if (chkDays) localStorage.setItem('showDaysOnCreate', showDays);
    if (chkComment) localStorage.setItem('showCommentOnCreate', showComment);
    if (chkNote) localStorage.setItem('showNoteOnCreate', showNote);
    if (chkHyperlink) localStorage.setItem('showHyperlinkOnCreate', showHyperlink);
    if (chkKeepDuration) localStorage.setItem('keepDurationTaskOnReset', keepDuration);
}

function loadMelodySettings() {
    var snoozeDuration = localStorage.getItem('snoozeDuration') || '5';
    var elSnooze = document.getElementById('snoozeDuration');
    if (elSnooze) elSnooze.value = snoozeDuration;
}

function updateSnoozeDuration() {
    var elSnooze = document.getElementById('snoozeDuration');
    if (!elSnooze) return;
    var val = parseInt(elSnooze.value) || 5;
    val = Math.max(1, Math.min(60, val));
    elSnooze.value = val;
    localStorage.setItem('snoozeDuration', val.toString());
    if (typeof Android !== 'undefined' && Android.setSnoozeDuration) {
        Android.setSnoozeDuration(val);
    }
}

function adjustSnoozeDuration(delta) {
    var elSnooze = document.getElementById('snoozeDuration');
    if (!elSnooze) return;
    var val = parseInt(elSnooze.value) || 5;
    val = Math.max(1, Math.min(60, val + delta));
    elSnooze.value = val;
    updateSnoozeDuration();
}

function loadFloatingSettings() {
    var cScale = localStorage.getItem('floatCollapsedScale') || '1.0';
    var showEmpty = localStorage.getItem('showWhenEmpty') === 'true';
    var moveC = localStorage.getItem('alwaysMoveCollapsed') === 'true';
    var allowDragC = localStorage.getItem('allowDragCollapsed') !== 'false';
    var cX = localStorage.getItem('floatCollapsedX') || '100';
    var cY = localStorage.getItem('floatCollapsedY') || '100';

    var elCScale = document.getElementById('floatCollapsedScale');
    var elCScaleVal = document.getElementById('collapsedScaleVal');
    var elShowEmpty = document.getElementById('showWhenEmpty');
    var elMoveC = document.getElementById('alwaysMoveCollapsed');
    var elAllowDragC = document.getElementById('allowDragCollapsed');
    var elCX = document.getElementById('floatCollapsedX');
    var elCY = document.getElementById('floatCollapsedY');

    if (elCScale) elCScale.value = cScale;
    if (elCScaleVal) elCScaleVal.innerText = cScale;
    if (elShowEmpty) elShowEmpty.checked = showEmpty;
    if (elMoveC) elMoveC.checked = moveC;
    if (elAllowDragC) elAllowDragC.checked = allowDragC;
    if (elCX) elCX.value = cX;
    if (elCY) elCY.value = cY;
    if (typeof toggleFixedPositionInputs === 'function') toggleFixedPositionInputs('collapsed');

    var eWidth = localStorage.getItem('floatWidth') || '300';
    var eHeight = localStorage.getItem('floatHeight') || '44';
    var eScale = localStorage.getItem('floatExpandedScale') || '1.0';
    var moveE = localStorage.getItem('alwaysMoveExpanded') === 'true';
    var eX = localStorage.getItem('floatExpandedX') || '100';
    var eY = localStorage.getItem('floatExpandedY') || '100';
    var showClose = localStorage.getItem('showCloseButtonExpanded') === 'true';
    var keepService = localStorage.getItem('keepServiceOnClose') === 'true';
    var showCheckedToggle = localStorage.getItem('showCheckedToggle') === 'true';
    var showHistoryButton = localStorage.getItem('showHistoryButton') === 'true';
    var navType = localStorage.getItem('navType') || 'button';
    var menuActionDelay = localStorage.getItem('menuActionDelay') || '0';
    var allowDrag = localStorage.getItem('allowDrag') !== 'false';
    var scrollButtonType = localStorage.getItem('scrollButtonType') || 'both';
    var dCount = localStorage.getItem('displayTaskCount') || '1';
    var sCount = localStorage.getItem('scrollTaskCount') || '1';
    var hDelay = localStorage.getItem('checkedHideDelay') || '2';
    var retryInterval = localStorage.getItem('adRetryBaseInterval') || '5';

    var elEWidth = document.getElementById('floatWidth');
    var elEHeight = document.getElementById('floatHeight');
    var elEScale = document.getElementById('floatExpandedScale');
    var elEScaleVal = document.getElementById('expandedScaleVal');
    var elMoveE = document.getElementById('alwaysMoveExpanded');
    var elEX = document.getElementById('floatExpandedX');
    var elEY = document.getElementById('floatExpandedY');
    var elShowClose = document.getElementById('showCloseButtonExpanded');
    var elKeepService = document.getElementById('keepServiceOnClose');
    var elShowCheckedToggle = document.getElementById('showCheckedToggle');
    var elShowHistoryButton = document.getElementById('showHistoryButton');
    var elNavType = document.getElementById('navType');
    var elMenuDelay = document.getElementById('menuActionDelay');
    var elAllowDrag = document.getElementById('allowDrag');
    var elScrollBtnType = document.getElementById('scrollButtonType');
    var elDCount = document.getElementById('displayTaskCount');
    var elSCount = document.getElementById('scrollTaskCount');
    var elHDelay = document.getElementById('checkedHideDelay');
    var elRetryInterval = document.getElementById('adRetryBaseInterval');

    if (elEWidth) elEWidth.value = eWidth;
    if (elEHeight) elEHeight.value = eHeight;
    if (elEScale) elEScale.value = eScale;
    if (elEScaleVal) elEScaleVal.innerText = eScale;
    if (elMoveE) elMoveE.checked = moveE;
    if (elEX) elEX.value = eX;
    if (elEY) elEY.value = eY;
    if (elShowClose) elShowClose.checked = showClose;
    if (elKeepService) elKeepService.checked = keepService;
    if (elShowCheckedToggle) elShowCheckedToggle.checked = showCheckedToggle;
    if (elShowHistoryButton) elShowHistoryButton.checked = showHistoryButton;
    if (elNavType) elNavType.value = navType;
    if (elMenuDelay) elMenuDelay.value = menuActionDelay;
    if (elAllowDrag) elAllowDrag.checked = allowDrag;
    if (elScrollBtnType) elScrollBtnType.value = scrollButtonType;
    if (elDCount) elDCount.value = dCount;
    if (elSCount) elSCount.value = sCount;
    if (elHDelay) elHDelay.value = hDelay;
    if (elRetryInterval) elRetryInterval.value = retryInterval;
    var elRecheckInterval = document.getElementById('recheckInterval');
    if (elRecheckInterval) elRecheckInterval.value = localStorage.getItem('recheckInterval') || '0';
    if (typeof toggleFixedPositionInputs === 'function') toggleFixedPositionInputs('expanded');

    if (typeof setupDraggableLabel === 'function') {
        setupDraggableLabel('labelFloatCollapsedX', 'floatCollapsedX', 'collapsed');
        setupDraggableLabel('labelFloatCollapsedY', 'floatCollapsedY', 'collapsed');
        setupDraggableLabel('labelFloatWidth', 'floatWidth', 'expanded');
        setupDraggableLabel('labelFloatHeight', 'floatHeight', 'expanded');
        setupDraggableLabel('labelFloatExpandedX', 'floatExpandedX', 'expanded');
        setupDraggableLabel('labelFloatExpandedY', 'floatExpandedY', 'expanded');
    }

    if (typeof updateFloatingSettingsVisibility === 'function') updateFloatingSettingsVisibility();
    updateStorageUsage();
    if (typeof renderColorRules === 'function') renderColorRules();
}

function updateFloatingSettingsVisibility() {
    var scrollButtonType = document.getElementById('scrollButtonType') ? document.getElementById('scrollButtonType').value : null;
    var navType = document.getElementById('navType') ? document.getElementById('navType').value : null;
    var displayTaskCountContainer = document.getElementById('displayTaskCountContainer');
    var scrollTaskCountContainer = document.getElementById('scrollTaskCountContainer');
    var menuActionDelayContainer = document.getElementById('menuActionDelayContainer');

    if (scrollButtonType === 'scroll') {
        if (displayTaskCountContainer) displayTaskCountContainer.style.display = 'none';
        if (scrollTaskCountContainer) scrollTaskCountContainer.style.display = 'none';
    } else {
        if (displayTaskCountContainer) displayTaskCountContainer.style.display = 'block';
        if (scrollTaskCountContainer) scrollTaskCountContainer.style.display = 'block';
    }

    if (menuActionDelayContainer) {
        menuActionDelayContainer.style.display = (navType === 'menu') ? 'block' : 'none';
    }
}

function setupDraggableLabel(labelId, inputId, mode) {
    var label = document.getElementById(labelId);
    var input = document.getElementById(inputId);
    if (!label || !input) return;
    var startY, startVal;

    var onMove = function(e) {
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        var delta = startY - clientY;
        input.value = Math.max(0, startVal + delta);
        saveFloatingSettings(mode);
    };

    var onEnd = function() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
    };

    label.onmousedown = label.ontouchstart = function(e) {
        startY = e.touches ? e.touches[0].clientY : e.clientY;
        startVal = parseInt(input.value) || 0;

        if (typeof Android !== 'undefined' && Android.startFloatingWindow) {
            Android.startFloatingWindow();
            if (typeof toggleFloatingExpand === 'function') toggleFloatingExpand(mode === 'expanded');
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
        if (e.cancelable) e.preventDefault();
    };
}

function adjustDisplayTaskCount(delta) {
    var input = document.getElementById('displayTaskCount');
    if (!input) return;
    var val = parseInt(input.value) || 1;
    val = Math.max(1, Math.min(10, val + delta));
    input.value = val;

    var scrollInput = document.getElementById('scrollTaskCount');
    if (scrollInput) {
        scrollInput.max = val;
        if (parseInt(scrollInput.value) > val) scrollInput.value = val;
    }
    saveFloatingSettings('expanded');
}

function adjustScrollTaskCount(delta) {
    var input = document.getElementById('scrollTaskCount');
    var displayInput = document.getElementById('displayTaskCount');
    if (!input || !displayInput) return;
    var dVal = parseInt(displayInput.value) || 1;
    var val = parseInt(input.value) || 1;
    val = Math.max(1, Math.min(dVal, val + delta));
    input.value = val;
    saveFloatingSettings('expanded');
}

function adjustMenuActionDelay(delta) {
    var input = document.getElementById('menuActionDelay');
    if (!input) return;
    var val = parseInt(input.value) || 0;
    val = Math.max(0, Math.min(10, val + delta));
    input.value = val;
    saveFloatingSettings('expanded');
}

function adjustCheckedHideDelay(delta) {
    var input = document.getElementById('checkedHideDelay');
    if (!input) return;
    var val = parseInt(input.value) || 0;
    val = Math.max(0, Math.min(60, val + delta));
    input.value = val;
    saveFloatingSettings('expanded', true);
}

function adjustAdRetryInterval(delta) {
    var input = document.getElementById('adRetryBaseInterval');
    if (!input) return;
    var val = parseInt(input.value) || 2;
    val = Math.max(2, Math.min(60, val + delta));
    input.value = val;
    saveFloatingSettings(undefined, true);
}

function adjustRecheckInterval(delta) {
    var input = document.getElementById('recheckInterval');
    if (!input) return;
    var val = parseInt(input.value) || 0;
    val = Math.max(0, Math.min(1440, val + delta));
    input.value = val;
    updateInterval();
}

function saveFloatingSettings(targetMode, skipStartWindow) {
    if (skipStartWindow === undefined) skipStartWindow = false;
    var elCScale = document.getElementById('floatCollapsedScale');
    var elShowEmpty = document.getElementById('showWhenEmpty');
    var elMoveC = document.getElementById('alwaysMoveCollapsed');
    var elAllowDragC = document.getElementById('allowDragCollapsed');
    var elCX = document.getElementById('floatCollapsedX');
    var elCY = document.getElementById('floatCollapsedY');

    if (elCScale) localStorage.setItem('floatCollapsedScale', elCScale.value);
    if (elShowEmpty) localStorage.setItem('showWhenEmpty', elShowEmpty.checked);
    if (elMoveC) localStorage.setItem('alwaysMoveCollapsed', elMoveC.checked);
    if (elAllowDragC) localStorage.setItem('allowDragCollapsed', elAllowDragC.checked);
    if (elCX) localStorage.setItem('floatCollapsedX', elCX.value);
    if (elCY) localStorage.setItem('floatCollapsedY', elCY.value);

    var elWidth = document.getElementById('floatWidth');
    var elHeight = document.getElementById('floatHeight');
    var elEScale = document.getElementById('floatExpandedScale');
    var elMoveE = document.getElementById('alwaysMoveExpanded');
    var elEX = document.getElementById('floatExpandedX');
    var elEY = document.getElementById('floatExpandedY');
    var elShowClose = document.getElementById('showCloseButtonExpanded');
    var elKeepService = document.getElementById('keepServiceOnClose');
    var elShowCheckedToggle = document.getElementById('showCheckedToggle');
    var elShowHistoryButton = document.getElementById('showHistoryButton');
    var elNavType = document.getElementById('navType');
    var elMenuDelay = document.getElementById('menuActionDelay');
    var elAllowDrag = document.getElementById('allowDrag');
    var elScrollBtnType = document.getElementById('scrollButtonType');

    if (elWidth) localStorage.setItem('floatWidth', elWidth.value);
    if (elHeight) localStorage.setItem('floatHeight', elHeight.value);
    if (elEScale) localStorage.setItem('floatExpandedScale', elEScale.value);
    if (elMoveE) localStorage.setItem('alwaysMoveExpanded', elMoveE.checked);
    if (elEX) localStorage.setItem('floatExpandedX', elEX.value);
    if (elEY) localStorage.setItem('floatExpandedY', elEY.value);
    if (elShowClose) localStorage.setItem('showCloseButtonExpanded', elShowClose.checked);
    if (elKeepService) localStorage.setItem('keepServiceOnClose', elKeepService.checked);
    if (elShowCheckedToggle) localStorage.setItem('showCheckedToggle', elShowCheckedToggle.checked);
    if (elShowHistoryButton) localStorage.setItem('showHistoryButton', elShowHistoryButton.checked);
    if (elNavType) localStorage.setItem('navType', elNavType.value);
    if (elMenuDelay) localStorage.setItem('menuActionDelay', elMenuDelay.value.toString());
    if (elAllowDrag) localStorage.setItem('allowDrag', elAllowDrag.checked);
    if (elScrollBtnType) localStorage.setItem('scrollButtonType', elScrollBtnType.value);

    var dInput = document.getElementById('displayTaskCount');
    var sInput = document.getElementById('scrollTaskCount');
    var hInput = document.getElementById('checkedHideDelay');
    var retryInput = document.getElementById('adRetryBaseInterval');
    var recheckInput = document.getElementById('recheckInterval');

    var dCount = parseInt(localStorage.getItem('displayTaskCount') || "1");
    var sCount = parseInt(localStorage.getItem('scrollTaskCount') || "1");
    var hDelay = parseInt(localStorage.getItem('checkedHideDelay') || "2");
    var retryInterval = parseInt(localStorage.getItem('adRetryBaseInterval') || "5");
    var recheckIntervalVal = parseInt(localStorage.getItem('recheckInterval') || "0");

    if (dInput) {
        dCount = Math.max(1, Math.min(10, parseInt(dInput.value) || 1));
        dInput.value = dCount;
        localStorage.setItem('displayTaskCount', dCount.toString());
    }
    if (sInput) {
        sCount = Math.max(1, Math.min(dCount, parseInt(sInput.value) || 1));
        sInput.value = sCount; sInput.max = dCount;
        localStorage.setItem('scrollTaskCount', sCount.toString());
    }
    if (hInput) {
        hDelay = Math.max(0, Math.min(60, parseInt(hInput.value) || 0));
        hInput.value = hDelay;
        localStorage.setItem('checkedHideDelay', hDelay.toString());
    }
    if (retryInput) {
        retryInterval = Math.max(2, Math.min(60, parseInt(retryInput.value) || 5));
        retryInput.value = retryInterval;
        localStorage.setItem('adRetryBaseInterval', retryInterval.toString());
    }
    if (recheckInput) {
        recheckIntervalVal = Math.max(0, Math.min(1440, parseInt(recheckInput.value) || 0));
        recheckInput.value = recheckIntervalVal;
        localStorage.setItem('recheckInterval', recheckIntervalVal.toString());
    }

    if (typeof displayTaskCount !== 'undefined') displayTaskCount = dCount;
    if (typeof scrollTaskCount !== 'undefined') scrollTaskCount = sCount;
    if (typeof checkedHideDelay !== 'undefined') checkedHideDelay = hDelay;
    if (typeof adRetryBaseInterval !== 'undefined') adRetryBaseInterval = retryInterval;

    if (typeof Android !== 'undefined' && Android.setIntervalAlarm) {
        Android.setIntervalAlarm(recheckIntervalVal);
    }

    updateFloatingSettingsVisibility();
    updateStorageUsage();

    if (typeof Android !== 'undefined') {
        if (Android.updateFloatingSettingsExtended) {
            Android.updateFloatingSettingsExtended(
                parseInt(localStorage.getItem('floatCollapsedX') || "100"),
                parseInt(localStorage.getItem('floatCollapsedY') || "100"),
                parseFloat(localStorage.getItem('floatCollapsedScale') || "1.0"),
                localStorage.getItem('showWhenEmpty') === 'true',
                localStorage.getItem('alwaysMoveCollapsed') === 'true',
                parseInt(localStorage.getItem('floatExpandedX') || "100"),
                parseInt(localStorage.getItem('floatExpandedY') || "100"),
                parseFloat(localStorage.getItem('floatExpandedScale') || "1.0"),
                localStorage.getItem('alwaysMoveExpanded') === 'true',
                parseInt(localStorage.getItem('floatWidth') || "300"),
                parseInt(localStorage.getItem('floatHeight') || "44"),
                localStorage.getItem('showCloseButtonExpanded') === 'true',
                dCount, sCount,
                localStorage.getItem('showCheckedToggle') === 'true',
                localStorage.getItem('scrollButtonType') || 'both',
                localStorage.getItem('allowDrag') !== 'false',
                localStorage.getItem('allowDragCollapsed') !== 'false',
                localStorage.getItem('showHistoryButton') === 'true',
                localStorage.getItem('navType') || 'button',
                localStorage.getItem('keepServiceOnClose') === 'true',
                parseInt(localStorage.getItem('menuActionDelay') || "0"),
                hDelay
            );
        }
        if (!skipStartWindow && Android.startFloatingWindow) Android.startFloatingWindow();
        if (targetMode === 'collapsed') {
            if (typeof toggleFloatingExpand === 'function') toggleFloatingExpand(false);
        } else if (targetMode === 'expanded') {
            if (typeof toggleFloatingExpand === 'function') toggleFloatingExpand(true);
        }
    }
}

function resetFloatingSettings() {
    var defaultX = 100; var defaultY = 100; var defaultWidth = 300; var defaultHeight = 44;
    if (typeof Android !== 'undefined' && Android.getDisplayMetrics) {
        try {
            var metrics = JSON.parse(Android.getDisplayMetrics());
            var density = metrics.density || 1;
            var widthPx = metrics.widthPixels;
            defaultWidth = Math.floor(widthPx * 0.9);
            defaultX = Math.floor((widthPx - defaultWidth) / 2);
            defaultY = Math.floor(100 * density);
            defaultHeight = Math.floor(44 * density);
        } catch(e) {}
    }
    var setVal = function(id, val) { var el = document.getElementById(id); if (el) el.value = val; };
    var setChecked = function(id, val) { var el = document.getElementById(id); if (el) el.checked = val; };
    setVal('floatCollapsedScale', 1.0); setChecked('showWhenEmpty', false); setChecked('alwaysMoveCollapsed', false); setChecked('allowDragCollapsed', true);
    setVal('floatCollapsedX', defaultX); setVal('floatCollapsedY', defaultY);
    setVal('floatWidth', defaultWidth); setVal('floatHeight', defaultHeight); setVal('floatExpandedScale', 1.0);
    setChecked('alwaysMoveExpanded', false); setVal('floatExpandedX', defaultX); setVal('floatExpandedY', defaultY);
    setChecked('showCloseButtonExpanded', false); setChecked('keepServiceOnClose', false); setChecked('showCheckedToggle', false); setChecked('showHistoryButton', false);
    setVal('navType', 'button'); setVal('menuActionDelay', 0); setChecked('allowDrag', true);
    setVal('scrollButtonType', 'both'); setVal('displayTaskCount', 1); setVal('scrollTaskCount', 1); setVal('checkedHideDelay', 2);
    setVal('adRetryBaseInterval', 5); setVal('recheckInterval', 0);
    updateFloatingSettingsVisibility(); updateStorageUsage(); saveFloatingSettings();
}

function updateInterval() {
    var input = document.getElementById('recheckInterval');
    if (!input) return;
    var interval = input.value;
    localStorage.setItem('recheckInterval', interval);
    if (typeof Android !== 'undefined' && Android.setIntervalAlarm) {
        Android.setIntervalAlarm(parseInt(interval));
    }
}

function updateCalendarMark() {
    var input = document.getElementById('calendarMarkInput');
    var mark = (input ? input.value : "") || '⭕';
    calendarMark = mark;
    localStorage.setItem('calendarMark', mark);
    if (typeof currentCalendarTaskId !== 'undefined' && currentCalendarTaskId !== null) {
        if (typeof renderCalendar === 'function') renderCalendar(currentCalendarTaskId, currentCalendarDate);
    }
}

function addColorRule() {
    if (typeof bgThresholds !== 'undefined') {
        bgThresholds.push({ threshold: 300, bgColor: '#ffffff', textColor: '#333333' });
        saveColorRules();
    }
}

function removeColorRule(index) {
    showModal(getTranslation('msg_rule_delete_confirm'), {
        onConfirm: function() {
            if (typeof bgThresholds !== 'undefined') {
                bgThresholds.splice(index, 1);
                saveColorRules();
            }
        }
    });
}

function saveColorRules() {
    if (typeof bgThresholds !== 'undefined') {
        bgThresholds.sort(function(a, b) { return a.threshold - b.threshold; });
        localStorage.setItem('bgThresholds', JSON.stringify(bgThresholds));
    }
    if (typeof render === 'function') render();
    renderColorRules();
}

function updateColorRule(index, field, value) {
    if (typeof bgThresholds !== 'undefined') {
        if (field === 'threshold') bgThresholds[index][field] = parseInt(value) || 0;
        else bgThresholds[index][field] = value;
        localStorage.setItem('bgThresholds', JSON.stringify(bgThresholds));
    }
    if (typeof render === 'function') render();
    var previews = document.querySelectorAll('.color-preview-hex');
    if (previews[index] && typeof bgThresholds !== 'undefined') {
        previews[index].style.backgroundColor = bgThresholds[index].bgColor;
        previews[index].style.color = bgThresholds[index].textColor;
        previews[index].innerHTML = '<div>' + bgThresholds[index].bgColor.toUpperCase() + '</div><div>' + bgThresholds[index].textColor.toUpperCase() + '</div>';
    }
}

function renderColorRules() {
    var list = document.getElementById('colorRulesList');
    if (!list || typeof bgThresholds === 'undefined') return;
    list.innerHTML = bgThresholds.map(function(rule, index) {
        var mins = Math.floor(rule.threshold / 60);
        return '<div class="color-rule-item">' +
            '<div class="color-input-wrapper"><span class="color-input-label">' + getTranslation('label_bg_color') + '</span><input type="color" value="' + rule.bgColor + '" onchange="updateColorRule(' + index + ', \'bgColor\', this.value)"></div>' +
            '<div class="color-input-wrapper"><span class="color-input-label">' + getTranslation('label_text_color') + '</span><input type="color" value="' + rule.textColor + '" onchange="updateColorRule(' + index + ', \'textColor\', this.value)"></div>' +
            '<div class="threshold-input-group"><input type="number" class="threshold-input" value="' + mins + '" onchange="updateColorRule(' + index + ', \'threshold\', this.value * 60)" onblur="saveColorRules()"><span style="font-size: 12px;">' + getTranslation('label_threshold') + '</span></div>' +
            '<div class="color-preview-hex" style="background-color: ' + rule.bgColor + '; color: ' + rule.textColor + '; border: 1px solid #ddd;"><div>' + rule.bgColor.toUpperCase() + '</div><div>' + rule.textColor.toUpperCase() + '</div></div>' +
            '<button class="btn-icon" onclick="removeColorRule(' + index + ')">🗑️</button></div>';
    }).join('');
}

function toggleFixedPositionInputs(mode) {
    var checkbox = document.getElementById(mode === 'collapsed' ? 'alwaysMoveCollapsed' : 'alwaysMoveExpanded');
    var container = document.getElementById(mode === 'collapsed' ? 'collapsedPositionInputs' : 'expandedPositionInputs');
    if (checkbox && container) container.style.display = checkbox.checked ? 'flex' : 'none';
}

window.updateStorageUsage = updateStorageUsage;
window.openFloatingSettings = openFloatingSettings;
window.openAdRetryInfo = openAdRetryInfo;
window.openNewTaskSettings = openNewTaskSettings;
window.openMelodySettings = openMelodySettings;
window.openPermissionsScreen = openPermissionsScreen;
window.openDataManagementScreen = openDataManagementScreen;
window.openRewardsScreen = openRewardsScreen;
window.openDeveloperSettings = openDeveloperSettings;
window.unlockPremium = unlockPremium;
window.loadNewTaskSettings = loadNewTaskSettings;
window.updateNewTaskSettings = updateNewTaskSettings;
window.loadMelodySettings = loadMelodySettings;
window.updateSnoozeDuration = updateSnoozeDuration;
window.adjustSnoozeDuration = adjustSnoozeDuration;
window.loadFloatingSettings = loadFloatingSettings;
window.updateFloatingSettingsVisibility = updateFloatingSettingsVisibility;
window.adjustDisplayTaskCount = adjustDisplayTaskCount;
window.adjustScrollTaskCount = adjustScrollTaskCount;
window.adjustMenuActionDelay = adjustMenuActionDelay;
window.adjustCheckedHideDelay = adjustCheckedHideDelay;
window.adjustAdRetryInterval = adjustAdRetryInterval;
window.adjustRecheckInterval = adjustRecheckInterval;
window.saveFloatingSettings = saveFloatingSettings;
window.resetFloatingSettings = resetFloatingSettings;
window.updateInterval = updateInterval;
window.updateCalendarMark = updateCalendarMark;
window.addColorRule = addColorRule;
window.removeColorRule = removeColorRule;
window.saveColorRules = saveColorRules;
window.updateColorRule = updateColorRule;
window.renderColorRules = renderColorRules;
window.toggleFixedPositionInputs = toggleFixedPositionInputs;

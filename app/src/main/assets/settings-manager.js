/**
 * Settings and Configuration Management Logic
 */

function updateStorageUsage() {
    console.log("updateStorageUsage execution started");
    const infoEl = document.getElementById('storage-usage-info');
    const barEl = document.getElementById('storage-usage-bar');
    if (!infoEl) {
        console.warn("updateStorageUsage: infoEl not found");
        return;
    }

    let total = 0;
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key) || "";
                total += (key.length + value.length) * 2;
            }
        }
    } catch (e) {
        console.error("Error calculating storage usage:", e);
    }

    const usedKB = (total / 1024).toFixed(2);
    const quotaKB = 5120; // 5MB limit approximation
    const percent = Math.min(100, (parseFloat(usedKB) / quotaKB * 100)).toFixed(1);

    console.log(`Storage usage: ${usedKB} KB / ${quotaKB} KB (${percent}%)`);

    try {
        infoEl.textContent = getTranslation('storage_info', usedKB, quotaKB, percent);
    } catch (e) {
        infoEl.textContent = `${usedKB} KB / ${quotaKB} KB (${percent}%)`;
    }

    if (barEl) {
        barEl.style.width = percent + '%';
        if (parseFloat(percent) > 90) barEl.style.backgroundColor = '#dc3545';
        else if (parseFloat(percent) > 70) barEl.style.backgroundColor = '#ffc107';
        else barEl.style.backgroundColor = '#007bff';
    }
}
window.updateStorageUsage = updateStorageUsage;

function openFloatingSettings() {
    const mainView = document.getElementById('settings-main-view');
    const detailView = document.getElementById('settings-floating-detail');
    if (mainView) mainView.style.display = 'none';
    if (detailView) detailView.style.display = 'block';
    if (typeof renderColorRules === 'function') {
        try {
            renderColorRules();
        } catch (e) {
            console.error("renderColorRules failed:", e);
        }
    }
}
window.openFloatingSettings = openFloatingSettings;

function openAdRetryInfo() {
    const title = getTranslation('label_ad_retry_interval');
    const desc = getTranslation('desc_ad_retry_interval');
    const fullHtml = `<div style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">${title}</div><div style="font-size: 14px; line-height: 1.6; font-weight: normal; color: #333; white-space: normal;">${desc}</div>`;
    if (typeof showModal === 'function') {
        showModal(fullHtml, {
            useHTML: true,
            hideCancel: true
        });
    }
}
window.openAdRetryInfo = openAdRetryInfo;

function closeFloatingSettings() {
    const mainView = document.getElementById('settings-main-view');
    const detailView = document.getElementById('settings-floating-detail');
    if (mainView) mainView.style.display = 'block';
    if (detailView) detailView.style.display = 'none';
    if (typeof Android !== 'undefined' && Android.stopFloatingWindow) {
        Android.stopFloatingWindow();
    }
}
window.closeFloatingSettings = closeFloatingSettings;

function openNewTaskSettings() {
    location.href = 'task-settings.html';
}
window.openNewTaskSettings = openNewTaskSettings;

function openPermissionsScreen() {
    location.href = 'permissions.html?from=settings';
}
window.openPermissionsScreen = openPermissionsScreen;

function openDataManagementScreen() {
    location.href = 'data-management.html';
}
window.openDataManagementScreen = openDataManagementScreen;

function openRewardsScreen() {
    location.href = 'rewards.html';
}
window.openRewardsScreen = openRewardsScreen;


function loadNewTaskSettings() {
    const showTimer = localStorage.getItem('showTimerOnCreate') === 'true';
    const showRemind = localStorage.getItem('showRemindOnCreate') === 'true';
    const showDays = localStorage.getItem('showDaysOnCreate') === 'true';
    const showComment = localStorage.getItem('showCommentOnCreate') === 'true';
    const showNote = localStorage.getItem('showNoteOnCreate') === 'true';
    const showHyperlink = localStorage.getItem('showHyperlinkOnCreate') === 'true';
    const keepDuration = (localStorage.getItem('keepDurationTaskOnReset') !== 'false');

    const chkTimer = document.getElementById('showTimerOnCreate');
    const chkRemind = document.getElementById('showRemindOnCreate');
    const chkDays = document.getElementById('showDaysOnCreate');
    const chkComment = document.getElementById('showCommentOnCreate');
    const chkNote = document.getElementById('showNoteOnCreate');
    const chkHyperlink = document.getElementById('showHyperlinkOnCreate');
    const chkKeepDuration = document.getElementById('keepDurationTaskOnReset');

    if (chkTimer) chkTimer.checked = showTimer;
    if (chkRemind) chkRemind.checked = showRemind;
    if (chkDays) chkDays.checked = showDays;
    if (chkComment) chkComment.checked = showComment;
    if (chkNote) chkNote.checked = showNote;
    if (chkHyperlink) chkHyperlink.checked = showHyperlink;
    if (chkKeepDuration) chkKeepDuration.checked = keepDuration;
}
window.loadNewTaskSettings = loadNewTaskSettings;

function updateNewTaskSettings() {
    const chkTimer = document.getElementById('showTimerOnCreate');
    const chkRemind = document.getElementById('showRemindOnCreate');
    const chkDays = document.getElementById('showDaysOnCreate');
    const chkComment = document.getElementById('showCommentOnCreate');
    const chkNote = document.getElementById('showNoteOnCreate');
    const chkHyperlink = document.getElementById('showHyperlinkOnCreate');
    const chkKeepDuration = document.getElementById('keepDurationTaskOnReset');

    const showTimer = chkTimer ? chkTimer.checked : false;
    const showRemind = chkRemind ? chkRemind.checked : false;
    const showDays = chkDays ? chkDays.checked : false;
    const showComment = chkComment ? chkComment.checked : false;
    const showNote = chkNote ? chkNote.checked : false;
    const showHyperlink = chkHyperlink ? chkHyperlink.checked : false;
    const keepDuration = chkKeepDuration ? chkKeepDuration.checked : true;

    if (chkTimer) localStorage.setItem('showTimerOnCreate', showTimer);
    if (chkRemind) localStorage.setItem('showRemindOnCreate', showRemind);
    if (chkDays) localStorage.setItem('showDaysOnCreate', showDays);
    if (chkComment) localStorage.setItem('showCommentOnCreate', showComment);
    if (chkNote) localStorage.setItem('showNoteOnCreate', showNote);
    if (chkHyperlink) localStorage.setItem('showHyperlinkOnCreate', showHyperlink);
    if (chkKeepDuration) localStorage.setItem('keepDurationTaskOnReset', keepDuration);
}
window.updateNewTaskSettings = updateNewTaskSettings;

function loadFloatingSettings() {
    const cScale = localStorage.getItem('floatCollapsedScale') || '1.0';
    const showEmpty = localStorage.getItem('showWhenEmpty') === 'true';
    const moveC = localStorage.getItem('alwaysMoveCollapsed') === 'true';
    const allowDragC = localStorage.getItem('allowDragCollapsed') !== 'false';
    const cX = localStorage.getItem('floatCollapsedX') || '100';
    const cY = localStorage.getItem('floatCollapsedY') || '100';

    const elCScale = document.getElementById('floatCollapsedScale');
    const elCScaleVal = document.getElementById('collapsedScaleVal');
    const elShowEmpty = document.getElementById('showWhenEmpty');
    const elMoveC = document.getElementById('alwaysMoveCollapsed');
    const elAllowDragC = document.getElementById('allowDragCollapsed');
    const elCX = document.getElementById('floatCollapsedX');
    const elCY = document.getElementById('floatCollapsedY');

    if (elCScale) elCScale.value = cScale;
    if (elCScaleVal) elCScaleVal.innerText = cScale;
    if (elShowEmpty) elShowEmpty.checked = showEmpty;
    if (elMoveC) elMoveC.checked = moveC;
    if (elAllowDragC) elAllowDragC.checked = allowDragC;
    if (elCX) elCX.value = cX;
    if (elCY) elCY.value = cY;
    toggleFixedPositionInputs('collapsed');

    const eWidth = localStorage.getItem('floatWidth') || '300';
    const eHeight = localStorage.getItem('floatHeight') || '44';
    const eScale = localStorage.getItem('floatExpandedScale') || '1.0';
    const moveE = localStorage.getItem('alwaysMoveExpanded') === 'true';
    const eX = localStorage.getItem('floatExpandedX') || '100';
    const eY = localStorage.getItem('floatExpandedY') || '100';
    const showClose = localStorage.getItem('showCloseButtonExpanded') === 'true';
    const keepService = localStorage.getItem('keepServiceOnClose') === 'true';
    const showCheckedToggle = localStorage.getItem('showCheckedToggle') === 'true';
    const showHistoryButton = localStorage.getItem('showHistoryButton') === 'true';
    const navType = localStorage.getItem('navType') || 'button';
    const menuActionDelay = localStorage.getItem('menuActionDelay') || '0';
    const allowDrag = localStorage.getItem('allowDrag') !== 'false';
    const scrollButtonType = localStorage.getItem('scrollButtonType') || 'both';
    const dCount = localStorage.getItem('displayTaskCount') || '1';
    const sCount = localStorage.getItem('scrollTaskCount') || '1';
    const hDelay = localStorage.getItem('checkedHideDelay') || '2';
    const retryInterval = localStorage.getItem('adRetryBaseInterval') || '5';

    const elEWidth = document.getElementById('floatWidth');
    const elEHeight = document.getElementById('floatHeight');
    const elEScale = document.getElementById('floatExpandedScale');
    const elEScaleVal = document.getElementById('expandedScaleVal');
    const elMoveE = document.getElementById('alwaysMoveExpanded');
    const elEX = document.getElementById('floatExpandedX');
    const elEY = document.getElementById('floatExpandedY');
    const elShowClose = document.getElementById('showCloseButtonExpanded');
    const elKeepService = document.getElementById('keepServiceOnClose');
    const elShowCheckedToggle = document.getElementById('showCheckedToggle');
    const elShowHistoryButton = document.getElementById('showHistoryButton');
    const elNavType = document.getElementById('navType');
    const elMenuDelay = document.getElementById('menuActionDelay');
    const elAllowDrag = document.getElementById('allowDrag');
    const elScrollBtnType = document.getElementById('scrollButtonType');
    const elDCount = document.getElementById('displayTaskCount');
    const elSCount = document.getElementById('scrollTaskCount');
    const elHDelay = document.getElementById('checkedHideDelay');
    const elRetryInterval = document.getElementById('adRetryBaseInterval');

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
    const elRecheckInterval = document.getElementById('recheckInterval');
    if (elRecheckInterval) elRecheckInterval.value = localStorage.getItem('recheckInterval') || '0';
    toggleFixedPositionInputs('expanded');

    setupDraggableLabel('labelFloatCollapsedX', 'floatCollapsedX', 'collapsed');
    setupDraggableLabel('labelFloatCollapsedY', 'floatCollapsedY', 'collapsed');
    setupDraggableLabel('labelFloatWidth', 'floatWidth', 'expanded');
    setupDraggableLabel('labelFloatHeight', 'floatHeight', 'expanded');
    setupDraggableLabel('labelFloatExpandedX', 'floatExpandedX', 'expanded');
    setupDraggableLabel('labelFloatExpandedY', 'floatExpandedY', 'expanded');

    updateFloatingSettingsVisibility();
    updateStorageUsage();
}
window.loadFloatingSettings = loadFloatingSettings;

function updateFloatingSettingsVisibility() {
    const scrollButtonType = document.getElementById('scrollButtonType')?.value;
    const navType = document.getElementById('navType')?.value;
    const displayTaskCountContainer = document.getElementById('displayTaskCountContainer');
    const scrollTaskCountContainer = document.getElementById('scrollTaskCountContainer');
    const menuActionDelayContainer = document.getElementById('menuActionDelayContainer');

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
window.updateFloatingSettingsVisibility = updateFloatingSettingsVisibility;

function setupDraggableLabel(labelId, inputId, mode) {
    const label = document.getElementById(labelId);
    const input = document.getElementById(inputId);
    if (!label || !input) return;
    let startY, startVal;

    const onMove = (e) => {
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const delta = startY - clientY;
        input.value = Math.max(0, startVal + delta);
        saveFloatingSettings(mode);
    };

    const onEnd = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
    };

    label.onmousedown = label.ontouchstart = (e) => {
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
    const input = document.getElementById('displayTaskCount');
    if (!input) return;
    let val = parseInt(input.value) || 1;
    val = Math.max(1, Math.min(10, val + delta));
    input.value = val;

    const scrollInput = document.getElementById('scrollTaskCount');
    if (scrollInput) {
        scrollInput.max = val;
        if (parseInt(scrollInput.value) > val) scrollInput.value = val;
    }
    saveFloatingSettings('expanded');
}
window.adjustDisplayTaskCount = adjustDisplayTaskCount;

function adjustScrollTaskCount(delta) {
    const input = document.getElementById('scrollTaskCount');
    const displayInput = document.getElementById('displayTaskCount');
    if (!input || !displayInput) return;
    let dVal = parseInt(displayInput.value) || 1;
    let val = parseInt(input.value) || 1;
    val = Math.max(1, Math.min(dVal, val + delta));
    input.value = val;
    saveFloatingSettings('expanded');
}
window.adjustScrollTaskCount = adjustScrollTaskCount;

function adjustMenuActionDelay(delta) {
    const input = document.getElementById('menuActionDelay');
    if (!input) return;
    let val = parseInt(input.value) || 0;
    val = Math.max(0, Math.min(10, val + delta));
    input.value = val;
    saveFloatingSettings('expanded');
}
window.adjustMenuActionDelay = adjustMenuActionDelay;

function adjustCheckedHideDelay(delta) {
    const input = document.getElementById('checkedHideDelay');
    if (!input) return;
    let val = parseInt(input.value) || 0;
    val = Math.max(0, Math.min(60, val + delta));
    input.value = val;
    saveFloatingSettings('expanded', true);
}
window.adjustCheckedHideDelay = adjustCheckedHideDelay;

function adjustAdRetryInterval(delta) {
    const input = document.getElementById('adRetryBaseInterval');
    if (!input) return;
    let val = parseInt(input.value) || 2;
    val = Math.max(2, Math.min(60, val + delta));
    input.value = val;
    // 第2引数に true を渡してフローティングウィンドウの起動をスキップする
    saveFloatingSettings(undefined, true);
}
window.adjustAdRetryInterval = adjustAdRetryInterval;

function adjustRecheckInterval(delta) {
    const input = document.getElementById('recheckInterval');
    if (!input) return;
    let val = parseInt(input.value) || 0;
    val = Math.max(0, Math.min(1440, val + delta));
    input.value = val;
    updateInterval();
}
window.adjustRecheckInterval = adjustRecheckInterval;

function saveFloatingSettings(targetMode, skipStartWindow = false) {
    const elCScale = document.getElementById('floatCollapsedScale');
    const elShowEmpty = document.getElementById('showWhenEmpty');
    const elMoveC = document.getElementById('alwaysMoveCollapsed');
    const elAllowDragC = document.getElementById('allowDragCollapsed');
    const elCX = document.getElementById('floatCollapsedX');
    const elCY = document.getElementById('floatCollapsedY');

    if (elCScale) localStorage.setItem('floatCollapsedScale', elCScale.value);
    if (elShowEmpty) localStorage.setItem('showWhenEmpty', elShowEmpty.checked);
    if (elMoveC) localStorage.setItem('alwaysMoveCollapsed', elMoveC.checked);
    if (elAllowDragC) localStorage.setItem('allowDragCollapsed', elAllowDragC.checked);
    if (elCX) localStorage.setItem('floatCollapsedX', elCX.value);
    if (elCY) localStorage.setItem('floatCollapsedY', elCY.value);

    const elWidth = document.getElementById('floatWidth');
    const elHeight = document.getElementById('floatHeight');
    const elEScale = document.getElementById('floatExpandedScale');
    const elMoveE = document.getElementById('alwaysMoveExpanded');
    const elEX = document.getElementById('floatExpandedX');
    const elEY = document.getElementById('floatExpandedY');
    const elShowClose = document.getElementById('showCloseButtonExpanded');
    const elKeepService = document.getElementById('keepServiceOnClose');
    const elShowCheckedToggle = document.getElementById('showCheckedToggle');
    const elShowHistoryButton = document.getElementById('showHistoryButton');
    const elNavType = document.getElementById('navType');
    const elMenuDelay = document.getElementById('menuActionDelay');
    const elAllowDrag = document.getElementById('allowDrag');
    const elScrollBtnType = document.getElementById('scrollButtonType');

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

    const dInput = document.getElementById('displayTaskCount');
    const sInput = document.getElementById('scrollTaskCount');
    const hInput = document.getElementById('checkedHideDelay');
    const retryInput = document.getElementById('adRetryBaseInterval');
    const recheckInput = document.getElementById('recheckInterval');

    let dCount = parseInt(localStorage.getItem('displayTaskCount') || "1");
    let sCount = parseInt(localStorage.getItem('scrollTaskCount') || "1");
    let hDelay = parseInt(localStorage.getItem('checkedHideDelay') || "2");
    let retryInterval = parseInt(localStorage.getItem('adRetryBaseInterval') || "5");
    let recheckIntervalVal = parseInt(localStorage.getItem('recheckInterval') || "0");

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

    // Android 側への通知 (アラーム再設定)
    if (typeof Android !== 'undefined' && Android.setIntervalAlarm) {
        Android.setIntervalAlarm(recheckIntervalVal);
    }

    updateFloatingSettingsVisibility();
    updateStorageUsage();

    if (typeof Android !== 'undefined') {
        if (Android.updateFloatingSettingsExtended) {
            const cX = parseInt(localStorage.getItem('floatCollapsedX') || "100");
            const cY = parseInt(localStorage.getItem('floatCollapsedY') || "100");
            const cScale = parseFloat(localStorage.getItem('floatCollapsedScale') || "1.0");
            const showEmpty = localStorage.getItem('showWhenEmpty') === 'true';
            const moveC = localStorage.getItem('alwaysMoveCollapsed') === 'true';
            const eX = parseInt(localStorage.getItem('floatExpandedX') || "100");
            const eY = parseInt(localStorage.getItem('floatExpandedY') || "100");
            const eScale = parseFloat(localStorage.getItem('floatExpandedScale') || "1.0");
            const moveE = localStorage.getItem('alwaysMoveExpanded') === 'true';
            const width = parseInt(localStorage.getItem('floatWidth') || "300");
            const height = parseInt(localStorage.getItem('floatHeight') || "44");
            const showClose = localStorage.getItem('showCloseButtonExpanded') === 'true';
            const showCheckedToggle = localStorage.getItem('showCheckedToggle') === 'true';
            const scrollButtonType = localStorage.getItem('scrollButtonType') || 'both';
            const allowDrag = localStorage.getItem('allowDrag') !== 'false';
            const allowDragC = localStorage.getItem('allowDragCollapsed') !== 'false';
            const showHistoryButton = localStorage.getItem('showHistoryButton') === 'true';
            const navType = localStorage.getItem('navType') || 'button';
            const keepService = localStorage.getItem('keepServiceOnClose') === 'true';
            const menuActionDelay = parseInt(localStorage.getItem('menuActionDelay') || "0");

            Android.updateFloatingSettingsExtended(
                cX, cY, cScale, showEmpty, moveC,
                eX, eY, eScale, moveE,
                width, height, showClose,
                dCount, sCount, showCheckedToggle, scrollButtonType, allowDrag, allowDragC,
                showHistoryButton, navType, keepService, menuActionDelay, hDelay
            );
        } else if (Android.updateFloatingSettings) {
            const eX = parseInt(localStorage.getItem('floatExpandedX') || "100");
            const eY = parseInt(localStorage.getItem('floatExpandedY') || "100");
            const width = parseInt(localStorage.getItem('floatWidth') || "300");
            const height = parseInt(localStorage.getItem('floatHeight') || "44");
            const eScale = parseFloat(localStorage.getItem('floatExpandedScale') || "1.0");
            Android.updateFloatingSettings(eX, eY, width, height, eScale);
        }

        if (!skipStartWindow && Android.startFloatingWindow) Android.startFloatingWindow();

        if (targetMode === 'collapsed') {
            if (typeof toggleFloatingExpand === 'function') toggleFloatingExpand(false);
        } else if (targetMode === 'expanded') {
            if (typeof toggleFloatingExpand === 'function') toggleFloatingExpand(true);
        }
    }
}
window.saveFloatingSettings = saveFloatingSettings;

function resetFloatingSettings() {
    let defaultX = 100;
    let defaultY = 100;
    let defaultWidth = 300;
    let defaultHeight = 44;

    if (typeof Android !== 'undefined' && Android.getDisplayMetrics) {
        try {
            const metrics = JSON.parse(Android.getDisplayMetrics());
            const density = metrics.density || 1;
            const widthPx = metrics.widthPixels;
            defaultWidth = Math.floor(widthPx * 0.9);
            defaultX = Math.floor((widthPx - defaultWidth) / 2);
            defaultY = Math.floor(100 * density);
            defaultHeight = Math.floor(44 * density);
        } catch(e) { console.error("Failed to get display metrics", e); }
    }

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const setChecked = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };

    setVal('floatCollapsedScale', 1.0); setText('collapsedScaleVal', "1.0");
    setChecked('showWhenEmpty', false); setChecked('alwaysMoveCollapsed', false); setChecked('allowDragCollapsed', true);
    setVal('floatCollapsedX', defaultX); setVal('floatCollapsedY', defaultY);

    setVal('floatWidth', defaultWidth); setVal('floatHeight', defaultHeight);
    setVal('floatExpandedScale', 1.0); setText('expandedScaleVal', "1.0");
    setChecked('alwaysMoveExpanded', false);
    setVal('floatExpandedX', defaultX); setVal('floatExpandedY', defaultY);
    setChecked('showCloseButtonExpanded', false); setChecked('keepServiceOnClose', false);
    setChecked('showCheckedToggle', false); setChecked('showHistoryButton', false);
    setVal('navType', 'button'); setVal('menuActionDelay', 0); setChecked('allowDrag', true);
    setVal('scrollButtonType', 'both'); setVal('displayTaskCount', 1); setVal('scrollTaskCount', 1); setVal('checkedHideDelay', 2);
    setVal('adRetryBaseInterval', 5);
    setVal('recheckInterval', 0);

    updateFloatingSettingsVisibility();
    updateStorageUsage();
    saveFloatingSettings();
}
window.resetFloatingSettings = resetFloatingSettings;

function updateInterval() {
    const input = document.getElementById('recheckInterval');
    if (!input) return;
    const interval = input.value;
    if (typeof Android !== 'undefined' && Android.logToAppLog) {
        Android.logToAppLog("JS: updateInterval called. value=" + interval);
    }
    localStorage.setItem('recheckInterval', interval);
    if (typeof Android !== 'undefined' && Android.setIntervalAlarm) {
        Android.setIntervalAlarm(parseInt(interval));
    }
}
window.updateInterval = updateInterval;

function updateCalendarMark() {
    const input = document.getElementById('calendarMarkInput');
    const mark = (input ? input.value : "") || '⭕';
    calendarMark = mark;
    localStorage.setItem('calendarMark', mark);
}
window.updateCalendarMark = updateCalendarMark;

function addColorRule() {
    if (typeof bgThresholds !== 'undefined') {
        bgThresholds.push({ threshold: 300, bgColor: '#ffffff', textColor: '#333333' });
        saveColorRules();
    }
}
window.addColorRule = addColorRule;

function removeColorRule(index) {
    showModal(getTranslation('msg_rule_delete_confirm'), {
        onConfirm: () => {
            if (typeof bgThresholds !== 'undefined') {
                bgThresholds.splice(index, 1);
                saveColorRules();
            }
        }
    });
}
window.removeColorRule = removeColorRule;

function saveColorRules() {
    if (typeof bgThresholds !== 'undefined') {
        bgThresholds.sort((a, b) => a.threshold - b.threshold);
        localStorage.setItem('bgThresholds', JSON.stringify(bgThresholds));
    }
    if (typeof render === 'function') render();
    renderColorRules();
}
window.saveColorRules = saveColorRules;

function updateColorRule(index, field, value) {
    if (typeof bgThresholds !== 'undefined') {
        if (field === 'threshold') bgThresholds[index][field] = parseInt(value) || 0;
        else bgThresholds[index][field] = value;
        localStorage.setItem('bgThresholds', JSON.stringify(bgThresholds));
    }
    if (typeof render === 'function') render();
    const previews = document.querySelectorAll('.color-preview-hex');
    if (previews[index] && typeof bgThresholds !== 'undefined') {
        previews[index].style.backgroundColor = bgThresholds[index].bgColor;
        previews[index].style.color = bgThresholds[index].textColor;
        previews[index].innerHTML = `<div>${bgThresholds[index].bgColor.toUpperCase()}</div><div>${bgThresholds[index].textColor.toUpperCase()}</div>`;
    }
}
window.updateColorRule = updateColorRule;

function renderColorRules() {
    const list = document.getElementById('colorRulesList');
    if (!list || typeof bgThresholds === 'undefined') return;
    list.innerHTML = bgThresholds.map((rule, index) => `
        <div class="color-rule-item">
            <div class="color-input-wrapper">
                <span class="color-input-label">${getTranslation('label_bg_color')}</span>
                <input type="color" value="${rule.bgColor}" onchange="updateColorRule(${index}, 'bgColor', this.value)">
            </div>
            <div class="color-input-wrapper">
                <span class="color-input-label">${getTranslation('label_text_color')}</span>
                <input type="color" value="${rule.textColor}" onchange="updateColorRule(${index}, 'textColor', this.value)">
            </div>
            <div class="threshold-input-group">
                <input type="number" class="threshold-input" value="${Math.floor(rule.threshold / 60)}"
                    onchange="updateColorRule(${index}, 'threshold', this.value * 60)"
                    onblur="saveColorRules()">
                <span style="font-size: 12px;">${getTranslation('label_threshold')}</span>
            </div>
            <div class="color-preview-hex" style="background-color: ${rule.bgColor}; color: ${rule.textColor}; border: 1px solid #ddd;">
                <div>${rule.bgColor.toUpperCase()}</div>
                <div>${rule.textColor.toUpperCase()}</div>
            </div>
            <button class="btn-icon" onclick="removeColorRule(${index})">🗑️</button>
        </div>
    `).join('');
}
window.renderColorRules = renderColorRules;

function toggleFixedPositionInputs(mode) {
    const checkbox = document.getElementById(mode === 'collapsed' ? 'alwaysMoveCollapsed' : 'alwaysMoveExpanded');
    const container = document.getElementById(mode === 'collapsed' ? 'collapsedPositionInputs' : 'expandedPositionInputs');
    if (checkbox && container) {
        container.style.display = checkbox.checked ? 'flex' : 'none';
    }
}
window.toggleFixedPositionInputs = toggleFixedPositionInputs;

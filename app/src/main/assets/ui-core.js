/**
 * UI Core and Navigation Logic
 */

// Global State Variables
var historyFilterPeriodType = 'all';
var historyFilterPeriodValue = '';
var historyFilterQuery = '';
var inputtingCommentForTaskId = null;
var currentFloatingIndex = 0;
var draggingElement = null;
var isEditMode = false;
var isExportMode = false;
var isDeleteMode = false;
var selectedExportIds = new Set();
var selectedDeleteIds = new Set();
var currentCalendarDate = new Date();
var currentCalendarTaskId = null;
var editingTaskId = null;
var currentDuration = { h: "0", m: "0", s: "0" };
var currentTaskReminders = [];
var isMelodyTesting = false;
var tempVisibilityFlags = {
    timer: false,
    remind: false,
    comment: false,
    days: false,
    note: false,
    hyperlink: false
};
var isDurationPickerRequested = false;
var adRetryCount = 0;
var adRetryTimeoutId = null;
var adRetryBaseInterval = parseInt(localStorage.getItem('adRetryBaseInterval') || '5');
var currentTaskReminders = [];
var currentTaskLinks = [];
var selectedCustomUri = null;
var selectedCustomName = null;
var isFloatingExpanded = (urlParams.get('expanded') === 'true');
var isDragging = false;
var pendingAction = null;
var isImportMode = false;
var pendingRestoreData = null;
var pendingRestoreOptions = null;

function handleBack() {
    // Check modals priority
    const tempVisibilityModal = document.getElementById('tempVisibilityModal');
    if (tempVisibilityModal && tempVisibilityModal.style.display === 'flex') {
        closeTemporaryVisibilityModal();
        return true;
    }

    const customModal = document.getElementById('customModal');
    if (customModal && customModal.style.display === 'flex') {
        const cancelBtn = document.getElementById('modalCancelBtn');
        if (cancelBtn && cancelBtn.style.display !== 'none') {
            cancelBtn.click();
        } else {
            closeModal();
        }
        return true;
    }

    const taskModal = document.getElementById('taskModal');
    if (taskModal && taskModal.style.display === 'flex') {
        closeTaskModal();
        return true;
    }

    const developerModal = document.getElementById('developerModal');
    if (developerModal && developerModal.style.display === 'flex') {
        closeDeveloperModal();
        return true;
    }

    const editMenuModal = document.getElementById('editMenuModal');
    if (editMenuModal && editMenuModal.style.display === 'flex') {
        closeEditMenu();
        return true;
    }

    const languageModal = document.getElementById('languageModal');
    if (languageModal && languageModal.style.display === 'flex') {
        languageModal.style.display = 'none';
        return true;
    }

    if (isExportMode || isDeleteMode) {
        cancelBulkMode();
        return true;
    }

    if (isEditMode) {
        finishSortMode();
        return true;
    }

    const floatingDetail = document.getElementById('settings-floating-detail');
    if (floatingDetail && floatingDetail.style.display === 'block') {
        closeFloatingSettings();
        return true;
    }

    const taskDetail = document.getElementById('settings-new-task-detail');
    if (taskDetail && taskDetail.style.display === 'block') {
        closeNewTaskSettings();
        return true;
    }

    if (currentCalendarTaskId !== null) {
        if (typeof renderHistory === 'function') renderHistory();
        return true;
    }

    const historyContent = document.getElementById('history-content');
    const settingsContent = document.getElementById('settings-content');
    if ((historyContent && historyContent.style.display === 'block') ||
        (settingsContent && settingsContent.style.display === 'block')) {
        switchTab('tasks');
        return true;
    }

    return false;
}

function switchTab(tab, options = {}) {
    if (tab !== 'history' || !options.skipRenderHistory) {
        currentCalendarTaskId = null;
    }
    if (tab !== 'settings') {
        const floatingDetail = document.getElementById('settings-floating-detail');
        if (floatingDetail && floatingDetail.style.display === 'block') {
            closeFloatingSettings();
        }
    }
    document.getElementById('tasks-content').style.display = (tab === 'tasks') ? 'block' : 'none';
    document.getElementById('history-content').style.display = (tab === 'history') ? 'block' : 'none';
    document.getElementById('settings-content').style.display = (tab === 'settings') ? 'block' : 'none';
    document.getElementById('tab-tasks').classList.toggle('active', tab === 'tasks');
    document.getElementById('tab-history').classList.toggle('active', tab === 'history');
    document.getElementById('tab-settings').classList.toggle('active', tab === 'settings');

    if (tab === 'settings') {
        if (typeof updateBatteryStatus === 'function') updateBatteryStatus();
        if (typeof updateAlarmStatus === 'function') updateAlarmStatus();
        if (typeof updateNotificationStatus === 'function') updateNotificationStatus();
        if (typeof updateOverlayStatus === 'function') updateOverlayStatus();
        if (typeof updateStorageUsage === 'function') updateStorageUsage();
    }
    if (tab === 'history' && !options.skipRenderHistory) {
        if (typeof renderHistory === 'function') renderHistory();
    }
}

function setViewMode(m) {
    const managerView = document.getElementById('manager-view');
    if (managerView) managerView.style.display = 'block';

    document.documentElement.style.height = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.body.style.backgroundColor = '#f8f9fa';
    document.body.style.padding = '16px';
    document.body.style.overflow = 'auto';
    document.body.style.transform = 'none';
    document.body.style.width = 'auto';

    if (typeof updateBatteryStatus === 'function') updateBatteryStatus();
    const savedInterval = localStorage.getItem('recheckInterval') || '0';
    const intervalInput = document.getElementById('recheckInterval');
    if (intervalInput) intervalInput.value = savedInterval;
    const markInput = document.getElementById('calendarMarkInput');
    if (markInput) markInput.value = calendarMark;
    if (typeof loadFloatingSettings === 'function') loadFloatingSettings();
    if (typeof render === 'function') render();
}

function toggleFloatingExpand(expand, fromAndroid = false) {
    isFloatingExpanded = expand;
    const collapsedEl = document.getElementById('floating-collapsed');
    const expandedEl = document.getElementById('floating-expanded');
    if (collapsedEl) collapsedEl.style.display = expand ? 'none' : 'flex';
    if (expandedEl) expandedEl.style.display = expand ? 'flex' : 'none';

    const scale = expand ?
        (localStorage.getItem('floatExpandedScale') || '1.0') :
        (localStorage.getItem('floatCollapsedScale') || '1.0');
    updateScale(scale);

    if (!fromAndroid && typeof Android !== 'undefined' && Android.toggleExpand) {
        Android.toggleExpand(expand);
    }

    if (inputtingCommentForTaskId !== null && typeof Android !== 'undefined' && Android.setFocusable) {
        Android.setFocusable(expand);
    }

    if (expand && inputtingCommentForTaskId !== null) {
        if (typeof Android !== 'undefined' && Android.requestHeight) {
            Android.requestHeight(150);
        }
    }
    if (typeof render === 'function') render();
}

function updateScale(scale) {
    if (mode !== 'floating') return;
    document.body.style.transform = `scale(${scale})`;
    document.body.style.transformOrigin = 'top left';
    document.body.style.width = (100 / parseFloat(scale)) + '%';
    document.body.style.height = (100 / parseFloat(scale)) + '%';
}

function setIsDragging(dragging) {
    isDragging = dragging;
}

function onFloatingPositionChanged(x, y, expanded) {
    if (expanded) {
        localStorage.setItem('floatExpandedX', x);
        localStorage.setItem('floatExpandedY', y);
    } else {
        localStorage.setItem('floatCollapsedX', x);
        localStorage.setItem('floatCollapsedY', y);
    }
    localStorage.setItem('floatX', x);
    localStorage.setItem('floatY', y);
}

function applyFloatingSettings(scale, expanded, dCount, sCount, showCheckedToggle, scrollButtonType, allowDrag, allowDragCollapsed, showHistoryButton, navType, widthPx, heightPx, showCloseButtonExpanded, keepServiceOnClose, menuActionDelay, hDelay) {
    if (mode === 'floating') {
        updateScale(scale);
        if (isFloatingExpanded !== expanded) {
            toggleFloatingExpand(expanded, true);
        }
        if (dCount !== undefined) {
            displayTaskCount = parseInt(dCount);
            localStorage.setItem('displayTaskCount', dCount);
        }
        if (sCount !== undefined) {
            scrollTaskCount = parseInt(sCount);
            localStorage.setItem('scrollTaskCount', sCount);
        }
        if (showCheckedToggle !== undefined) localStorage.setItem('showCheckedToggle', showCheckedToggle);
        if (scrollButtonType !== undefined) localStorage.setItem('scrollButtonType', scrollButtonType);
        if (allowDrag !== undefined) localStorage.setItem('allowDrag', allowDrag);
        if (allowDragCollapsed !== undefined) localStorage.setItem('allowDragCollapsed', allowDragCollapsed);
        if (showHistoryButton !== undefined) localStorage.setItem('showHistoryButton', showHistoryButton);
        if (navType !== undefined) localStorage.setItem('navType', navType);
        if (showCloseButtonExpanded !== undefined) localStorage.setItem('showCloseButtonExpanded', showCloseButtonExpanded);
        if (keepServiceOnClose !== undefined) localStorage.setItem('keepServiceOnClose', keepServiceOnClose);

        if (menuActionDelay !== undefined) localStorage.setItem('menuActionDelay', menuActionDelay);
        if (hDelay !== undefined) {
            checkedHideDelay = parseInt(hDelay);
            localStorage.setItem('checkedHideDelay', hDelay);
        }

        if (typeof refreshData === 'function') refreshData();
    }
}

function initializeApp() {
    try {
        if (typeof resetFloatingSettings === 'function') {
            if (localStorage.getItem('floatX') === null) resetFloatingSettings();
        }

        setViewMode(mode);
        applyLanguage();

        // URLパラメータによる初期タブの指定
        const initialTab = urlParams.get('tab');
        if (initialTab === 'settings') {
            switchTab('settings');
        }

        if (localStorage.getItem('appLanguage') === null) {
            const langModal = document.getElementById('languageModal');
            if (langModal) langModal.style.display = 'flex';
        }

        if (typeof checkDailyReset === 'function') checkDailyReset();
        if (typeof checkAutoBackup === 'function') checkAutoBackup();

        if (typeof updateAlarmStatus === 'function') updateAlarmStatus();
        if (typeof updateBatteryStatus === 'function') updateBatteryStatus();
        if (typeof updateNotificationStatus === 'function') updateNotificationStatus();
        if (typeof updateOverlayStatus === 'function') updateOverlayStatus();
        if (typeof updateCoinDisplay === 'function') updateCoinDisplay();

        const managerList = document.getElementById('managerTaskList');
        if (managerList) {
            managerList.addEventListener('touchstart', handleTouchStart, { passive: false });
            managerList.addEventListener('touchmove', handleTouchMove, { passive: false });
            managerList.addEventListener('touchend', handleTouchEnd, { passive: false });
        }
    } catch (e) {
        console.error("Initialization error:", e);
    }
}

function handleTouchStart(e) {
    if (!isEditMode) return;
    const handle = e.target.closest('.drag-handle');
    if (!handle) return;
    draggingElement = e.target.closest('.task-item');
    if (draggingElement) {
        draggingElement.classList.add('dragging');
        e.preventDefault();
    }
}

function handleTouchMove(e) {
    if (!draggingElement || !isEditMode) return;
    e.preventDefault();
    const touch = e.touches[0];
    const list = document.getElementById('managerTaskList');
    const afterElement = getDragAfterElement(list, touch.clientY);
    if (afterElement == null) {
        list.appendChild(draggingElement);
    } else {
        list.insertBefore(draggingElement, afterElement);
    }
}

function handleTouchEnd(e) {
    if (!draggingElement || !isEditMode) return;
    draggingElement.classList.remove('dragging');
    const newTasks = [];
    document.querySelectorAll('#managerTaskList .task-item').forEach(el => {
        const id = parseInt(el.getAttribute('data-id'));
        const task = tasks.find(t => t.id === id);
        if (task) newTasks.push(task);
    });
    tasks = newTasks;
    window.tasks = tasks;
    saveTasks();
    draggingElement = null;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

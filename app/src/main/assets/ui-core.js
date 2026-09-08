/**
 * UI Core and Navigation Logic
 */

let historyFilterPeriodType = 'all'; // all, day, week, month
let historyFilterPeriodValue = '';
let historyFilterQuery = '';
let inputtingCommentForTaskId = null;
let currentFloatingIndex = 0;
let draggingElement = null;
let isEditMode = false;
let isExportMode = false;
let isDeleteMode = false;
let selectedExportIds = new Set();
let selectedDeleteIds = new Set();
let currentCalendarDate = new Date();
let currentCalendarTaskId = null;
let editingTaskId = null;
let currentDuration = { h: "0", m: "0", s: "0" };
let currentTaskReminders = [];
let isMelodyTesting = false;
let tempVisibilityFlags = {
    timer: false,
    remind: false,
    comment: false,
    days: false,
    note: false
};
let isDurationPickerRequested = false;
let selectedCustomUri = null;
let selectedCustomName = null;
let isFloatingExpanded = (urlParams.get('expanded') === 'true');
let isDragging = false;
let pendingAction = null; // 'backup' or 'restore'
let isImportMode = false;
let pendingRestoreData = null;
let pendingRestoreOptions = null;

function handleBack() {
    // モーダルの優先順位（z-index順、およびDOMの定義順）でチェック

    // 0. 一時表示設定モーダル (z-index: 1150) - 最前面
    const tempVisibilityModal = document.getElementById('tempVisibilityModal');
    if (tempVisibilityModal && tempVisibilityModal.style.display === 'flex') {
        closeTemporaryVisibilityModal();
        return true;
    }

    // 1. カスタムモーダル (z-index: 1100)
    const customModal = document.getElementById('customModal');
    if (customModal && customModal.style.display === 'flex') {
        const cancelBtn = document.getElementById('modalCancelBtn');
        // キャンセルボタンが表示されている場合はそれをクリックしてコールバック等を走らせる
        if (cancelBtn && cancelBtn.style.display !== 'none') {
            cancelBtn.click();
        } else {
            closeModal();
        }
        return true;
    }

    // 2. タスク詳細/追加モーダル (z-index: 1050)
    const taskModal = document.getElementById('taskModal');
    if (taskModal && taskModal.style.display === 'flex') {
        closeTaskModal();
        return true;
    }

    // 3. 開発者設定モーダル (z-index: 1000)
    const developerModal = document.getElementById('developerModal');
    if (developerModal && developerModal.style.display === 'flex') {
        closeDeveloperModal();
        return true;
    }

    // 4. 編集メニューモーダル (z-index: 1000)
    const editMenuModal = document.getElementById('editMenuModal');
    if (editMenuModal && editMenuModal.style.display === 'flex') {
        closeEditMenu();
        return true;
    }

    // 5. 言語選択モーダル (z-index: 1000)
    const languageModal = document.getElementById('languageModal');
    if (languageModal && languageModal.style.display === 'flex') {
        languageModal.style.display = 'none';
        return true;
    }

    // 6. エクスポートモード / 削除モード
    if (isExportMode) {
        cancelExportMode();
        return true;
    }
    if (isDeleteMode) {
        cancelDeleteMode();
        return true;
    }

    // 7. フローティング設定詳細画面
    const floatingDetail = document.getElementById('settings-floating-detail');
    if (floatingDetail && floatingDetail.style.display === 'block') {
        closeFloatingSettings();
        return true;
    }

    // 8. 履歴のカレンダー表示（特定のタスクの履歴）
    if (currentCalendarTaskId !== null) {
        renderHistory();
        return true;
    }

    // 9. 履歴タブ / 設定タブからタスクタブへ戻る
    const historyContent = document.getElementById('history-content');
    const settingsContent = document.getElementById('settings-content');
    if ((historyContent && historyContent.style.display === 'block') ||
        (settingsContent && settingsContent.style.display === 'block')) {
        switchTab('tasks');
        return true;
    }

    return false;
}

function handleTouchStart(e) {
    // 編集モードでない場合はドラッグ不可
    if (!isEditMode) return;
    // ドラッグハンドル以外からのタッチは無視
    if (!e.target.classList.contains('drag-handle')) return;

    draggingElement = e.target.closest('.task-item');
    if (draggingElement) {
        draggingElement.classList.add('dragging');
        // スクロールを防止
        if (e.cancelable) e.preventDefault();
    }
}

function handleTouchMove(e) {
    if (!draggingElement) return;

    // タッチ位置の取得
    const touch = e.touches[0];
    const list = document.getElementById('managerTaskList');
    const items = Array.from(list.querySelectorAll('.task-item:not(.dragging)'));
    const touchY = touch.clientY;

    // 挿入先を特定
    const nextElement = items.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = touchY - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;

    if (nextElement == null) {
        list.appendChild(draggingElement);
    } else {
        list.insertBefore(draggingElement, nextElement);
    }

    if (e.cancelable) e.preventDefault();
}

function handleTouchEnd(e) {
    if (draggingElement) {
        draggingElement.classList.remove('dragging');
        const managerList = document.getElementById('managerTaskList');
        const newOrderIds = Array.from(managerList.children).map(li => parseInt(li.getAttribute('data-id')));
        const newTasks = [];
        const taskMap = new Map(tasks.map(t => [t.id, t]));
        newOrderIds.forEach(id => {
            const task = taskMap.get(id);
            if (task) {
                newTasks.push(task);
                taskMap.delete(id);
            }
        });
        // 万が一DOMになかったタスクがあれば末尾に残す
        taskMap.forEach(task => newTasks.push(task));
        tasks = newTasks;
        draggingElement = null; // saveTasksの前のrenderでスキップされないように先にnullにする

        // 完了済みが混ざっている状態で保存されるため、isEditModeを抜けた時に
        // 並べ替えがリセットされないように考慮が必要ですが、
        // tasks配列自体が真の順序となる。
        saveTasks();
    }
    draggingElement = null;
}

function switchTab(tab, options = {}) {
    if (tab !== 'history' || !options.skipRenderHistory) {
        currentCalendarTaskId = null;
    }
    // 設定画面から別のタブに移動する場合、フローティング設定が開いていれば閉じる
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
    }
    if (tab === 'history' && !options.skipRenderHistory) {
        if (typeof renderHistory === 'function') renderHistory();
    }
}

function setViewMode(m) {
    const managerView = document.getElementById('manager-view');
    if (managerView) {
        managerView.style.display = 'block';
    }

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
    const intervalSelect = document.getElementById('intervalSelect');
    if (intervalSelect) intervalSelect.value = savedInterval;
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

    // 倍率の再適用（個別の設定を反映させるため）
    const scale = expand ?
        (localStorage.getItem('floatExpandedScale') || '1.0') :
        (localStorage.getItem('floatCollapsedScale') || '1.0');
    updateScale(scale);

    // 背景（ドラッグハンドル）のクリック透過設定などをネイティブ側に任せる
    if (!fromAndroid && typeof Android !== 'undefined' && Android.toggleExpand) {
        Android.toggleExpand(expand);
    }

    // メモ入力中のフォーカス制御
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
        const inputX = document.getElementById('floatExpandedX');
        const inputY = document.getElementById('floatExpandedY');
        if (inputX) inputX.value = x;
        if (inputY) inputY.value = y;
    } else {
        localStorage.setItem('floatCollapsedX', x);
        localStorage.setItem('floatCollapsedY', y);
        const inputX = document.getElementById('floatCollapsedX');
        const inputY = document.getElementById('floatCollapsedY');
        if (inputX) inputX.value = x;
        if (inputY) inputY.value = y;
    }
    // 互換性キーも更新
    localStorage.setItem('floatX', x);
    localStorage.setItem('floatY', y);
}

function applyFloatingSettings(scale, expanded, dCount, sCount, showCheckedToggle, scrollButtonType, allowDrag, allowDragCollapsed, showHistoryButton, navType, widthPx, heightPx, showCloseButtonExpanded, keepServiceOnClose) {
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
        if (showCheckedToggle !== undefined) {
            localStorage.setItem('showCheckedToggle', showCheckedToggle);
        }
        if (scrollButtonType !== undefined) {
            localStorage.setItem('scrollButtonType', scrollButtonType);
        }
        if (allowDrag !== undefined) {
            localStorage.setItem('allowDrag', allowDrag);
        }
        if (allowDragCollapsed !== undefined) {
            localStorage.setItem('allowDragCollapsed', allowDragCollapsed);
        }
        if (showHistoryButton !== undefined) {
            localStorage.setItem('showHistoryButton', showHistoryButton);
        }
        if (navType !== undefined) {
            localStorage.setItem('navType', navType);
        }
        if (showCloseButtonExpanded !== undefined) {
            localStorage.setItem('showCloseButtonExpanded', showCloseButtonExpanded);
        }
        if (keepServiceOnClose !== undefined) {
            localStorage.setItem('keepServiceOnClose', keepServiceOnClose);
        }
        if (typeof refreshData === 'function') refreshData();
    }
}

function initializeApp() {
    try {
        // 初回起動時（設定未保存時）にデフォルト値を設定
        if (localStorage.getItem('floatX') === null) {
            if (typeof resetFloatingSettings === 'function') resetFloatingSettings();
        }

        // 表示モードの設定
        setViewMode(mode);

        // 言語設定の適用
        applyLanguage();

        // 初回起動時の言語選択
        if (localStorage.getItem('appLanguage') === null) {
            const langModal = document.getElementById('languageModal');
            if (langModal) langModal.style.display = 'flex';
        }

        // 日付変更チェックと権限状態の更新 (app.js の関数を呼び出し)
        if (typeof checkDailyReset === 'function') {
            checkDailyReset();
        }

        // 権限状態の更新
        if (typeof updateAlarmStatus === 'function') updateAlarmStatus();
        if (typeof updateBatteryStatus === 'function') updateBatteryStatus();
        if (typeof updateNotificationStatus === 'function') updateNotificationStatus();
        if (typeof updateOverlayStatus === 'function') updateOverlayStatus();
        if (typeof updateCoinDisplay === 'function') updateCoinDisplay();

        // 並べ替えのためのイベントリスナー登録 (DOMが確実にある状態で実行)
        const managerList = document.getElementById('managerTaskList');
        if (managerList) {
            managerList.addEventListener('touchstart', handleTouchStart, { passive: false });
            managerList.addEventListener('touchmove', handleTouchMove, { passive: false });
            managerList.addEventListener('touchend', handleTouchEnd, { passive: false });
        }

        console.log("App initialized and daily reset checked.");
    } catch (e) {
        console.error("Initialization error:", e);
    }
}

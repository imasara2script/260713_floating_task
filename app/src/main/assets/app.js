const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode') || 'manager';
window.urlParams = urlParams;
window.mode = mode;
let currentLang = 'ja';
window.currentLang = currentLang;

function getTranslation(key, ...args) {
    let text = (translations[currentLang] && translations[currentLang][key]) || translations['en'][key] || key;
    args.forEach((arg, i) => {
        text = text.replace(`{${i}}`, arg);
    });
    return text;
}
window.getTranslation = getTranslation;

function updateLanguagePreference() {
    const select = document.getElementById('languageSelect');
    const lang = select.value;
    localStorage.setItem('appLanguage', lang);
    applyLanguage();
    if (typeof Android !== 'undefined' && Android.setAppLanguage) {
        Android.setAppLanguage(lang);
    }
}
window.updateLanguagePreference = updateLanguagePreference;

function setLanguageInitial(lang) {
    localStorage.setItem('appLanguage', lang);
    applyLanguage();
    if (typeof Android !== 'undefined' && Android.setAppLanguage) {
        Android.setAppLanguage(lang);
    }
    document.getElementById('languageModal').style.display = 'none';
}
window.setLanguageInitial = setLanguageInitial;

function applyLanguage() {
    const savedLang = localStorage.getItem('appLanguage') || 'system';
    if (savedLang === 'system') {
        const sysLang = (typeof Android !== 'undefined' && Android.getSystemLanguage) ? Android.getSystemLanguage() : navigator.language;
        currentLang = sysLang.startsWith('ja') ? 'ja' : 'en';
    } else {
        currentLang = savedLang;
    }
    window.currentLang = currentLang;

    const select = document.getElementById('languageSelect');
    if (select) select.value = savedLang;

    // Translate static elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = getTranslation(key);
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = getTranslation(key);
    });

    if (typeof render === 'function') {
        render();
    }
}
window.applyLanguage = applyLanguage;

let isAdFree = false;
let isPremium = false;
window.isAdFree = isAdFree;
window.isPremium = isPremium;

function checkAdFree() {
    if (typeof Android !== 'undefined') {
        if (Android.isAdFree) isAdFree = Android.isAdFree();
        if (Android.isPremium) isPremium = Android.isPremium();
    }
    window.isAdFree = isAdFree;
    window.isPremium = isPremium;
}
window.checkAdFree = checkAdFree;

let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let history = JSON.parse(localStorage.getItem('taskHistory') || '[]');
let calendarMark = localStorage.getItem('calendarMark') || '⭕';
let bgThresholds = JSON.parse(localStorage.getItem('bgThresholds') || '[]');
window.tasks = tasks;
window.history = history;
window.calendarMark = calendarMark;
window.bgThresholds = bgThresholds;

if (bgThresholds.length === 0 && localStorage.getItem('bgThresholds') === null) {
    bgThresholds = [
        { threshold: 3600, bgColor: '#ffff00', textColor: '#000000' }, // 60分以下 -> 黄
        { threshold: 600, bgColor: '#ffc0cb', textColor: '#d9534f' }   // 10分以下 -> ピンク
    ];
    localStorage.setItem('bgThresholds', JSON.stringify(bgThresholds));
    window.bgThresholds = bgThresholds;
}

let showAllInFloating = localStorage.getItem('showAllInFloating') === 'true';
let displayTaskCount = parseInt(localStorage.getItem('displayTaskCount') || '1');
let scrollTaskCount = parseInt(localStorage.getItem('scrollTaskCount') || '1');
let checkedHideDelay = parseInt(localStorage.getItem('checkedHideDelay') || '2');
let timerDisplayMode = 'countdown'; // 'countdown' or 'endtime'
window.showAllInFloating = showAllInFloating;
window.displayTaskCount = displayTaskCount;
window.scrollTaskCount = scrollTaskCount;
window.checkedHideDelay = checkedHideDelay;
window.timerDisplayMode = timerDisplayMode;

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('taskHistory', JSON.stringify(history));
    if (typeof render === 'function') render();
    if (typeof Android !== 'undefined' && Android.onDataChanged) {
        Android.onDataChanged();
    }
}
window.saveTasks = saveTasks;

function refreshData() {
    tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    history = JSON.parse(localStorage.getItem('taskHistory') || '[]');
    displayTaskCount = parseInt(localStorage.getItem('displayTaskCount') || '1');
    scrollTaskCount = parseInt(localStorage.getItem('scrollTaskCount') || '1');
    window.tasks = tasks;
    window.history = history;
    window.displayTaskCount = displayTaskCount;
    window.scrollTaskCount = scrollTaskCount;

    checkAdFree();

    if (typeof updateBatteryStatus === 'function') updateBatteryStatus();
    if (typeof updateAlarmStatus === 'function') updateAlarmStatus();
    if (typeof updateNotificationStatus === 'function') updateNotificationStatus();
    if (typeof updateOverlayStatus === 'function') updateOverlayStatus();
    if (typeof render === 'function') render();
}
window.refreshData = refreshData;

function getTaskDaysText(task) {
    if (!task.selectedDays || task.selectedDays.length === 0) return '';
    const daysMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return task.selectedDays.map(d => getTranslation('calendar_' + daysMap[d])).join(', ');
}
window.getTaskDaysText = getTaskDaysText;

function getTaskTimerInfo(t) {
    if (t.targetTime) return '⏰ ' + t.targetTime;
    if (t.durationMs) return '⏳ ' + getTotalTimeText(t);
    return '';
}
window.getTaskTimerInfo = getTaskTimerInfo;

function getTotalTimeText(t) {
    if (!t.durationMs) return '';
    const hoursFloat = t.durationMs / 3600000;
    if (hoursFloat >= 1) {
        return `${hoursFloat.toFixed(1)}${getTranslation('unit_hour')}`;
    }
    const mins = Math.floor(t.durationMs / 60000);
    const secs = Math.floor((t.durationMs % 60000) / 1000);

    let res = '';
    if (mins > 0) res += mins + getTranslation('unit_min');
    if (secs > 0 || res === '') res += secs + getTranslation('unit_sec');
    return res;
}
window.getTotalTimeText = getTotalTimeText;

function getRemainingTimeText(t) {
    if (!t.durationMs) return '';
    const remaining = (t.startTime + t.durationMs) - Date.now();
    if (remaining <= 0) return `0${getTranslation('unit_sec')}`;

    const hoursFloat = remaining / 3600000;
    if (hoursFloat >= 1) {
        return `${hoursFloat.toFixed(1)}${getTranslation('unit_hour')}`;
    }

    const mins = Math.floor(remaining / 60000);
    if (mins > 0) {
        return `${mins}${getTranslation('unit_min')}`;
    }
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${secs}${getTranslation('unit_sec')}`;
}
window.getRemainingTimeText = getRemainingTimeText;

function getRemainingTimeTextDetailed(t) {
    if (!t.durationMs) return '';
    const remaining = (t.startTime + t.durationMs) - Date.now();
    if (remaining <= 0) return `0${getTranslation('unit_sec')}`;

    const hoursFloat = remaining / 3600000;
    if (hoursFloat >= 1) {
        return `${hoursFloat.toFixed(1)}${getTranslation('unit_hour')}`;
    }

    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);

    if (mins > 0) {
        return `${mins}${getTranslation('unit_min')}${secs}${getTranslation('unit_sec')}`;
    }
    return `${secs}${getTranslation('unit_sec')}`;
}
window.getRemainingTimeTextDetailed = getRemainingTimeTextDetailed;

function getEndTimeText(t) {
    if (!t.startTime || !t.durationMs) return '';
    const endTime = new Date(t.startTime + t.durationMs);
    const hh = String(endTime.getHours()).padStart(2, '0');
    const mm = String(endTime.getMinutes()).padStart(2, '0');
    const ss = String(endTime.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss} ${currentLang === 'ja' ? '終了' : 'End'}`;
}
window.getEndTimeText = getEndTimeText;

function getVisibleFloatingTasks() {
    const now = Date.now();
    const getGroupKey = (t) => {
        if (!t.selectedDays || t.selectedDays.length === 0) return '0_daily';
        return '1_' + t.selectedDays.sort((a, b) => a - b).join(',');
    };

    const pendingSorted = tasks.filter(t => !t.completed || (t.justCompletedUntil && now < t.justCompletedUntil)).sort((a, b) => {
        // 1. タイマー優先
        const aIsTimer = !!a.durationMs;
        const bIsTimer = !!b.durationMs;
        if (aIsTimer !== bIsTimer) return aIsTimer ? -1 : 1;

        // 2. 曜日設定でグループ化
        const aKey = getGroupKey(a);
        const bKey = getGroupKey(b);
        if (aKey !== bKey) return aKey.localeCompare(bKey);

        return 0;
    });
    if (showAllInFloating) {
        const completedSorted = tasks.filter(t => t.completed).sort((a, b) => {
            const aKey = getGroupKey(a);
            const bKey = getGroupKey(b);
            return aKey.localeCompare(bKey);
        });
        return [...pendingSorted, ...completedSorted];
    }
    return pendingSorted;
}
window.getVisibleFloatingTasks = getVisibleFloatingTasks;

function toggleShowAllInFloating() {
    showAllInFloating = !showAllInFloating;
    window.showAllInFloating = showAllInFloating;
    localStorage.setItem('showAllInFloating', showAllInFloating);
    if (typeof render === 'function') render();
}
window.toggleShowAllInFloating = toggleShowAllInFloating;

function checkDailyReset() {
    const lastReset = localStorage.getItem('lastResetDate');
    const today = new Date().toDateString();

    if (lastReset !== today) {
        const todayDay = new Date().getDay(); // 0 (Sun) to 6 (Sat)
        tasks = tasks.map(t => {
            // 曜日指定がある場合、今日が含まれているかチェック
            const shouldReset = !t.selectedDays || t.selectedDays.length === 0 || t.selectedDays.includes(todayDay);

            if (!shouldReset) return t;

            const updatedTask = { ...t, completed: false };
            // 時刻指定タスクの場合は、新しい日の指定時刻に向けて再計算
            if (t.targetTime) {
                const [hours, minutes] = t.targetTime.split(':').map(Number);
                const now = new Date();
                const target = new Date();
                target.setHours(hours, minutes, 0, 0);

                if (target <= now) {
                    target.setDate(target.getDate() + 1);
                }
                updatedTask.startTime = now.getTime();
                updatedTask.durationMs = target.getTime() - now.getTime();
            }

            if (typeof Android !== 'undefined' && Android.updateTaskCompletionState) {
                Android.updateTaskCompletionState(t.id, false);
            }

            return updatedTask;
        });
        window.tasks = tasks;
        localStorage.setItem('lastResetDate', today);
        saveTasks();
    }

    tasks.forEach(t => {
        if (t.durationMs && !t.completed) {
            const remaining = (t.startTime + t.durationMs) - Date.now();
            if (remaining > 0) {
                if (typeof Android !== 'undefined' && Android.setTimerAlarm) {
                    Android.setTimerAlarm(t.id, t.text, remaining, t.melody || 'default');
                }
            }
        }
    });

    if (typeof Android !== 'undefined' && Android.checkDailyCoinBonus) {
        if (Android.checkDailyCoinBonus()) {
            history.unshift({
                id: Date.now(),
                type: 'coin_daily',
                text: getTranslation('history_coin_daily'),
                memo: "",
                completedAt: new Date().toISOString()
            });
            if (history.length > 500) history.pop();
            window.history = history;
            saveTasks();
            if (typeof updateCoinDisplay === 'function') updateCoinDisplay();

            if (typeof showModal === 'function') {
                showModal(getTranslation('msg_daily_bonus_earned'), { hideCancel: true });
            }
        }
    }
    refreshData();
}
window.checkDailyReset = checkDailyReset;

function completeTaskWithMemo(taskId, memo) {
    tasks = tasks.map(t => {
        if (t.id === taskId) {
            // 履歴の作成
            const historyId = Date.now();
            history.unshift({
                id: historyId,
                taskId: t.id,
                text: t.text,
                memo: memo,
                completedAt: new Date().toISOString()
            });
            if (history.length > 500) history.pop();

            t.justCompletedUntil = Date.now() + (checkedHideDelay * 1000);
            setTimeout(() => {
                if (typeof render === 'function') render();
            }, checkedHideDelay * 1000);

            // 連続実行回数の更新 (タイマーなしタスクのみ)
            if (!t.durationMs) {
                const today = new Date().toDateString();
                const yesterday = new Date(Date.now() - 86400000).toDateString();
                if (t.lastCompletedDate === yesterday) {
                    t.streak = (t.streak || 0) + 1;
                } else if (t.lastCompletedDate !== today) {
                    t.streak = 1;
                }
                t.lastCompletedDate = today;
            }

            if (typeof Android !== 'undefined' && Android.updateTaskCompletionState) {
                Android.updateTaskCompletionState(t.id, true);
            }
            return { ...t, completed: true };
        }
        return t;
    });
    window.tasks = tasks;
    window.history = history;
    saveTasks();
}
window.completeTaskWithMemo = completeTaskWithMemo;

// ネイティブダイアログ用のコールバック管理
window._nativeConfirmCallbacks = {};

window.nativeConfirm = function(message, onResult) {
    if (typeof Android === 'undefined' || !Android.showConfirmDialog) {
        // ネイティブ機能が使えない場合は標準の confirm をフォールバックとして使用
        const res = confirm(message);
        if (onResult) onResult(res);
        return;
    }
    const callbackId = 'confirm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    window._nativeConfirmCallbacks[callbackId] = onResult;
    Android.showConfirmDialog(getTranslation('header_title'), message, callbackId);
};

window.onNativeConfirmResult = function(callbackId, result) {
    const callback = window._nativeConfirmCallbacks[callbackId];
    if (callback) {
        callback(result);
        delete window._nativeConfirmCallbacks[callbackId];
    }
};

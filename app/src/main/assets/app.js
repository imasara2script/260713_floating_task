const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode') || 'manager';
let currentLang = 'ja';

function getTranslation(key, ...args) {
    let text = (translations[currentLang] && translations[currentLang][key]) || translations['en'][key] || key;
    args.forEach((arg, i) => {
        text = text.replace(`{${i}}`, arg);
    });
    return text;
}

function updateLanguagePreference() {
    const select = document.getElementById('languageSelect');
    const lang = select.value;
    localStorage.setItem('appLanguage', lang);
    applyLanguage();
    if (typeof Android !== 'undefined' && Android.setAppLanguage) {
        Android.setAppLanguage(lang);
    }
}

function setLanguageInitial(lang) {
    localStorage.setItem('appLanguage', lang);
    applyLanguage();
    if (typeof Android !== 'undefined' && Android.setAppLanguage) {
        Android.setAppLanguage(lang);
    }
    document.getElementById('languageModal').style.display = 'none';
}

function applyLanguage() {
    const savedLang = localStorage.getItem('appLanguage') || 'system';
    if (savedLang === 'system') {
        const sysLang = (typeof Android !== 'undefined' && Android.getSystemLanguage) ? Android.getSystemLanguage() : navigator.language;
        currentLang = sysLang.startsWith('ja') ? 'ja' : 'en';
    } else {
        currentLang = savedLang;
    }

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

let isAdFree = false;
let isPremium = false;

function checkAdFree() {
    if (typeof Android !== 'undefined') {
        if (Android.isAdFree) isAdFree = Android.isAdFree();
        if (Android.isPremium) isPremium = Android.isPremium();
    }
}

let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let history = JSON.parse(localStorage.getItem('taskHistory') || '[]');
let calendarMark = localStorage.getItem('calendarMark') || '⭕';
let bgThresholds = JSON.parse(localStorage.getItem('bgThresholds') || '[]');

if (bgThresholds.length === 0 && localStorage.getItem('bgThresholds') === null) {
    bgThresholds = [
        { threshold: 3600, bgColor: '#ffff00', textColor: '#000000' }, // 60分以下 -> 黄
        { threshold: 600, bgColor: '#ffc0cb', textColor: '#d9534f' }   // 10分以下 -> ピンク
    ];
    localStorage.setItem('bgThresholds', JSON.stringify(bgThresholds));
}

let showAllInFloating = localStorage.getItem('showAllInFloating') === 'true';
let displayTaskCount = parseInt(localStorage.getItem('displayTaskCount') || '1');
let scrollTaskCount = parseInt(localStorage.getItem('scrollTaskCount') || '1');
let checkedHideDelay = parseInt(localStorage.getItem('checkedHideDelay') || '2');
let timerDisplayMode = 'countdown'; // 'countdown' or 'endtime'

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('taskHistory', JSON.stringify(history));
    if (typeof render === 'function') render();
    if (typeof Android !== 'undefined' && Android.onDataChanged) {
        Android.onDataChanged();
    }
}

function refreshData() {
    tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    history = JSON.parse(localStorage.getItem('taskHistory') || '[]');
    displayTaskCount = parseInt(localStorage.getItem('displayTaskCount') || '1');
    scrollTaskCount = parseInt(localStorage.getItem('scrollTaskCount') || '1');

    checkAdFree();

    if (typeof updateBatteryStatus === 'function') updateBatteryStatus();
    if (typeof updateAlarmStatus === 'function') updateAlarmStatus();
    if (typeof updateNotificationStatus === 'function') updateNotificationStatus();
    if (typeof updateOverlayStatus === 'function') updateOverlayStatus();
    if (typeof render === 'function') render();
}

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

function getEndTimeText(t) {
    if (!t.startTime || !t.durationMs) return '';
    const endTime = new Date(t.startTime + t.durationMs);
    const hh = String(endTime.getHours()).padStart(2, '0');
    const mm = String(endTime.getMinutes()).padStart(2, '0');
    const ss = String(endTime.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss} ${currentLang === 'ja' ? '終了' : 'End'}`;
}

function getVisibleFloatingTasks() {
    const now = Date.now();
    const pendingSorted = tasks.filter(t => !t.completed || (t.justCompletedUntil && now < t.justCompletedUntil)).sort((a, b) => {
        const aIsTimer = !!a.durationMs;
        const bIsTimer = !!b.durationMs;
        if (aIsTimer !== bIsTimer) return aIsTimer ? -1 : 1;
        return 0;
    });
    if (showAllInFloating) {
        return [...pendingSorted, ...tasks.filter(t => t.completed)];
    }
    return pendingSorted;
}

function toggleShowAllInFloating() {
    showAllInFloating = !showAllInFloating;
    localStorage.setItem('showAllInFloating', showAllInFloating);
    if (typeof render === 'function') render();
}

function checkDailyReset() {
    const lastReset = localStorage.getItem('lastResetDate');
    const today = new Date().toDateString();

    if (lastReset !== today) {
        tasks = tasks.map(t => {
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
            saveTasks();
            if (typeof updateCoinDisplay === 'function') updateCoinDisplay();

            if (typeof showModal === 'function') {
                showModal(getTranslation('msg_daily_bonus_earned'), { hideCancel: true });
            }
        }
    }
    refreshData();
}

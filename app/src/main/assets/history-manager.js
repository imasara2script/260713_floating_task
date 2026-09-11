/**
 * History and Calendar Management Logic
 */

function renderCalendar(targetTaskId, date = new Date()) {
    const calendarView = document.getElementById('calendar-view');
    const historyTitle = document.getElementById('history-title');
    const backBtn = document.getElementById('btn-back-history');
    const filterGroup = document.getElementById('history-filter');
    const markSettings = document.getElementById('calendar-mark-settings');
    const task = tasks.find(t => t.id === targetTaskId);

    if (!task) {
        if (calendarView) calendarView.style.display = 'none';
        if (markSettings) markSettings.style.display = 'none';
        currentCalendarTaskId = null;
        return;
    }

    currentCalendarTaskId = targetTaskId;
    currentCalendarDate = date;

    if (calendarView) calendarView.style.display = 'block';
    if (markSettings) {
        markSettings.style.display = 'block';
        const input = document.getElementById('calendarMarkInput');
        if (input) input.value = calendarMark;
    }
    if (filterGroup) filterGroup.style.display = 'none';
    if (historyTitle) {
        historyTitle.innerHTML = `${getTranslation('history_task_title', task.text)} ${!task.durationMs ? `<span class="streak-badge" onclick="editStreak(${task.id})" style="cursor:pointer; font-size:14px; background:#e9ecef; padding:2px 8px; border-radius:4px; margin-left:8px; color:#495057; font-weight:normal;" title="クリックして回数を編集">🔥 ${task.streak || 0}</span>` : ''}`;
    }
    if (backBtn) backBtn.style.display = 'inline-block';

    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const taskCompletions = history
        .filter(h => h.taskId === targetTaskId)
        .map(h => new Date(h.completedAt).toDateString());

    let html = `
        <div class="calendar-month" style="display: flex; justify-content: space-between; align-items: center;">
            <button class="btn-icon" onclick="changeMonth(-1)">◀</button>
            <span>${getTranslation('calendar_year_month', year, month + 1)}</span>
            <button class="btn-icon" onclick="changeMonth(1)">▶</button>
        </div>
        <div class="calendar-grid">
            <div class="calendar-day calendar-header">${getTranslation('calendar_sun')}</div>
            <div class="calendar-day calendar-header">${getTranslation('calendar_mon')}</div>
            <div class="calendar-day calendar-header">${getTranslation('calendar_tue')}</div>
            <div class="calendar-day calendar-header">${getTranslation('calendar_wed')}</div>
            <div class="calendar-day calendar-header">${getTranslation('calendar_thu')}</div>
            <div class="calendar-day calendar-header">${getTranslation('calendar_fri')}</div>
            <div class="calendar-day calendar-header">${getTranslation('calendar_sat')}</div>
    `;

    // 空白埋め
    for (let i = 0; i < firstDay.getDay(); i++) {
        html += '<div class="calendar-day other-month"></div>';
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
        const dateObj = new Date(year, month, d);
        const hasMark = taskCompletions.includes(dateObj.toDateString());
        html += `<div class="calendar-day ${hasMark ? 'has-mark' : ''}" data-mark="${calendarMark}">${d}</div>`;
    }

    html += '</div>';
    if (calendarView) calendarView.innerHTML = html;
}

function changeMonth(offset) {
    const newDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + offset, 1);
    renderCalendar(currentCalendarTaskId, newDate);
}

function renderTaskHistory(taskId) {
    // カレンダー表示モードを即座に有効にする
    currentCalendarTaskId = taskId;

    const historyList = document.getElementById('historyList');
    const historySummary = document.getElementById('history-summary');
    const filteredHistory = history.filter(h => h.taskId === taskId);

    if (typeof switchTab === 'function') switchTab('history', { skipRenderHistory: true });
    renderCalendar(taskId);

    if (historySummary) {
        historySummary.textContent = getTranslation('history_count', filteredHistory.length);
    }

    if (!historyList) return;

    if (filteredHistory.length === 0) {
        historyList.innerHTML = `<p style="color:#888; text-align:center;">${getTranslation('msg_task_history_empty')}</p>`;
        return;
    }

    historyList.innerHTML = filteredHistory.map(h => `
        <div class="history-item" onclick="editHistoryMemo(${h.id})">
            <div>${h.text}</div>
            <div class="history-date">${new Date(h.completedAt).toLocaleString()}</div>
            ${h.memo ? `<div class="history-memo">${h.memo}</div>` : ''}
        </div>
    `).join('');
}

function getISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return d.getUTCFullYear() + '-W' + String(weekNo).padStart(2, '0');
}

function setHistoryPeriodFilter(type) {
    historyFilterPeriodType = type;

    const now = new Date();
    const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const monthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const weekStr = getISOWeek(now);

    const filterDate = document.getElementById('filter-date');
    const filterWeek = document.getElementById('filter-week');
    const filterMonth = document.getElementById('filter-month');

    if (filterDate) filterDate.style.display = (type === 'day') ? 'inline-block' : 'none';
    if (filterWeek) filterWeek.style.display = (type === 'week') ? 'inline-block' : 'none';
    if (filterMonth) filterMonth.style.display = (type === 'month') ? 'inline-block' : 'none';

    if (type === 'day') {
        historyFilterPeriodValue = todayStr;
        if (filterDate) filterDate.value = todayStr;
    } else if (type === 'week') {
        historyFilterPeriodValue = weekStr;
        if (filterWeek) filterWeek.value = weekStr;
    } else if (type === 'month') {
        historyFilterPeriodValue = monthStr;
        if (filterMonth) filterMonth.value = monthStr;
    } else {
        historyFilterPeriodValue = '';
        if (filterDate) filterDate.value = '';
        if (filterWeek) filterWeek.value = '';
        if (filterMonth) filterMonth.value = '';
    }

    renderHistory();
}

function updateHistoryFilterValue(value) {
    historyFilterPeriodValue = value;
    renderHistory();
}

function updateHistoryQueryFilter(query) {
    historyFilterQuery = query.toLowerCase();
    renderHistory();
}

function renderHistory() {
    const historyList = document.getElementById('historyList');
    const historySummary = document.getElementById('history-summary');
    const calendarView = document.getElementById('calendar-view');
    const historyTitle = document.getElementById('history-title');
    const backBtn = document.getElementById('btn-back-history');
    const filterGroup = document.getElementById('history-filter');
    const markSettings = document.getElementById('calendar-mark-settings');

    if (!historyList) return;

    currentCalendarTaskId = null; // 全体履歴を表示する際はカレンダーモードを解除
    if (calendarView) calendarView.style.display = 'none';
    if (markSettings) markSettings.style.display = 'none';
    if (historyTitle) historyTitle.textContent = getTranslation('history_title');
    if (backBtn) backBtn.style.display = 'none';
    if (filterGroup) filterGroup.style.display = 'block';

    let filtered = history;

    // タスク名でフィルタリング (スペース区切りでの AND 検索に対応)
    if (historyFilterQuery) {
        const keywords = historyFilterQuery.split(/\s+/).filter(k => k.length > 0);
        if (keywords.length > 0) {
            filtered = filtered.filter(h => {
                const taskText = h.text.toLowerCase();
                return keywords.every(k => taskText.includes(k));
            });
        }
    }

    // 期間でフィルタリング
    if (historyFilterPeriodType !== 'all' && historyFilterPeriodValue) {
        if (historyFilterPeriodType === 'day') {
            filtered = filtered.filter(h => {
                const d = new Date(h.completedAt);
                const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                return dateStr === historyFilterPeriodValue;
            });
        } else if (historyFilterPeriodType === 'week') {
            filtered = filtered.filter(h => {
                const d = new Date(h.completedAt);
                const weekStr = getISOWeek(d);
                return weekStr === historyFilterPeriodValue;
            });
        } else if (historyFilterPeriodType === 'month') {
            filtered = filtered.filter(h => {
                const d = new Date(h.completedAt);
                const monthStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                return monthStr === historyFilterPeriodValue;
            });
        }
    }

    if (historySummary) {
        historySummary.textContent = getTranslation('history_count', filtered.length);
    }

    if (filtered.length === 0) {
        historyList.innerHTML = `<p style="color:#888; text-align:center;">${getTranslation('msg_history_no_data')}</p>`;
        return;
    }

    historyList.innerHTML = filtered.map(h => `
        <div class="history-item" onclick="editHistoryMemo(${h.id})">
            <div>${(h.type === 'coin' || h.type === 'coin_ad' || h.type === 'coin_daily') ? '🪙 ' : ''}${h.text}</div>
            <div class="history-date">${new Date(h.completedAt).toLocaleString()}</div>
            ${h.memo ? `<div class="history-memo">${h.memo}</div>` : ''}
        </div>
    `).join('');
}

function editHistoryMemo(historyId, isInitial = false, taskId = null) {
    let h, task;
    if (historyId) {
        h = history.find(item => item.id === historyId);
        if (!h) return;
        task = tasks.find(t => t.id === h.taskId);
    } else if (taskId) {
        task = tasks.find(t => t.id === taskId);
        if (!task) return;
    } else {
        return;
    }

    const dateStr = h ? new Date(h.completedAt).toLocaleString() : new Date().toLocaleString();
    const taskText = h ? h.text : task.text;
    const modalTitle = `${getTranslation('modal_edit_memo_title')}<div style="font-size: 14px; font-weight: normal; margin-top: 8px; color: #666; word-break: break-all;">${taskText}<br>${dateStr}</div>`;

    let initialMemo = (h && h.memo) ? h.memo : (task ? (task.note || "") : "");

    if (typeof showModal === 'function') {
        showModal(modalTitle, {
            useHTML: true,
            showTextarea: true,
            inputValue: initialMemo,
            placeholder: getTranslation('placeholder_history_memo'),
            cancelText: getTranslation('btn_no_comment'),
            confirmDiscard: true,
            onConfirm: (val) => {
                if (isInitial && taskId) {
                    if (typeof completeTaskWithMemo === 'function') completeTaskWithMemo(taskId, val);
                } else if (historyId) {
                    if (typeof saveHistoryMemo === 'function') saveHistoryMemo(historyId, val);
                }
            }
        });
    }
}

function clearHistory() {
    if (typeof showModal === 'function') {
        showModal(getTranslation('msg_history_clear_confirm'), {
            onConfirm: () => {
                history = [];
                if (typeof saveTasks === 'function') saveTasks();
                renderHistory();
            }
        });
    }
}

window.renderCalendar = renderCalendar;
window.changeMonth = changeMonth;
window.renderTaskHistory = renderTaskHistory;
window.renderHistory = renderHistory;
window.editHistoryMemo = editHistoryMemo;
window.clearHistory = clearHistory;

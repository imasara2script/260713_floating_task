/**
 * Manager View Rendering Logic
 */

function render() {
    if (typeof draggingElement !== 'undefined' && draggingElement) return;
    if (typeof checkAdFree === 'function') checkAdFree();

    const btnToggleEdit = document.getElementById('btn-toggle-edit');
    if (btnToggleEdit) {
        if (isEditMode) btnToggleEdit.textContent = getTranslation('btn_edit_sort');
        else if (isExportMode || isDeleteMode) btnToggleEdit.textContent = getTranslation('btn_edit_menu');
        else btnToggleEdit.textContent = getTranslation('btn_edit_list');
        btnToggleEdit.classList.toggle('btn-secondary', !isEditMode);
        btnToggleEdit.classList.toggle('btn-primary', isEditMode);
    }

    const addBtn = document.querySelector('#addTaskTrigger button');
    if (addBtn) {
        if (!isAdFree && tasks.length >= 3) {
            addBtn.textContent = getTranslation('btn_add_task_limit');
            addBtn.style.borderColor = '#dc3545';
            addBtn.style.color = '#dc3545';
        } else {
            addBtn.textContent = getTranslation('btn_add_task');
            addBtn.style.borderColor = '#007bff';
            addBtn.style.color = '#007bff';
        }
    }

    const managerTasks = isEditMode ? tasks : [
        ...tasks.filter(t => isPendingForDisplay(t)),
        ...tasks.filter(t => !isPendingForDisplay(t))
    ];

    const pendingTasks = tasks.filter(t => !t.completed);
    if (typeof Android !== 'undefined' && Android.updatePendingTaskCount) {
        try { Android.updatePendingTaskCount(pendingTasks.length); } catch(e) {}
    }

    const managerList = document.getElementById('managerTaskList');
    if (managerList) {
        const groups = [];
        const getGroupKey = (t) => {
            if (!t.selectedDays || t.selectedDays.length === 0) return 'daily';
            return t.selectedDays.sort((a, b) => a - b).join(',');
        };

        const groupedTasks = managerTasks.reduce((acc, t) => {
            const key = getGroupKey(t);
            if (!acc[key]) { acc[key] = []; groups.push(key); }
            acc[key].push(t);
            return acc;
        }, {});

        if (groups.includes('daily')) {
            const idx = groups.indexOf('daily');
            groups.splice(idx, 1);
            groups.unshift('daily');
        }

        let html = '';
        groups.forEach((key, groupIdx) => {
            const tasksInGroup = groupedTasks[key];
            if (key !== 'daily' || groupIdx > 0) {
                const headerText = key === 'daily' ? getTranslation('header_title') : getTaskDaysText(tasksInGroup[0]);
                html += `
                    <li class="group-header" style="list-style: none; margin-top: 16px; margin-bottom: 8px;">
                        <div style="font-weight: bold; font-size: 15px; color: #555;">${headerText}</div>
                        <hr style="border: 0; border-top: 1px solid #ddd; margin: 4px 0 8px 0;">
                    </li>
                `;
            }

            html += tasksInGroup.map((t) => {
                const isTimer = !!t.durationMs;
                const isExpired = isTimer && (t.startTime + t.durationMs <= Date.now());
                const timerDisplay = (isTimer && !t.completed) ?
                    (timerDisplayMode === 'countdown' ? `${getRemainingTimeTextDetailed(t)} / ${getTotalTimeText(t)}` : getEndTimeText(t)) : '';

                return `
                <li class="task-item ${isTimer && !t.completed ? 'timer-active' : ''}" data-id="${t.id}">
                    ${isEditMode ? '<span class="drag-handle">☰</span>' : ''}
                    ${isExportMode ? `<input type="checkbox" ${selectedExportIds.has(t.id) ? 'checked' : ''} onchange="toggleExportSelection(${t.id}); render();">` : ''}
                    ${isDeleteMode ? `<input type="checkbox" ${selectedDeleteIds.has(t.id) ? 'checked' : ''} onchange="toggleDeleteSelection(${t.id}); render();">` : ''}
                    ${!isEditMode && !isExportMode && !isDeleteMode ? (
                        t.showCommentOnCheck && !t.completed ?
                        `<span onclick="toggleTask(${t.id})" style="cursor:pointer; margin-right:8px; font-size:18px; display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px;">✏️</span>` :
                        `<input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask(${t.id})">`
                    ) : ''}
                    ${isTimer && !t.completed ? `<span class="timer-badge manager-timer-badge ${isExpired ? 'timer-expired' : ''}" data-task-id="${t.id}" onclick="toggleTimerDisplayMode()" style="cursor:pointer;">${timerDisplay}</span>` : ''}
                    <span class="task-text ${t.completed ? 'completed' : ''} editable" onclick="${isExportMode ? `toggleExportSelection(${t.id}); render();` : (isDeleteMode ? `toggleDeleteSelection(${t.id}); render();` : `editTask(${t.id})`)}">${t.text}</span>
                    ${isTimer && !isEditMode && !isExportMode && !isDeleteMode ? `<button class="btn-icon" onclick="repeatTimer(${t.id})" title="リピート">🔄</button>` : ''}
                </li>
                `;
            }).join('');
        });
        managerList.innerHTML = html;
    }

    const historyContent = document.getElementById('history-content');
    if (historyContent && historyContent.style.display === 'block' && currentCalendarTaskId === null) {
        if (typeof renderHistory === 'function') renderHistory();
    }

    if (typeof updateStorageUsage === 'function') {
        updateStorageUsage();
    }
}

function updateTimersOnly() {
    if (typeof draggingElement !== 'undefined' && draggingElement) return;
    tasks.forEach(t => {
        if (t.durationMs && !t.completed) {
            const isExpired = (t.startTime + t.durationMs <= Date.now());
            const timerDisplay = (timerDisplayMode === 'countdown' ? `${getRemainingTimeTextDetailed(t)} / ${getTotalTimeText(t)}` : getEndTimeText(t));
            document.querySelectorAll(`.manager-timer-badge[data-task-id="${t.id}"]`).forEach(el => {
                if (el.textContent !== timerDisplay) el.textContent = timerDisplay;
                el.classList.toggle('timer-expired', isExpired);
            });
        }
    });
}

// 定期的にUIを更新
setInterval(() => {
    const hasActiveTimers = tasks.some(t => t.durationMs && !t.completed);
    if (hasActiveTimers) updateTimersOnly();
}, 1000);

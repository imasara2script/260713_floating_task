/**
 * Task Management Logic
 */

function addTask() {
    console.log("addTask called");
    const input = document.getElementById('taskInput');
    const text = input ? input.value.trim() : "";
    const noteInput = document.getElementById('taskNote');
    const note = noteInput ? noteInput.value.trim() : "";
    const timeInput = document.getElementById('timeValue');
    const unitSelect = document.getElementById('timerUnit');
    const melodySelect = document.getElementById('melodySelect');

    if (!text) {
        showModal(getTranslation('msg_input_task_name'), {
            hideCancel: true,
            onConfirm: () => { if (input) input.focus(); }
        });
        return;
    }

    let targetTask;
    if (editingTaskId) {
        targetTask = tasks.find(t => t.id === editingTaskId);
        if (targetTask) {
            targetTask.text = text;
            targetTask.note = note;
            targetTask.showCommentOnCheck = document.getElementById('showCommentOnCheck').checked;
            targetTask.selectedDays = Array.from(document.querySelectorAll('.reset-day-check:checked')).map(el => parseInt(el.value));
        }
    } else {
        const id = Date.now();
        targetTask = {
            id: id,
            text: text,
            note: note,
            completed: false,
            showCommentOnCheck: document.getElementById('showCommentOnCheck').checked,
            selectedDays: Array.from(document.querySelectorAll('.reset-day-check:checked')).map(el => parseInt(el.value))
        };
    }

    if (!targetTask) return;

    if (unitSelect && unitSelect.value !== 'none') {
        let durationMs = 0;
        let startTime = Date.now();
        let targetTimeStr = null;

        if (unitSelect.value === 'at') {
            const timeVal = timeInput ? timeInput.value : "";
            if (!timeVal) {
                showModal(getTranslation('msg_input_timer_val'), {
                    hideCancel: true,
                    onConfirm: () => { if (timeInput) timeInput.focus(); }
                });
                return;
            }
            targetTimeStr = timeVal;
            const [hours, minutes] = timeVal.split(':').map(Number);
            const now = new Date();
            const target = new Date();
            target.setHours(hours, minutes, 0, 0);

            if (target <= now) {
                target.setDate(target.getDate() + 1);
            }
            durationMs = target.getTime() - now.getTime();
            startTime = now.getTime();
        } else if (unitSelect.value === 'duration') {
            durationMs = (parseFloat(currentDuration.h) * 3600 + parseFloat(currentDuration.m) * 60 + parseFloat(currentDuration.s)) * 1000;
        }

        if (durationMs <= 0) {
            showModal(getTranslation('msg_input_timer_val'), {
                hideCancel: true,
                onConfirm: () => requestDurationPicker()
            });
            return;
        }
        targetTask.durationParts = { ...currentDuration };

        let melody = melodySelect ? melodySelect.value : "default";
        let melodyName = null;

        if (melody === 'custom' && selectedCustomUri) {
            melody = selectedCustomUri;
            melodyName = selectedCustomName;
        }

        let isConfigChanged = true;
        if (editingTaskId) {
            const originalTask = tasks.find(t => t.id === editingTaskId);
            if (originalTask && originalTask.durationMs === durationMs && originalTask.targetTime === targetTimeStr) {
                isConfigChanged = false;
            }
        }

        if (isConfigChanged) {
            targetTask.startTime = startTime;
            targetTask.durationMs = durationMs;
            if (targetTimeStr) {
                targetTask.targetTime = targetTimeStr;
            } else {
                delete targetTask.targetTime;
            }
        }

        targetTask.melody = melody;
        if (melodyName) targetTask.melodyName = melodyName;

        if (typeof Android !== 'undefined' && Android.setTimerAlarm) {
            if (isConfigChanged) {
                Android.setTimerAlarm(targetTask.id, text, durationMs, melody);
            } else {
                const remaining = (targetTask.startTime + targetTask.durationMs) - Date.now();
                if (remaining > 0) {
                    Android.setTimerAlarm(targetTask.id, text, remaining, melody);
                }
            }
        }
        delete targetTask.reminders;
        if (typeof Android !== 'undefined' && Android.setReminderAlarms) {
            Android.setReminderAlarms(targetTask.id, text, "[]");
        }
    } else {
        delete targetTask.startTime;
        delete targetTask.durationMs;
        delete targetTask.targetTime;
        delete targetTask.melody;

        const validReminders = currentTaskReminders.filter(r => r.time).map(r => ({ time: r.time, message: r.message }));
        targetTask.reminders = validReminders;
        if (typeof Android !== 'undefined' && Android.setReminderAlarms) {
            Android.setReminderAlarms(targetTask.id, text, JSON.stringify(validReminders));
        }
        if (typeof Android !== 'undefined' && Android.updateTaskCompletionState) {
            Android.updateTaskCompletionState(targetTask.id, targetTask.completed);
        }
    }

    if (!editingTaskId) {
        tasks.unshift(targetTask);
    }

    saveTasks();
    closeTaskModal();
}
window.addTask = addTask;

function repeatTimer(id) {
    let historyIdToEdit = null;
    tasks = tasks.map(t => {
        if (t.id === id && t.durationMs) {
            const melody = t.melody || 'default';
            if (typeof Android !== 'undefined' && Android.setTimerAlarm) {
                Android.setTimerAlarm(t.id, t.text, t.durationMs, melody);
            }
            const historyId = Date.now();
            history.unshift({ id: historyId, taskId: t.id, text: t.text + getTranslation('repeat_suffix'), memo: "", completedAt: new Date().toISOString() });
            if (history.length > 500) history.pop();
            if (t.showCommentOnCheck) historyIdToEdit = historyId;
            return { ...t, startTime: Date.now(), completed: false };
        }
        return t;
    });
    saveTasks();
    if (historyIdToEdit && typeof editHistoryMemo === 'function') editHistoryMemo(historyIdToEdit, true);
}
window.repeatTimer = repeatTimer;

function toggleTimerDisplayMode() {
    timerDisplayMode = (timerDisplayMode === 'countdown') ? 'endtime' : 'countdown';
    if (typeof render === 'function') render();
}
window.toggleTimerDisplayMode = toggleTimerDisplayMode;

function toggleTask(id) {
    let taskIdToCompleteWithMemo = null;
    tasks = tasks.map(t => {
        if (t.id === id) {
            const newState = !t.completed;
            if (newState) {
                if (t.showCommentOnCheck) {
                    taskIdToCompleteWithMemo = id;
                    return t;
                }
                const historyId = Date.now();
                history.unshift({ id: historyId, taskId: t.id, text: t.text, memo: "", completedAt: new Date().toISOString() });
                if (history.length > 500) history.pop();
                if (!t.durationMs) {
                    const today = new Date().toDateString();
                    const yesterday = new Date(Date.now() - 86400000).toDateString();
                    if (t.lastCompletedDate === yesterday) t.streak = (t.streak || 0) + 1;
                    else if (t.lastCompletedDate !== today) t.streak = 1;
                    t.lastCompletedDate = today;
                }
                t.justCompletedUntil = Date.now() + (checkedHideDelay * 1000);
                setTimeout(() => { if (typeof render === 'function') render(); }, checkedHideDelay * 1000);
            } else {
                t.justUncompletedUntil = Date.now() + (checkedHideDelay * 1000);
                setTimeout(() => { if (typeof render === 'function') render(); }, checkedHideDelay * 1000);
            }
            if (typeof Android !== 'undefined' && Android.updateTaskCompletionState) {
                Android.updateTaskCompletionState(t.id, newState);
            }
            return { ...t, completed: newState };
        }
        return t;
    });
    saveTasks();
    if (taskIdToCompleteWithMemo && typeof editHistoryMemo === 'function') editHistoryMemo(null, true, taskIdToCompleteWithMemo);
}
window.toggleTask = toggleTask;

function editStreak(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    showModal('連続実行回数を変更:', {
        showInput: true,
        inputType: 'number',
        inputValue: task.streak || 0,
        onConfirm: (val) => {
            const newStreak = parseInt(val);
            if (!isNaN(newStreak)) {
                tasks = tasks.map(t => {
                    if (t.id === id) {
                        const today = new Date().toDateString();
                        const yesterday = new Date(Date.now() - 86400000).toDateString();
                        return { ...t, streak: newStreak, lastCompletedDate: t.completed ? today : yesterday };
                    }
                    return t;
                });
                saveTasks();
            }
        }
    });
}
window.editStreak = editStreak;

function deleteTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        showModal(getTranslation('msg_delete_confirm', task.text), {
            onConfirm: () => {
                if (task.reminders && typeof Android !== 'undefined' && Android.setReminderAlarms) {
                    Android.setReminderAlarms(task.id, task.text, "[]");
                }
                tasks = tasks.filter(t => t.id !== id);
                saveTasks();
                closeTaskModal();
            }
        });
    }
}
window.deleteTask = deleteTask;

function deleteTaskFromModal() {
    if (editingTaskId) deleteTask(editingTaskId);
}
window.deleteTaskFromModal = deleteTaskFromModal;

function editTask(id) {
    if (typeof openTaskModal === 'function') openTaskModal(id);
}
window.editTask = editTask;

function handleMelodyChange() {
    if (isMelodyTesting && typeof stopMelodyTest === 'function') stopMelodyTest();
    const select = document.getElementById('melodySelect');
    if (select && select.value === 'custom') {
        if (typeof Android !== 'undefined' && Android.pickRingtone) Android.pickRingtone();
    } else {
        const nameEl = document.getElementById('customMelodyName');
        if (nameEl) nameEl.style.display = 'none';
        selectedCustomUri = null;
        selectedCustomName = null;
    }
}
window.handleMelodyChange = handleMelodyChange;

function onRingtoneSelected(uri, title) {
    if (isMelodyTesting && typeof stopMelodyTest === 'function') stopMelodyTest();
    selectedCustomUri = uri;
    selectedCustomName = title;
    const nameEl = document.getElementById('customMelodyName');
    if (nameEl) {
        nameEl.textContent = '選択中: ' + title;
        nameEl.style.display = 'block';
    }
}
window.onRingtoneSelected = onRingtoneSelected;

function openEditMenu() {
    if (isEditMode) { toggleEditMode(); return; }
    if (isExportMode) { cancelExportMode(); return; }
    if (isDeleteMode) { cancelDeleteMode(); return; }
    const modal = document.getElementById('editMenuModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.onclick = (e) => { if (e.target === modal) closeEditMenu(); };
    }
}
window.openEditMenu = openEditMenu;

function closeEditMenu() {
    const modal = document.getElementById('editMenuModal');
    if (modal) modal.style.display = 'none';
}
window.closeEditMenu = closeEditMenu;

function startSortMode() {
    closeEditMenu();
    toggleEditMode();
}
window.startSortMode = startSortMode;

function startExportMode() {
    closeEditMenu();
    isExportMode = true;
    selectedExportIds.clear();
    const title = document.getElementById('export-panel-title');
    const btn = document.getElementById('btn-execute-action');
    const ctrl = document.getElementById('export-controls');
    const trigger = document.getElementById('addTaskTrigger');
    if (title) title.textContent = getTranslation('panel_export_title');
    if (btn) btn.textContent = getTranslation('btn_export_exec');
    if (ctrl) ctrl.style.display = 'block';
    if (trigger) trigger.style.display = 'none';
    if (typeof render === 'function') render();
}
window.startExportMode = startExportMode;

function cancelExportMode() {
    isExportMode = false;
    selectedExportIds.clear();
    const ctrl = document.getElementById('export-controls');
    const trigger = document.getElementById('addTaskTrigger');
    if (ctrl) ctrl.style.display = 'none';
    if (trigger) trigger.style.display = 'block';
    if (typeof render === 'function') render();
}
window.cancelExportMode = cancelExportMode;

function toggleExportSelection(id) {
    if (selectedExportIds.has(id)) selectedExportIds.delete(id);
    else selectedExportIds.add(id);
}
window.toggleExportSelection = toggleExportSelection;

function executeExportTasks() {
    if (selectedExportIds.size === 0) {
        showModal(getTranslation('msg_export_select'), { hideCancel: true });
        return;
    }
    const selectedTasks = tasks.filter(t => selectedExportIds.has(t.id));
    const data = { type: 'partial_tasks', tasks: selectedTasks };
    if (typeof Android !== 'undefined' && Android.backupData) Android.backupData(JSON.stringify(data));
    cancelExportMode();
}
window.executeExportTasks = executeExportTasks;

function startDeleteMode() {
    closeEditMenu();
    isDeleteMode = true;
    selectedDeleteIds.clear();
    const title = document.getElementById('export-panel-title');
    const btn = document.getElementById('btn-execute-action');
    const ctrl = document.getElementById('export-controls');
    const trigger = document.getElementById('addTaskTrigger');
    if (title) title.textContent = getTranslation('panel_delete_title');
    if (btn) {
        btn.textContent = getTranslation('btn_delete_exec');
        btn.classList.replace('btn-primary', 'btn-danger');
        btn.onclick = executeDeleteTasks;
    }
    if (ctrl) {
        ctrl.style.display = 'block';
        ctrl.style.background = '#fff5f5';
        ctrl.style.borderColor = '#ffdada';
    }
    if (trigger) trigger.style.display = 'none';
    if (typeof render === 'function') render();
}
window.startDeleteMode = startDeleteMode;

function cancelDeleteMode() {
    isDeleteMode = false;
    selectedDeleteIds.clear();
    const ctrl = document.getElementById('export-controls');
    const trigger = document.getElementById('addTaskTrigger');
    const title = document.getElementById('export-panel-title');
    const btn = document.getElementById('btn-execute-action');
    if (ctrl) ctrl.style.display = 'none';
    if (trigger) trigger.style.display = 'block';
    if (title) title.textContent = getTranslation('panel_export_title');
    if (btn) {
        btn.textContent = getTranslation('btn_export_exec');
        btn.classList.replace('btn-danger', 'btn-primary');
        btn.onclick = executeExportTasks;
    }
    if (typeof render === 'function') render();
}
window.cancelDeleteMode = cancelDeleteMode;

function toggleDeleteSelection(id) {
    if (selectedDeleteIds.has(id)) selectedDeleteIds.delete(id);
    else selectedDeleteIds.add(id);
}
window.toggleDeleteSelection = toggleDeleteSelection;

function executeDeleteTasks() {
    if (selectedDeleteIds.size === 0) {
        showModal(getTranslation('msg_delete_select'), { hideCancel: true });
        return;
    }
    showModal(getTranslation('msg_delete_bulk_confirm', selectedDeleteIds.size), {
        onConfirm: () => {
            tasks.forEach(t => {
                if (selectedDeleteIds.has(t.id)) {
                    if (t.reminders && typeof Android !== 'undefined' && Android.setReminderAlarms) {
                        Android.setReminderAlarms(t.id, t.text, "[]");
                    }
                }
            });
            tasks = tasks.filter(t => !selectedDeleteIds.has(t.id));
            saveTasks();
            cancelDeleteMode();
        }
    });
}
window.executeDeleteTasks = executeDeleteTasks;

function completeTaskWithMemo(taskId, memo) {
    tasks = tasks.map(t => {
        if (t.id === taskId) {
            const historyId = Date.now();
            history.unshift({ id: historyId, taskId: t.id, text: t.text, memo: memo, completedAt: new Date().toISOString() });
            if (history.length > 500) history.pop();
            t.justCompletedUntil = Date.now() + (checkedHideDelay * 1000);
            setTimeout(() => { if (typeof render === 'function') render(); }, checkedHideDelay * 1000);
            if (!t.durationMs) {
                const today = new Date().toDateString();
                const yesterday = new Date(Date.now() - 86400000).toDateString();
                if (t.lastCompletedDate === yesterday) t.streak = (t.streak || 0) + 1;
                else if (t.lastCompletedDate !== today) t.streak = 1;
                t.lastCompletedDate = today;
            }
            if (typeof Android !== 'undefined' && Android.updateTaskCompletionState) Android.updateTaskCompletionState(t.id, true);
            return { ...t, completed: true };
        }
        return t;
    });
    saveTasks();
}
window.completeTaskWithMemo = completeTaskWithMemo;

function saveHistoryMemo(historyId, memo) {
    history = history.map(h => { if (h.id === historyId) return { ...h, memo: memo }; return h; });
    saveTasks();
    if (currentCalendarTaskId) { if (typeof renderTaskHistory === 'function') renderTaskHistory(currentCalendarTaskId); }
    else { if (typeof renderHistory === 'function') renderHistory(); }
}
window.saveHistoryMemo = saveHistoryMemo;

function testReminder(id) {
    const r = currentTaskReminders.find(x => x.id == id);
    if (!r) return;
    const taskInput = document.getElementById('taskInput');
    const taskText = (taskInput ? taskInput.value : "") || "Test Task";
    if (typeof Android !== 'undefined' && Android.testReminderNotification) Android.testReminderNotification(taskText, r.message);
}
window.testReminder = testReminder;

function addReminderItem(time = "", message = "") {
    const id = Date.now() + Math.random();
    currentTaskReminders.push({ id, time, message });
    renderReminderList();
}
window.addReminderItem = addReminderItem;

function removeReminderItem(id) {
    currentTaskReminders = currentTaskReminders.filter(r => r.id !== id);
    renderReminderList();
}
window.removeReminderItem = removeReminderItem;

function renderReminderList() {
    const list = document.getElementById('reminderList');
    if (!list) return;
    list.innerHTML = currentTaskReminders.map(r => `
        <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 6px; border: 1px solid #eee;">
            <div style="display: flex; gap: 4px; align-items: center;">
                <input type="time" value="${r.time}" onchange="updateReminderData('${r.id}', 'time', this.value)" style="padding: 4px; border-radius: 4px; border: 1px solid #ddd; font-size: 14px; background: white;">
                <button class="btn btn-secondary" onclick="testReminder('${r.id}')" style="padding: 4px 8px; font-size: 11px;" data-i18n="btn_test_notification">${getTranslation('btn_test_notification')}</button>
                <button class="btn-icon" onclick="removeReminderItem('${r.id}')" style="margin-left: auto;">🗑️</button>
            </div>
            <input type="text" value="${r.message}" placeholder="${getTranslation('placeholder_reminder_msg')}" oninput="updateReminderData('${r.id}', 'message', this.value)" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; box-sizing: border-box;">
        </div>
    `).join('');
}
window.renderReminderList = renderReminderList;

function updateReminderData(id, field, value) {
    const r = currentTaskReminders.find(x => x.id == id);
    if (r) r[field] = value;
}
window.updateReminderData = updateReminderData;

function viewHistoryFromModal() {
    if (editingTaskId) {
        const id = editingTaskId;
        if (typeof closeTaskModal === 'function') closeTaskModal();
        if (typeof renderTaskHistory === 'function') renderTaskHistory(id);
    }
}
window.viewHistoryFromModal = viewHistoryFromModal;

function toggleEditMode() {
    isEditMode = !isEditMode;
    if (typeof render === 'function') render();
}
window.toggleEditMode = toggleEditMode;

function handleTouchStart(e) {
    if (!isEditMode || !e.target.classList.contains('drag-handle')) return;
    draggingElement = e.target.closest('.task-item');
    if (draggingElement) { draggingElement.classList.add('dragging'); if (e.cancelable) e.preventDefault(); }
}
window.handleTouchStart = handleTouchStart;

function handleTouchMove(e) {
    if (!draggingElement) return;
    const touch = e.touches[0];
    const list = document.getElementById('managerTaskList');
    const items = Array.from(list.querySelectorAll('.task-item:not(.dragging)'));
    const touchY = touch.clientY;
    const nextElement = items.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = touchY - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
    if (nextElement == null) list.appendChild(draggingElement);
    else list.insertBefore(draggingElement, nextElement);
    if (e.cancelable) e.preventDefault();
}
window.handleTouchMove = handleTouchMove;

function handleTouchEnd(e) {
    if (draggingElement) {
        draggingElement.classList.remove('dragging');
        const managerList = document.getElementById('managerTaskList');
        if (!managerList) return;
        const newOrderIds = Array.from(managerList.children).map(li => parseInt(li.getAttribute('data-id')));
        const newTasks = [];
        const taskMap = new Map(tasks.map(t => [t.id, t]));
        newOrderIds.forEach(id => { const task = taskMap.get(id); if (task) { newTasks.push(task); taskMap.delete(id); } });
        taskMap.forEach(task => newTasks.push(task));
        tasks = newTasks;
        draggingElement = null;
        saveTasks();
    }
    draggingElement = null;
}
window.handleTouchEnd = handleTouchEnd;

function toggleMelodyTest() {
    console.log("toggleMelodyTest: isMelodyTesting=" + isMelodyTesting);
    if (isMelodyTesting) stopMelodyTest();
    else playMelodyTest();
}
window.toggleMelodyTest = toggleMelodyTest;

function playMelodyTest() {
    const melodySelect = document.getElementById('melodySelect');
    if (!melodySelect) { console.error("melodySelect not found"); return; }
    let melody = melodySelect.value;
    console.log("playMelodyTest: melody=" + melody);
    if (melody === 'none') return;
    if (melody === 'custom' && selectedCustomUri) melody = selectedCustomUri;
    if (typeof Android !== 'undefined' && Android.playMelody) {
        console.log("Calling Android.playMelody(" + melody + ")");
        Android.playMelody(melody);
    } else {
        console.error("Android.playMelody not available");
    }
    isMelodyTesting = true;
    const btn = document.getElementById('btn-test-melody');
    if (btn) {
        btn.textContent = getTranslation('btn_stop_melody');
        btn.classList.replace('btn-secondary', 'btn-danger');
    }
}
window.playMelodyTest = playMelodyTest;

function stopMelodyTest() {
    console.log("stopMelodyTest");
    if (typeof Android !== 'undefined' && Android.stopMelody) Android.stopMelody();
    isMelodyTesting = false;
    const btn = document.getElementById('btn-test-melody');
    if (btn) {
        btn.textContent = getTranslation('btn_test_melody');
        btn.classList.replace('btn-danger', 'btn-secondary');
    }
}
window.stopMelodyTest = stopMelodyTest;

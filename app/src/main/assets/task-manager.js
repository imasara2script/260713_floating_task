/**
 * Task Data and Operation Management Logic
 */

function addTask() {
    console.log("addTask called");
    const input = document.getElementById('taskInput');
    const text = input ? input.value.trim() : "";
    const noteInput = document.getElementById('taskNote');
    const note = noteInput ? noteInput.value.trim() : "";
    const referenceDateInput = document.getElementById('referenceDate');
    const referenceDate = referenceDateInput ? referenceDateInput.value : "";
    const timeInput = document.getElementById('timeValue');
    const unitSelect = document.getElementById('timerUnit');
    const melodySelect = document.getElementById('melodySelect');
    const melodyModeSelect = document.getElementById('melodyMode');

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
            targetTask.type = unitSelect ? unitSelect.value : "none";
            targetTask.referenceDate = referenceDate;
            targetTask.showCommentOnCheck = document.getElementById('showCommentOnCheck').checked;
            targetTask.selectedDays = Array.from(document.querySelectorAll('.reset-day-check:checked')).map(el => parseInt(el.value));
            targetTask.melodyMode = melodyModeSelect ? melodyModeSelect.value : "once";
        }
    } else {
        const id = Date.now();
        targetTask = {
            id: id,
            text: text,
            note: note,
            type: unitSelect ? unitSelect.value : "none",
            referenceDate: referenceDate,
            completed: false,
            showCommentOnCheck: document.getElementById('showCommentOnCheck').checked,
            selectedDays: Array.from(document.querySelectorAll('.reset-day-check:checked')).map(el => parseInt(el.value)),
            melodyMode: melodyModeSelect ? melodyModeSelect.value : "once"
        };
    }

    if (!targetTask) return;

    // ハイパーリンクの収集 (全タスク共通)
    const validLinks = (currentTaskLinks || []).filter(l => l.url).map(l => ({ url: l.url, text: l.text }));
    targetTask.links = validLinks;

    if (unitSelect && unitSelect.value !== 'none') {
        let durationMs = 0;
        let startTime = Date.now();
        let targetTimeStr = null;

        if (unitSelect.value === 'at') {
            const timeVal = timeInput ? timeInput.value : "";
            if (!timeVal) {
                showModal(getTranslation('msg_input_timer_val'), { hideCancel: true });
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
        } else if (unitSelect.value === 'duration') {
            const h = parseInt(currentDuration.h) || 0;
            const m = parseInt(currentDuration.m) || 0;
            const s = parseInt(currentDuration.s) || 0;
            durationMs = (h * 3600 + m * 60 + s) * 1000;
            if (durationMs <= 0) {
                showModal(getTranslation('msg_input_timer_val'), { hideCancel: true });
                return;
            }
        }

        targetTask.durationMs = durationMs;
        targetTask.startTime = startTime;
        targetTask.targetTime = targetTimeStr;
        if (unitSelect.value === 'duration') {
            targetTask.durationParts = { ...currentDuration };
        } else {
            delete targetTask.durationParts;
        }
        targetTask.melody = melodySelect ? melodySelect.value : 'default';
        if (targetTask.melody === 'custom') {
            targetTask.melody = selectedCustomUri;
            targetTask.melodyName = selectedCustomName;
        }

        if (typeof Android !== 'undefined' && Android.setTimerAlarm) {
            Android.setTimerAlarm(targetTask.id, targetTask.text, durationMs, targetTask.melody || 'default', targetTask.melodyMode || 'once');
        }
    } else {
        targetTask.durationMs = 0;
        targetTask.startTime = 0;
        targetTask.targetTime = null;
        delete targetTask.durationParts;
    }

    if (!editingTaskId) {
        tasks.push(targetTask);
    }

    // リマインド通知の設定
    if (typeof Android !== 'undefined' && Android.setReminderAlarms) {
        const reminders = (currentTaskReminders || []).map(r => ({
            time: r.time,
            message: r.message,
            melody: r.melody || 'default',
            melodyName: r.melodyName || '',
            melodyMode: r.melodyMode || 'once'
        }));
        targetTask.reminders = reminders;
        Android.setReminderAlarms(targetTask.id, targetTask.text, JSON.stringify(reminders));
    }

    saveTasks();
    closeTaskModal();
}
window.addTask = addTask;

function toggleTask(id) {
    toggleTaskCore(id, (task) => {
        showModal(task.text, {
            showTextarea: true,
            inputValue: task.note || "",
            placeholder: getTranslation('placeholder_history_memo'),
            confirmText: getTranslation('btn_save_comment'),
            cancelText: getTranslation('btn_no_comment'),
            onConfirm: (memo) => {
                completeTaskWithMemo(task.id, memo);
            }
        });
    });
}
window.toggleTask = toggleTask;

function editTask(id) {
    openTaskModal(id);
}
window.editTask = editTask;

function repeatTimer(id) {
    if (typeof repeatTimerCore === 'function') {
        repeatTimerCore(id);
    }
}
window.repeatTimer = repeatTimer;

function openEditMenu() {
    if (isEditMode) {
        finishSortMode();
        return;
    }
    const modal = document.getElementById('editMenuModal');
    if (modal) modal.style.display = 'flex';
}
window.openEditMenu = openEditMenu;

function closeEditMenu() {
    const modal = document.getElementById('editMenuModal');
    if (modal) modal.style.display = 'none';
}
window.closeEditMenu = closeEditMenu;

function startSortMode() {
    closeEditMenu();
    isEditMode = true;
    if (typeof render === 'function') render();
}
window.startSortMode = startSortMode;

function finishSortMode() {
    isEditMode = false;
    if (typeof render === 'function') render();
}
window.finishSortMode = finishSortMode;

function startExportMode() {
    closeEditMenu();
    isExportMode = true;
    selectedExportIds.clear();
    const title = document.getElementById('export-panel-title');
    const btn = document.getElementById('btn-execute-action');
    const ctrl = document.getElementById('export-controls');
    const trigger = document.getElementById('addTaskTrigger');
    if (title) title.textContent = getTranslation('panel_export_title');
    if (btn) {
        btn.textContent = getTranslation('btn_export_exec');
        btn.classList.replace('btn-danger', 'btn-primary');
        btn.onclick = executeExportTasks;
    }
    if (ctrl) {
        ctrl.style.display = 'block';
        ctrl.style.background = '#e7f3ff';
        ctrl.style.borderColor = '#b3d7ff';
    }
    if (trigger) trigger.style.display = 'none';
    if (typeof render === 'function') render();
}
window.startExportMode = startExportMode;

function cancelBulkMode() {
    isExportMode = false;
    isDeleteMode = false;
    selectedExportIds.clear();
    selectedDeleteIds.clear();

    const ctrl = document.getElementById('export-controls');
    const trigger = document.getElementById('addTaskTrigger');
    const title = document.getElementById('export-panel-title');
    const btn = document.getElementById('btn-execute-action');

    if (ctrl) {
        ctrl.style.display = 'none';
        ctrl.style.background = '#e7f3ff';
        ctrl.style.borderColor = '#b3d7ff';
    }
    if (trigger) trigger.style.display = 'block';
    if (title) title.textContent = getTranslation('panel_export_title');
    if (btn) {
        btn.textContent = getTranslation('btn_export_exec');
        btn.classList.replace('btn-danger', 'btn-primary');
        btn.onclick = executeExportTasks;
    }
    if (typeof render === 'function') render();
}
window.cancelBulkMode = cancelBulkMode;

function cancelExportMode() {
    cancelBulkMode();
}
window.cancelExportMode = cancelExportMode;

function toggleExportSelection(id) {
    if (selectedExportIds.has(id)) selectedExportIds.delete(id);
    else selectedExportIds.add(id);
}
window.toggleExportSelection = toggleExportSelection;

function toggleSelectAll() {
    const currentIds = isExportMode ? selectedExportIds : selectedDeleteIds;
    // 全タスクが既に選択されているかチェック
    const isAllSelected = tasks.every(t => currentIds.has(t.id));

    if (isAllSelected) {
        // 全解除
        currentIds.clear();
    } else {
        // 全選択
        tasks.forEach(t => currentIds.add(t.id));
    }
    if (typeof render === 'function') render();
}
window.toggleSelectAll = toggleSelectAll;

function executeExportTasks() {
    if (selectedExportIds.size === 0) {
        showModal(getTranslation('msg_export_select'), { hideCancel: true });
        return;
    }
    const selectedTasks = tasks.filter(t => selectedExportIds.has(t.id));
    const data = { type: 'partial_tasks', tasks: selectedTasks };
    if (typeof performBackup === 'function') {
        performBackup('export', JSON.stringify(data));
    }
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
    cancelBulkMode();
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
            tasks = tasks.filter(t => !selectedDeleteIds.has(t.id));
            saveTasks();
            cancelDeleteMode();
        }
    });
}
window.executeDeleteTasks = executeDeleteTasks;

function deleteTaskFromModal() {
    if (!editingTaskId) return;
    const task = tasks.find(t => t.id === editingTaskId);
    if (!task) return;

    showModal(getTranslation('msg_delete_confirm', task.text), {
        onConfirm: () => {
            tasks = tasks.filter(t => t.id !== editingTaskId);
            saveTasks();
            closeTaskModal();
        }
    });
}
window.deleteTaskFromModal = deleteTaskFromModal;

function viewHistoryFromModal() {
    if (!editingTaskId) return;
    const task = tasks.find(t => t.id === editingTaskId);
    if (!task) return;

    closeTaskModal();
    renderTaskHistory(task.id);
}
window.viewHistoryFromModal = viewHistoryFromModal;


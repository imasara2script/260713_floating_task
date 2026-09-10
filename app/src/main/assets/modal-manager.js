/**
 * Modal and Dialog Management Logic
 */

function showModal(title, options = {}) {
    const modal = document.getElementById('customModal');
    const titleEl = document.getElementById('modalTitle');
    const inputEl = document.getElementById('modalInput');
    const textareaEl = document.getElementById('modalTextarea');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');
    const neutralBtn = document.getElementById('modalNeutralBtn');

    if (!modal || !titleEl || !inputEl || !textareaEl || !confirmBtn || !cancelBtn) return;

    if (options.useHTML) titleEl.innerHTML = title;
    else titleEl.textContent = title;

    inputEl.style.display = options.showInput ? 'block' : 'none';
    textareaEl.style.display = options.showTextarea ? 'block' : 'none';

    let initialValue = '';
    if (options.showInput) {
        inputEl.value = options.inputValue || '';
        inputEl.type = options.inputType || 'text';
        initialValue = inputEl.value;
    }
    if (options.showTextarea) {
        textareaEl.value = options.inputValue || '';
        textareaEl.placeholder = options.placeholder || '';
        initialValue = textareaEl.value;
    }

    cancelBtn.style.display = options.hideCancel ? 'none' : 'inline-block';
    confirmBtn.textContent = options.confirmText || 'OK';
    cancelBtn.textContent = options.cancelText || getTranslation('btn_cancel');

    if (neutralBtn) {
        if (options.neutralText) {
            neutralBtn.style.display = 'inline-block';
            neutralBtn.textContent = options.neutralText;
            neutralBtn.onclick = () => {
                closeModal();
                if (options.onNeutral) options.onNeutral();
            };
        } else {
            neutralBtn.style.display = 'none';
        }
    }

    confirmBtn.onclick = () => {
        const val = options.showTextarea ? textareaEl.value : inputEl.value;
        const onConfirm = options.onConfirm;
        const previousContent = titleEl.innerHTML;
        const result = onConfirm ? onConfirm(val) : undefined;
        if (result !== false && titleEl.innerHTML === previousContent) {
            closeModal();
        }
    };

    const handleCancel = () => {
        if (options.confirmDiscard) {
            const currentVal = options.showTextarea ? textareaEl.value : inputEl.value;
            if (currentVal !== initialValue) {
                window.nativeConfirm(getTranslation('msg_confirm_discard'), (ok) => {
                    if (ok) { closeModal(); if (options.onCancel) options.onCancel(); }
                });
                return;
            }
        }
        closeModal();
        if (options.onCancel) options.onCancel();
    };

    cancelBtn.onclick = handleCancel;
    modal.onclick = (e) => {
        if (e.target === modal) {
            if (options.hideCancel) { if (confirmBtn.onclick) confirmBtn.onclick(); }
            else handleCancel();
        }
    };
    modal.style.display = 'flex';

    if (options.showInput || options.showTextarea) {
        setTimeout(() => {
            const el = options.showTextarea ? textareaEl : inputEl;
            el.focus();
            if (typeof Android !== 'undefined' && Android.showKeyboard) Android.showKeyboard();
        }, 100);
    }
}

function closeModal() {
    const modal = document.getElementById('customModal');
    if (modal) modal.style.display = 'none';
}

function switchToViewMode() {
    const viewContainer = document.getElementById('taskViewContainer');
    const editContainer = document.getElementById('taskEditContainer');
    const confirmBtn = document.getElementById('taskModalConfirmBtn');
    const editBtn = document.getElementById('modalEditBtn');
    if (viewContainer) viewContainer.style.display = 'block';
    if (editContainer) editContainer.style.display = 'none';
    if (confirmBtn) confirmBtn.style.display = 'none';
    if (editingTaskId && editBtn) editBtn.style.display = 'block';
}

function switchToEditMode() {
    const viewContainer = document.getElementById('taskViewContainer');
    const editContainer = document.getElementById('taskEditContainer');
    const confirmBtn = document.getElementById('taskModalConfirmBtn');
    const editBtn = document.getElementById('modalEditBtn');
    if (viewContainer) viewContainer.style.display = 'none';
    if (editContainer) editContainer.style.display = 'block';
    if (confirmBtn) confirmBtn.style.display = 'block';
    if (editBtn) editBtn.style.display = 'none';
    const titleEl = document.getElementById('taskModalTitle');
    if (titleEl) titleEl.textContent = getTranslation(editingTaskId ? 'task_modal_edit' : 'task_modal_add');
    const input = document.getElementById('taskInput');
    if (input) setTimeout(() => input.focus(), 100);
}

function openTaskModal(taskId = null) {
    if (typeof checkAdFree === 'function') checkAdFree();
    if (!isAdFree && !taskId && tasks.length >= 3) {
        showModal(getTranslation('msg_ad_confirm'), {
            onConfirm: () => {
                if (typeof Android !== 'undefined' && Android.showRewardedAd) {
                    const isReady = Android.isRewardedAdReady ? Android.isRewardedAdReady() : false;
                    Android.showRewardedAd();
                    return isReady;
                }
            }
        });
        return;
    }
    editingTaskId = taskId;
    const titleEl = document.getElementById('taskModalTitle');
    const confirmBtn = document.getElementById('taskModalConfirmBtn');
    const historyBtn = document.getElementById('modalHistoryBtn');
    const deleteBtn = document.getElementById('modalDeleteBtn');
    const editBtn = document.getElementById('modalEditBtn');

    // 全てのリセット
    tempVisibilityFlags = { timer: false, remind: false, comment: false, days: false, note: false, hyperlink: false };
    currentTaskReminders = [];
    currentTaskLinks = [];

    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        if (historyBtn) historyBtn.style.display = task.durationMs ? 'none' : 'block';
        if (deleteBtn) deleteBtn.style.display = 'block';
        if (titleEl) titleEl.textContent = getTranslation('task_modal_detail');
        if (confirmBtn) confirmBtn.textContent = getTranslation('btn_save');

        const taskInput = document.getElementById('taskInput');
        const taskNote = document.getElementById('taskNote');
        const referenceDateInput = document.getElementById('referenceDate');
        const showCommentOnCheck = document.getElementById('showCommentOnCheck');
        if (taskInput) taskInput.value = task.text;
        if (taskNote) taskNote.value = task.note || '';
        if (referenceDateInput) referenceDateInput.value = task.referenceDate || '';
        if (showCommentOnCheck) showCommentOnCheck.checked = !!task.showCommentOnCheck;

        document.querySelectorAll('.reset-day-check').forEach(el => el.checked = false);
        if (task.selectedDays) task.selectedDays.forEach(day => {
            const cb = document.querySelector(`.reset-day-check[value="${day}"]`);
            if (cb) cb.checked = true;
        });

        // データの読み込み
        currentTaskReminders = (task.reminders || []).map(r => ({ ...r, id: Math.random() }));
        currentTaskLinks = (task.links || []).map(l => ({ ...l, id: Math.random() }));

        // 表示の更新
        if (typeof renderReminderList === 'function') renderReminderList();
        if (typeof renderHyperlinkList === 'function') renderHyperlinkList();
        updateTaskModalVisibility(task);

        const viewTaskText = document.getElementById('viewTaskText');
        const viewTaskNote = document.getElementById('viewTaskNote');
        const viewTaskReminders = document.getElementById('viewTaskReminders');
        const viewTaskDays = document.getElementById('viewTaskDays');
        const viewTaskTimer = document.getElementById('viewTaskTimer');
        const viewTaskLinks = document.getElementById('viewTaskLinks');

        if (viewTaskText) viewTaskText.textContent = task.text;
        if (viewTaskNote) viewTaskNote.textContent = task.note || getTranslation('none');

        // 詳細画面のリマインド表示
        if (viewTaskReminders) {
            if (task.reminders && task.reminders.length > 0) {
                const reminderText = task.reminders.map(r => `⏰ ${r.time}${r.message ? ` (${r.message})` : ''}`).join('\n');
                viewTaskReminders.innerHTML = `<div style="font-weight:bold; margin-bottom:4px;">${getTranslation('label_reminder_notifications')}</div><div style="white-space:pre-wrap;">${reminderText}</div>`;
                viewTaskReminders.style.display = 'block';
            } else viewTaskReminders.style.display = 'none';
        }

        // 詳細画面の曜日表示
        if (viewTaskDays) {
            if (task.selectedDays && task.selectedDays.length > 0) {
                const daysText = (typeof getTaskDaysText === 'function') ? getTaskDaysText(task) : '';
                viewTaskDays.innerHTML = `<div style="font-weight:bold; margin-bottom:4px;">${getTranslation('label_reset_days')}</div><div>${daysText}</div>`;
                viewTaskDays.style.display = 'block';
            } else viewTaskDays.style.display = 'none';
        }

        // 詳細画面のタイマー表示
        if (task.durationMs) {
            const timerUnit = document.getElementById('timerUnit');
            const timeValue = document.getElementById('timeValue');
            const timerValue = document.getElementById('timerValue');
            if (task.targetTime) {
                if (timerUnit) timerUnit.value = 'at';
                if (timeValue) timeValue.value = task.targetTime;
                if (timerValue) timerValue.value = '';
            } else if (task.durationParts) {
                if (timerUnit) timerUnit.value = 'duration';
                currentDuration = { ...task.durationParts };
                onDurationSelected(currentDuration.h, currentDuration.m, currentDuration.s);
            } else {
                if (timerUnit) timerUnit.value = 'duration';
                const totalSec = Math.floor(task.durationMs / 1000);
                const h = Math.floor(totalSec / 3600);
                const m = Math.floor((totalSec % 3600) / 60);
                const s = totalSec % 60;
                onDurationSelected(h, m, s);
            }
            const melody = task.melody || 'default';
            const select = document.getElementById('melodySelect');
            const nameEl = document.getElementById('customMelodyName');
            if (melody.startsWith('content://')) {
                if (select) select.value = 'custom';
                selectedCustomUri = melody;
                selectedCustomName = task.melodyName || getTranslation('none');
                if (nameEl) { nameEl.textContent = '選択中: ' + selectedCustomName; nameEl.style.display = 'block'; }
            } else {
                if (select) select.value = melody;
                selectedCustomUri = null; selectedCustomName = null;
                if (nameEl) nameEl.style.display = 'none';
            }
            if (viewTaskTimer) {
                const timerText = task.targetTime ? task.targetTime : ((typeof getTotalTimeText === 'function') ? getTotalTimeText(task) : '');
                viewTaskTimer.textContent = `${getTranslation('label_timer')} ${timerText}`;
                viewTaskTimer.style.display = 'block';
            }
        } else {
            const timerUnit = document.getElementById('timerUnit');
        const timerValue = document.getElementById('timerValue');
        const referenceDateInput = document.getElementById('referenceDate');
        const melodySelect = document.getElementById('melodySelect');
        if (timerUnit) timerUnit.value = 'none';
        if (timerValue) timerValue.value = '';
        if (referenceDateInput) referenceDateInput.value = '';
        if (melodySelect) melodySelect.value = 'default';
            if (viewTaskTimer) viewTaskTimer.style.display = 'none';
        }

        // 詳細画面のリンク表示
        if (viewTaskLinks) {
            if (task.links && task.links.length > 0) {
                const linksHtml = task.links.map(l => `<div style="margin-bottom: 8px;"><button onclick="openExternalUrl('${l.url}')" style="background: none; border: none; padding: 0; color: #007bff; text-decoration: underline; font-weight: bold; cursor: pointer; text-align: left; font-size: inherit; font-family: inherit; word-break: break-all;">${l.text || l.url}</button></div>`).join('');
                viewTaskLinks.innerHTML = `<div style="font-weight:bold; margin-bottom:4px;">${getTranslation('label_hyperlinks')}</div>${linksHtml}`;
                viewTaskLinks.style.display = 'block';
            } else viewTaskLinks.style.display = 'none';
        }

        switchToViewMode();
    } else {
        if (titleEl) titleEl.textContent = getTranslation('task_modal_add');
        if (confirmBtn) confirmBtn.textContent = getTranslation('btn_add');
        const taskInput = document.getElementById('taskInput');
        const taskNote = document.getElementById('taskNote');
        const showCommentOnCheck = document.getElementById('showCommentOnCheck');
        const timerValue = document.getElementById('timerValue');
        const timerUnit = document.getElementById('timerUnit');
        const melodySelect = document.getElementById('melodySelect');
        const durationBtn = document.getElementById('durationBtn');
        if (taskInput) taskInput.value = '';
        if (taskNote) taskNote.value = '';
        if (showCommentOnCheck) showCommentOnCheck.checked = false;
        if (timerValue) timerValue.value = '';
        if (timerUnit) timerUnit.value = 'none';
        if (melodySelect) melodySelect.value = 'default';
        document.querySelectorAll('.reset-day-check').forEach(el => el.checked = false);
        currentDuration = { h: "0", m: "0", s: "0" };
        if (durationBtn) durationBtn.textContent = getTranslation('btn_set_duration');

        if (typeof renderReminderList === 'function') renderReminderList();
        if (typeof renderHyperlinkList === 'function') renderHyperlinkList();

        if (historyBtn) historyBtn.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';
        if (editBtn) editBtn.style.display = 'none';
        updateTaskModalVisibility();
        switchToEditMode();
    }
    if (typeof toggleTimerInput === 'function') toggleTimerInput();
    const modal = document.getElementById('taskModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.onclick = (e) => { if (e.target === modal) closeTaskModal(); };
    }
}

function openExternalUrl(url) {
    if (typeof Android !== 'undefined' && Android.openExternalUrl) {
        Android.openExternalUrl(url);
    } else {
        window.open(url, '_blank');
    }
}
window.openExternalUrl = openExternalUrl;

function closeTaskModal() {
    if (isMelodyTesting) { if (typeof stopMelodyTest === 'function') stopMelodyTest(); }
    const modal = document.getElementById('taskModal');
    if (modal) modal.style.display = 'none';
    const historyBtn = document.getElementById('modalHistoryBtn');
    const deleteBtn = document.getElementById('modalDeleteBtn');
    const editBtn = document.getElementById('modalEditBtn');
    if (historyBtn) historyBtn.style.display = 'none';
    if (deleteBtn) deleteBtn.style.display = 'none';
    if (editBtn) editBtn.style.display = 'none';
    editingTaskId = null;
}

function updateTaskModalVisibility(task = null) {
    const showTimerSetting = localStorage.getItem('showTimerOnCreate') === 'true';
    const showRemindSetting = localStorage.getItem('showRemindOnCreate') === 'true';
    const showDaysSetting = localStorage.getItem('showDaysOnCreate') === 'true';
    const showCommentSetting = localStorage.getItem('showCommentOnCreate') === 'true';
    const showNoteSetting = localStorage.getItem('showNoteOnCreate') === 'true';
    const showHyperlinkSetting = localStorage.getItem('showHyperlinkOnCreate') === 'true';

    const hasTimer = task ? !!task.durationMs : false;
    const hasReminders = task ? (task.reminders && task.reminders.length > 0) : false;
    const hasDays = task ? (task.selectedDays && task.selectedDays.length > 0) : false;
    const hasCommentConfig = task ? !!task.showCommentOnCheck : false;
    const hasNote = task ? !!task.note : false;
    const hasLinks = task ? (task.links && task.links.length > 0) : false;
    const isBiweekly = task ? task.type === 'biweekly' : false;

    const timerGroup = document.getElementById('timerGroup');
    const reminderGroup = document.getElementById('reminderGroup');
    const daysGroup = document.getElementById('daysGroup');
    const commentConfigGroup = document.getElementById('commentConfigGroup');
    const noteGroup = document.getElementById('noteGroup');
    const hyperlinkGroup = document.getElementById('hyperlinkGroup');
    const biweeklyGroup = document.getElementById('biweeklyGroup');

    const viewDays = document.getElementById('viewTaskDays');
    const viewNoteGroup = document.getElementById('viewNoteGroup');
    const viewLinks = document.getElementById('viewTaskLinks');

    if (timerGroup) timerGroup.style.display = (showTimerSetting || hasTimer || isBiweekly || tempVisibilityFlags.timer) ? 'block' : 'none';
    if (reminderGroup) reminderGroup.style.display = (showRemindSetting || hasReminders || tempVisibilityFlags.remind) ? 'block' : 'none';
    if (daysGroup) daysGroup.style.display = (showDaysSetting || hasDays || tempVisibilityFlags.days) ? 'block' : 'none';
    if (commentConfigGroup) commentConfigGroup.style.display = (showCommentSetting || hasCommentConfig || tempVisibilityFlags.comment) ? 'block' : 'none';
    if (noteGroup) noteGroup.style.display = (showNoteSetting || hasNote || tempVisibilityFlags.note) ? 'block' : 'none';
    if (hyperlinkGroup) hyperlinkGroup.style.display = (showHyperlinkSetting || hasLinks || tempVisibilityFlags.hyperlink) ? 'block' : 'none';

    if (viewDays) viewDays.style.display = (showDaysSetting || hasDays || tempVisibilityFlags.days) ? 'block' : 'none';
    if (viewNoteGroup) viewNoteGroup.style.display = (showNoteSetting || hasNote || tempVisibilityFlags.note) ? 'block' : 'none';
    if (viewLinks) viewLinks.style.display = hasLinks ? 'block' : 'none';
}

function toggleTimerInput(isManualChange = false) {
    const unitSelect = document.getElementById('timerUnit');
    if (!unitSelect) return;
    const unit = unitSelect.value;
    const input = document.getElementById('timerValue');
    const durationBtn = document.getElementById('durationBtn');
    const timeInput = document.getElementById('timeValue');
    const biweeklyGroup = document.getElementById('biweeklyGroup');
    const melodyGroup = document.getElementById('melodyGroup');
    const isVisible = (unit !== 'none');
    if (input) input.style.display = 'none';
    if (durationBtn) durationBtn.style.display = (unit === 'duration') ? 'inline-block' : 'none';
    if (timeInput) timeInput.style.display = (unit === 'at') ? 'inline-block' : 'none';
    if (biweeklyGroup) biweeklyGroup.style.display = (unit === 'biweekly') ? 'flex' : 'none';
    if (melodyGroup) melodyGroup.style.display = (isVisible && unit !== 'biweekly') ? 'block' : 'none';
    if (!isManualChange) return;
    if (unit === 'at' && timeInput) setTimeout(() => timeInput.focus(), 50);
    else if (unit === 'duration') requestDurationPicker();
}

function requestDurationPicker() {
    if (isDurationPickerRequested) return;
    isDurationPickerRequested = true;
    if (typeof Android !== 'undefined' && Android.showDurationPicker) {
        Android.showDurationPicker(currentDuration.h.toString(), currentDuration.m.toString(), currentDuration.s.toString());
    } else {
        const h = prompt("時", currentDuration.h); const m = prompt("分", currentDuration.m); const s = prompt("秒", currentDuration.s);
        if (h !== null && m !== null && s !== null) onDurationSelected(h, m, s);
        onDurationPickerDismissed();
    }
}

function onDurationPickerDismissed() { isDurationPickerRequested = false; }

function onDurationSelected(h, m, s) {
    currentDuration = { h: h.toString(), m: m.toString(), s: s.toString() };
    const btn = document.getElementById('durationBtn');
    if (!btn) return;
    let text = ""; const hNum = parseFloat(h) || 0; const mNum = parseFloat(m) || 0; const sNum = parseFloat(s) || 0;
    if (hNum > 0) text += h + getTranslation('unit_hour');
    if (mNum > 0 || hNum > 0) text += m + getTranslation('unit_min');
    text += s + getTranslation('unit_sec');
    btn.textContent = text;
}

function openDeveloperModal() {
    const modal = document.getElementById('developerModal');
    if (!modal) return;
    modal.style.display = 'flex';
    if (typeof Android !== 'undefined' && Android.isLoggingEnabled) {
        const isEnabled = Android.isLoggingEnabled();
        const toggle = document.getElementById('loggingToggle');
        const section = document.getElementById('logInfoSection');
        if (toggle) toggle.checked = isEnabled;
        if (section) section.style.display = isEnabled ? 'block' : 'none';
        if (isEnabled && typeof updateLogSize === 'function') updateLogSize();
    }
    modal.onclick = (e) => { if (e.target === modal) closeDeveloperModal(); };
}

function closeDeveloperModal() {
    const modal = document.getElementById('developerModal');
    if (modal) modal.style.display = 'none';
}

function openTemporaryVisibilityModal() {
    const timerGroup = document.getElementById('timerGroup');
    const reminderGroup = document.getElementById('reminderGroup');
    const daysGroup = document.getElementById('daysGroup');
    const commentConfigGroup = document.getElementById('commentConfigGroup');
    const noteGroup = document.getElementById('noteGroup');
    const tempShowTimer = document.getElementById('tempShowTimer');
    const tempShowRemind = document.getElementById('tempShowRemind');
    const tempShowDays = document.getElementById('tempShowDays');
    const tempShowComment = document.getElementById('tempShowComment');
    const tempShowNote = document.getElementById('tempShowNote');
    if (tempShowTimer) tempShowTimer.checked = timerGroup && timerGroup.style.display === 'block';
    if (tempShowRemind) tempShowRemind.checked = reminderGroup && reminderGroup.style.display === 'block';
    if (tempShowDays) tempShowDays.checked = daysGroup && daysGroup.style.display === 'block';
    if (tempShowComment) tempShowComment.checked = commentConfigGroup && commentConfigGroup.style.display === 'block';
    if (tempShowNote) tempShowNote.checked = noteGroup && noteGroup.style.display === 'block';
    const tempShowLinks = document.getElementById('tempShowLinks');
    if (tempShowLinks) tempShowLinks.checked = document.getElementById('hyperlinkGroup')?.style.display === 'block';
    const modal = document.getElementById('tempVisibilityModal');
    if (modal) { modal.style.display = 'flex'; modal.onclick = (e) => { if (e.target === modal) closeTemporaryVisibilityModal(); }; }
}

function closeTemporaryVisibilityModal() {
    const modal = document.getElementById('tempVisibilityModal');
    if (modal) modal.style.display = 'none';
}

function applyTemporaryVisibility() {
    const tempShowTimer = document.getElementById('tempShowTimer');
    const tempShowRemind = document.getElementById('tempShowRemind');
    const tempShowDays = document.getElementById('tempShowDays');
    const tempShowComment = document.getElementById('tempShowComment');
    const tempShowNote = document.getElementById('tempShowNote');
    tempVisibilityFlags.timer = tempShowTimer ? tempShowTimer.checked : false;
    tempVisibilityFlags.remind = tempShowRemind ? tempShowRemind.checked : false;
    tempVisibilityFlags.days = tempShowDays ? tempShowDays.checked : false;
    tempVisibilityFlags.comment = tempShowComment ? tempShowComment.checked : false;
    tempVisibilityFlags.note = tempShowNote ? tempShowNote.checked : false;
    tempVisibilityFlags.hyperlink = document.getElementById('tempShowLinks')?.checked || false;
    updateTaskModalVisibility();
    closeTemporaryVisibilityModal();
}

function addHyperlinkItem(url = "", text = "") {
    const id = Date.now() + Math.random();
    currentTaskLinks.push({ id, url, text });
    renderHyperlinkList();
}
window.addHyperlinkItem = addHyperlinkItem;

function removeHyperlinkItem(id) {
    showModal(getTranslation('msg_confirm_delete_link'), {
        onConfirm: () => {
            currentTaskLinks = currentTaskLinks.filter(l => l.id != id);
            renderHyperlinkList();
        }
    });
}
window.removeHyperlinkItem = removeHyperlinkItem;

function renderHyperlinkList() {
    const list = document.getElementById('hyperlinkList');
    if (!list) return;
    list.innerHTML = currentTaskLinks.map(l => `
        <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; padding: 8px; background: #f0f7ff; border-radius: 6px; border: 1px solid #cce5ff;">
            <div style="display: flex; gap: 4px; align-items: center;">
                <input type="text" value="${l.text}" placeholder="${getTranslation('placeholder_link_text')}" oninput="updateHyperlinkData('${l.id}', 'text', this.value)" style="flex: 1; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">
                <button class="btn-icon" onclick="removeHyperlinkItem('${l.id}')" style="margin-left: auto;">🗑️</button>
            </div>
            <input type="text" value="${l.url}" placeholder="${getTranslation('placeholder_link_url')}" oninput="updateHyperlinkData('${l.id}', 'url', this.value)" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; box-sizing: border-box;">
        </div>
    `).join('');
}
window.renderHyperlinkList = renderHyperlinkList;

function updateHyperlinkData(id, field, value) {
    const l = currentTaskLinks.find(x => x.id == id);
    if (l) l[field] = value;
}
window.updateHyperlinkData = updateHyperlinkData;

/**
 * Modal and Dialog Management Logic
 */

function showModal(title, options) {
    if (!options) options = {};
    var modal = document.getElementById('customModal');
    var titleEl = document.getElementById('modalTitle');
    var inputEl = document.getElementById('modalInput');
    var textareaEl = document.getElementById('modalTextarea');
    var confirmBtn = document.getElementById('modalConfirmBtn');
    var cancelBtn = document.getElementById('modalCancelBtn');
    var neutralBtn = document.getElementById('modalNeutralBtn');
    if (!modal || !titleEl || !inputEl || !textareaEl || !confirmBtn || !cancelBtn) return;
    if (options.useHTML) titleEl.innerHTML = title;
    else titleEl.textContent = title;
    inputEl.style.display = options.showInput ? 'block' : 'none';
    textareaEl.style.display = options.showTextarea ? 'block' : 'none';
    var initialValue = '';
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
            neutralBtn.onclick = function() {
                closeModal();
                if (options.onNeutral) options.onNeutral();
            };
        } else {
            neutralBtn.style.display = 'none';
        }
    }
    confirmBtn.onclick = function() {
        var val = options.showTextarea ? textareaEl.value : inputEl.value;
        var onConfirm = options.onConfirm;
        var previousContent = titleEl.innerHTML;
        var result = onConfirm ? onConfirm(val) : undefined;
        if (result !== false && titleEl.innerHTML === previousContent) {
            closeModal();
        }
    };
    var handleCancel = function() {
        if (options.confirmDiscard) {
            var currentVal = options.showTextarea ? textareaEl.value : inputEl.value;
            if (currentVal !== initialValue) {
                window.nativeConfirm(getTranslation('msg_confirm_discard'), function(ok) {
                    if (ok) { closeModal(); if (options.onCancel) options.onCancel(); }
                });
                return;
            }
        }
        closeModal();
        if (options.onCancel) options.onCancel();
    };
    cancelBtn.onclick = handleCancel;
    modal.onclick = function(e) {
        if (e.target === modal) {
            if (options.hideCancel) { if (confirmBtn.onclick) confirmBtn.onclick(); }
            else handleCancel();
        }
    };
    modal.style.display = 'flex';
    if (options.showInput || options.showTextarea) {
        setTimeout(function() {
            var el = options.showTextarea ? textareaEl : inputEl;
            el.focus();
            if (typeof Android !== 'undefined' && Android.showKeyboard) Android.showKeyboard();
        }, 100);
    }
}

function closeModal() {
    var modal = document.getElementById('customModal');
    if (modal) modal.style.display = 'none';
}

function switchToViewMode() {
    var viewContainer = document.getElementById('taskViewContainer');
    var editContainer = document.getElementById('taskEditContainer');
    var confirmBtn = document.getElementById('taskModalConfirmBtn');
    var editBtn = document.getElementById('modalEditBtn');
    if (viewContainer) viewContainer.style.display = 'block';
    if (editContainer) editContainer.style.display = 'none';
    if (confirmBtn) confirmBtn.style.display = 'none';
    if (editingTaskId && editBtn) editBtn.style.display = 'block';
}

function switchToEditMode() {
    var viewContainer = document.getElementById('taskViewContainer');
    var editContainer = document.getElementById('taskEditContainer');
    var confirmBtn = document.getElementById('taskModalConfirmBtn');
    var editBtn = document.getElementById('modalEditBtn');
    if (viewContainer) viewContainer.style.display = 'none';
    if (editContainer) editContainer.style.display = 'block';
    if (confirmBtn) confirmBtn.style.display = 'block';
    if (editBtn) editBtn.style.display = 'none';
    var titleEl = document.getElementById('taskModalTitle');
    if (titleEl) titleEl.textContent = getTranslation(editingTaskId ? 'task_modal_edit' : 'task_modal_add');
    var input = document.getElementById('taskInput');
    if (input) setTimeout(function() { input.focus(); }, 100);
}

function openTaskModal(taskId) {
    if (taskId === undefined) taskId = null;
    if (typeof checkAdFree === 'function') checkAdFree();
    if (!isAdFree && !taskId && tasks.length >= 3) {
        showModal(getTranslation('msg_ad_confirm'), {
            onConfirm: function() {
                if (typeof Android !== 'undefined' && Android.showRewardedAd) {
                    var isReady = Android.isRewardedAdReady ? Android.isRewardedAdReady() : false;
                    Android.showRewardedAd();
                    return isReady;
                }
            }
        });
        return;
    }
    editingTaskId = taskId;
    var titleEl = document.getElementById('taskModalTitle');
    var confirmBtn = document.getElementById('taskModalConfirmBtn');
    var historyBtn = document.getElementById('modalHistoryBtn');
    var deleteBtn = document.getElementById('modalDeleteBtn');
    var editBtn = document.getElementById('modalEditBtn');
    tempVisibilityFlags = { timer: false, remind: false, comment: false, days: false, note: false, hyperlink: false };
    currentTaskReminders = [];
    currentTaskLinks = [];
    if (taskId) {
        var task = tasks.find(function(t) { return t.id === taskId; });
        if (!task) return;
        if (historyBtn) historyBtn.style.display = task.durationMs ? 'none' : 'block';
        if (deleteBtn) deleteBtn.style.display = 'block';
        if (titleEl) titleEl.textContent = getTranslation('task_modal_detail');
        if (confirmBtn) confirmBtn.textContent = getTranslation('btn_save');
        var taskInput = document.getElementById('taskInput');
        var taskNote = document.getElementById('taskNote');
        var referenceDateInput = document.getElementById('referenceDate');
        var showCommentOnCheck = document.getElementById('showCommentOnCheck');
        if (taskInput) taskInput.value = task.text;
        if (taskNote) taskNote.value = task.note || '';
        if (referenceDateInput) referenceDateInput.value = task.referenceDate || '';
        if (showCommentOnCheck) showCommentOnCheck.checked = !!task.showCommentOnCheck;
        var checks = document.querySelectorAll('.reset-day-check');
        for(var i=0; i<checks.length; i++) checks[i].checked = false;
        if (task.selectedDays) {
            task.selectedDays.forEach(function(day) {
                var cb = document.querySelector('.reset-day-check[value="' + day + '"]');
                if (cb) cb.checked = true;
            });
        }
        currentTaskReminders = (task.reminders || []).map(function(r) {
            var newR = {};
            for(var key in r) newR[key] = r[key];
            newR.id = Math.random();
            return newR;
        });
        currentTaskLinks = (task.links || []).map(function(l) {
            var newL = {};
            for(var key in l) newL[key] = l[key];
            newL.id = Math.random();
            return newL;
        });
        if (typeof renderReminderList === 'function') renderReminderList();
        if (typeof renderHyperlinkList === 'function') renderHyperlinkList();
        updateTaskModalVisibility(task);
        var viewTaskText = document.getElementById('viewTaskText');
        var viewTaskNote = document.getElementById('viewTaskNote');
        var viewTaskReminders = document.getElementById('viewTaskReminders');
        var viewTaskDays = document.getElementById('viewTaskDays');
        var viewTaskTimer = document.getElementById('viewTaskTimer');
        var viewTaskLinks = document.getElementById('viewTaskLinks');
        if (viewTaskText) viewTaskText.textContent = task.text;
        if (viewTaskNote) viewTaskNote.textContent = task.note || getTranslation('none');
        if (viewTaskReminders) {
            if (task.reminders && task.reminders.length > 0) {
                var reminderText = task.reminders.map(function(r) {
                    var msgPart = r.message ? " (" + r.message + ")" : "";
                    return "⏰ " + r.time + msgPart;
                }).join('\n');
                viewTaskReminders.innerHTML = '<div style="font-weight:bold; margin-bottom:4px;">' + getTranslation('label_reminder_notifications') + '</div><div style="white-space:pre-wrap;">' + reminderText + '</div>';
                viewTaskReminders.style.display = 'block';
            } else viewTaskReminders.style.display = 'none';
        }
        if (viewTaskDays) {
            if (task.selectedDays && task.selectedDays.length > 0) {
                var daysText = (typeof getTaskDaysText === 'function') ? getTaskDaysText(task) : '';
                viewTaskDays.innerHTML = '<div style="font-weight:bold; margin-bottom:4px;">' + getTranslation('label_reset_days') + '</div><div>' + daysText + '</div>';
                viewTaskDays.style.display = 'block';
            } else viewTaskDays.style.display = 'none';
        }
        if (task.durationMs) {
            var timerUnit = document.getElementById('timerUnit');
            var timeValue = document.getElementById('timeValue');
            var timerValue = document.getElementById('timerValue');
            if (task.targetTime) {
                if (timerUnit) timerUnit.value = 'at';
                if (timeValue) timeValue.value = task.targetTime;
                if (timerValue) timerValue.value = '';
            } else if (task.durationParts) {
                if (timerUnit) timerUnit.value = 'duration';
                currentDuration = {};
                for(var k in task.durationParts) currentDuration[k] = task.durationParts[k];
                onDurationSelected(currentDuration.h, currentDuration.m, currentDuration.s);
            } else {
                if (timerUnit) timerUnit.value = 'duration';
                var totalSec = Math.floor(task.durationMs / 1000);
                var h = Math.floor(totalSec / 3600);
                var m = Math.floor((totalSec % 3600) / 60);
                var s = totalSec % 60;
                onDurationSelected(h, m, s);
            }
            var melody = task.melody || 'default';
            var melodyMode = task.melodyMode || 'once';
            var select = document.getElementById('melodySelect');
            var modeSelect = document.getElementById('melodyMode');
            var nameEl = document.getElementById('customMelodyName');
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
            if (modeSelect) modeSelect.value = melodyMode;
            if (viewTaskTimer) {
                var timerText = task.targetTime ? task.targetTime : ((typeof getTotalTimeText === 'function') ? getTotalTimeText(task) : '');
                viewTaskTimer.textContent = getTranslation('label_timer') + " " + timerText;
                viewTaskTimer.style.display = 'block';
            }
        } else {
            var timerUnit = document.getElementById('timerUnit');
            var timerValue = document.getElementById('timerValue');
            var referenceDateInput = document.getElementById('referenceDate');
            var melodySelect = document.getElementById('melodySelect');
            var melodyModeSelect = document.getElementById('melodyMode');
            if (timerUnit) timerUnit.value = 'none';
            if (timerValue) timerValue.value = '';
            if (referenceDateInput) referenceDateInput.value = '';
            if (melodySelect) melodySelect.value = 'default';
            if (melodyModeSelect) melodyModeSelect.value = 'once';
            if (viewTaskTimer) viewTaskTimer.style.display = 'none';
        }
        if (viewTaskLinks) {
            if (task.links && task.links.length > 0) {
                var linksHtml = task.links.map(function(l) {
                    return '<div style="margin-bottom: 8px;"><button onclick="openExternalUrl(\'' + l.url + '\')" style="background: none; border: none; padding: 0; color: #007bff; text-decoration: underline; font-weight: bold; cursor: pointer; text-align: left; font-size: inherit; font-family: inherit; word-break: break-all;">' + (l.text || l.url) + '</button></div>';
                }).join('');
                viewTaskLinks.innerHTML = '<div style="font-weight:bold; margin-bottom:4px;">' + getTranslation('label_hyperlinks') + '</div>' + linksHtml;
                viewTaskLinks.style.display = 'block';
            } else viewTaskLinks.style.display = 'none';
        }
        switchToViewMode();
    } else {
        if (titleEl) titleEl.textContent = getTranslation('task_modal_add');
        if (confirmBtn) confirmBtn.textContent = getTranslation('btn_add');
        var taskInput = document.getElementById('taskInput');
        var taskNote = document.getElementById('taskNote');
        var showCommentOnCheck = document.getElementById('showCommentOnCheck');
        var timerValue = document.getElementById('timerValue');
        var timerUnit = document.getElementById('timerUnit');
        var melodySelect = document.getElementById('melodySelect');
        var melodyModeSelect = document.getElementById('melodyMode');
        var durationBtn = document.getElementById('durationBtn');
        if (taskInput) taskInput.value = '';
        if (taskNote) taskNote.value = '';
        if (showCommentOnCheck) showCommentOnCheck.checked = false;
        if (timerValue) timerValue.value = '';
        if (timerUnit) timerUnit.value = 'none';
        if (melodySelect) melodySelect.value = 'default';
        if (melodyModeSelect) melodyModeSelect.value = 'once';
        var checks = document.querySelectorAll('.reset-day-check');
        for(var i=0; i<checks.length; i++) checks[i].checked = false;
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
    var modal = document.getElementById('taskModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.onclick = function(e) { if (e.target === modal) closeTaskModal(); };
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
    var modal = document.getElementById('taskModal');
    if (modal) modal.style.display = 'none';
    var historyBtn = document.getElementById('modalHistoryBtn');
    var deleteBtn = document.getElementById('modalDeleteBtn');
    var editBtn = document.getElementById('modalEditBtn');
    if (historyBtn) historyBtn.style.display = 'none';
    if (deleteBtn) deleteBtn.style.display = 'none';
    if (editBtn) editBtn.style.display = 'none';
    editingTaskId = null;
}

function updateTaskModalVisibility(task) {
    var showTimerSetting = localStorage.getItem('showTimerOnCreate') === 'true';
    var showRemindSetting = localStorage.getItem('showRemindOnCreate') === 'true';
    var showDaysSetting = localStorage.getItem('showDaysOnCreate') === 'true';
    var showCommentSetting = localStorage.getItem('showCommentOnCheck') === 'true';
    var showNoteSetting = localStorage.getItem('showNoteOnCreate') === 'true';
    var showHyperlinkSetting = localStorage.getItem('showHyperlinkOnCreate') === 'true';
    var hasTimer = task ? !!task.durationMs : false;
    var hasReminders = task ? (task.reminders && task.reminders.length > 0) : false;
    var hasDays = task ? (task.selectedDays && task.selectedDays.length > 0) : false;
    var hasCommentConfig = task ? !!task.showCommentOnCheck : false;
    var hasNote = task ? !!task.note : false;
    var hasLinks = task ? (task.links && task.links.length > 0) : false;
    var isBiweekly = task ? task.type === 'biweekly' : false;
    var timerGroup = document.getElementById('timerGroup');
    var reminderGroup = document.getElementById('reminderGroup');
    var daysGroup = document.getElementById('daysGroup');
    var commentConfigGroup = document.getElementById('commentConfigGroup');
    var noteGroup = document.getElementById('noteGroup');
    var hyperlinkGroup = document.getElementById('hyperlinkGroup');
    var viewDays = document.getElementById('viewTaskDays');
    var viewNoteGroup = document.getElementById('viewNoteGroup');
    var viewLinks = document.getElementById('viewTaskLinks');
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

function toggleTimerInput(isManualChange) {
    if (isManualChange === undefined) isManualChange = false;
    var unitSelect = document.getElementById('timerUnit');
    if (!unitSelect) return;
    var unit = unitSelect.value;
    var input = document.getElementById('timerValue');
    var durationBtn = document.getElementById('durationBtn');
    var timeInput = document.getElementById('timeValue');
    var biweeklyGroup = document.getElementById('biweeklyGroup');
    var melodyGroup = document.getElementById('melodyGroup');
    var isVisible = (unit !== 'none');
    if (input) input.style.display = 'none';
    if (durationBtn) durationBtn.style.display = (unit === 'duration') ? 'inline-block' : 'none';
    if (timeInput) timeInput.style.display = (unit === 'at') ? 'inline-block' : 'none';
    if (biweeklyGroup) biweeklyGroup.style.display = (unit === 'biweekly') ? 'flex' : 'none';
    if (melodyGroup) melodyGroup.style.display = (isVisible && unit !== 'biweekly') ? 'block' : 'none';
    if (!isManualChange) return;
    if (unit === 'at' && timeInput) setTimeout(function() { timeInput.focus(); }, 50);
    else if (unit === 'duration') requestDurationPicker();
}

function requestDurationPicker() {
    if (isDurationPickerRequested) return;
    isDurationPickerRequested = true;
    if (typeof Android !== 'undefined' && Android.showDurationPicker) {
        Android.showDurationPicker(currentDuration.h.toString(), currentDuration.m.toString(), currentDuration.s.toString());
    } else {
        var h = prompt("時", currentDuration.h); var m = prompt("分", currentDuration.m); var s = prompt("秒", currentDuration.s);
        if (h !== null && m !== null && s !== null) onDurationSelected(h, m, s);
        onDurationPickerDismissed();
    }
}

function onDurationPickerDismissed() { isDurationPickerRequested = false; }

function onDurationSelected(h, m, s) {
    currentDuration = { h: h.toString(), m: m.toString(), s: s.toString() };
    var btn = document.getElementById('durationBtn');
    if (!btn) return;
    var text = ""; var hNum = parseFloat(h) || 0; var mNum = parseFloat(m) || 0; var sNum = parseFloat(s) || 0;
    if (hNum > 0) text += h + getTranslation('unit_hour');
    if (mNum > 0 || hNum > 0) text += m + getTranslation('unit_min');
    text += s + getTranslation('unit_sec');
    btn.textContent = text;
}


function openTemporaryVisibilityModal() {
    var timerGroup = document.getElementById('timerGroup');
    var reminderGroup = document.getElementById('reminderGroup');
    var daysGroup = document.getElementById('daysGroup');
    var commentConfigGroup = document.getElementById('commentConfigGroup');
    var noteGroup = document.getElementById('noteGroup');
    var tempShowTimer = document.getElementById('tempShowTimer');
    var tempShowRemind = document.getElementById('tempShowRemind');
    var tempShowDays = document.getElementById('tempShowDays');
    var tempShowComment = document.getElementById('tempShowComment');
    var tempShowNote = document.getElementById('tempShowNote');
    if (tempShowTimer) tempShowTimer.checked = timerGroup && timerGroup.style.display === 'block';
    if (tempShowRemind) tempShowRemind.checked = reminderGroup && reminderGroup.style.display === 'block';
    if (tempShowDays) tempShowDays.checked = daysGroup && daysGroup.style.display === 'block';
    if (tempShowComment) tempShowComment.checked = commentConfigGroup && commentConfigGroup.style.display === 'block';
    if (tempShowNote) tempShowNote.checked = noteGroup && noteGroup.style.display === 'block';
    var tempShowLinks = document.getElementById('tempShowLinks');
    if (tempShowLinks) tempShowLinks.checked = document.getElementById('hyperlinkGroup') && document.getElementById('hyperlinkGroup').style.display === 'block';
    var modal = document.getElementById('tempVisibilityModal');
    if (modal) { modal.style.display = 'flex'; modal.onclick = function(e) { if (e.target === modal) closeTemporaryVisibilityModal(); }; }
}

function closeTemporaryVisibilityModal() {
    var modal = document.getElementById('tempVisibilityModal');
    if (modal) modal.style.display = 'none';
}

function applyTemporaryVisibility() {
    var tempShowTimer = document.getElementById('tempShowTimer');
    var tempShowRemind = document.getElementById('tempShowRemind');
    var tempShowDays = document.getElementById('tempShowDays');
    var tempShowComment = document.getElementById('tempShowComment');
    var tempShowNote = document.getElementById('tempShowNote');
    tempVisibilityFlags.timer = tempShowTimer ? tempShowTimer.checked : false;
    tempVisibilityFlags.remind = tempShowRemind ? tempShowRemind.checked : false;
    tempVisibilityFlags.days = tempShowDays ? tempShowDays.checked : false;
    tempVisibilityFlags.comment = tempShowComment ? tempShowComment.checked : false;
    tempVisibilityFlags.note = tempShowNote ? tempShowNote.checked : false;
    tempVisibilityFlags.hyperlink = (document.getElementById('tempShowLinks') && document.getElementById('tempShowLinks').checked) || false;
    updateTaskModalVisibility();
    closeTemporaryVisibilityModal();
}

function handleMelodyChange(targetId) {
    if (targetId === undefined) targetId = 'main';
    var select;
    if (targetId === 'main') {
        select = document.getElementById('melodySelect');
    } else {
        select = document.getElementById('melody-' + targetId);
    }
    if (!select) return;
    if (select.value === 'custom') {
        melodyEditingTarget = targetId;
        if (typeof Android !== 'undefined' && Android.pickRingtone) {
            Android.pickRingtone();
        }
    } else {
        updateMelodyData(targetId, select.value);
    }
}
window.handleMelodyChange = handleMelodyChange;

function onRingtoneSelected(uri, title) {
    if (melodyEditingTarget === 'main') {
        selectedCustomUri = uri;
        selectedCustomName = title;
        var nameEl = document.getElementById('customMelodyName');
        if (nameEl) {
            nameEl.textContent = '選択中: ' + title;
            nameEl.style.display = 'block';
        }
    } else {
        updateMelodyData(melodyEditingTarget, uri, title);
    }
}
window.onRingtoneSelected = onRingtoneSelected;

function updateMelodyData(targetId, melody, melodyName) {
    if (melodyName === undefined) melodyName = null;
    if (targetId === 'main') {
        // Main
    } else {
        var reminder = currentTaskReminders.find(function(r) { return String(r.id) === String(targetId); });
        if (reminder) {
            reminder.melody = melody;
            if (melodyName) reminder.melodyName = melodyName;
            renderReminderList();
        }
    }
}

function toggleMelodyTest(targetId) {
    if (targetId === undefined) targetId = 'main';
    if (isMelodyTesting) {
        stopMelodyTest();
    } else {
        var melody, looping;
        if (targetId === 'main') {
            var select = document.getElementById('melodySelect');
            var modeSelect = document.getElementById('melodyMode');
            melody = select.value === 'custom' ? selectedCustomUri : select.value;
            looping = modeSelect ? (modeSelect.value === 'loop') : false;
        } else {
            var reminder = currentTaskReminders.find(function(r) { return String(r.id) === String(targetId); });
            melody = reminder ? (reminder.melody || 'default') : 'default';
            looping = reminder ? (reminder.melodyMode === 'loop') : false;
        }
        if (melody && melody !== 'none') {
            startMelodyTest(melody, targetId, looping);
        }
    }
}
window.toggleMelodyTest = toggleMelodyTest;

function startMelodyTest(melody, targetId, looping) {
    if (looping === undefined) looping = false;
    if (typeof Android !== 'undefined' && Android.playMelody) {
        Android.playMelody(melody, looping);
        isMelodyTesting = true;
        var btnId = targetId === 'main' ? 'btn-test-melody' : 'btn-test-' + targetId;
        var btn = document.getElementById(btnId);
        if (btn) btn.textContent = getTranslation('btn_stop_melody');
    }
}

function stopMelodyTest() {
    if (typeof Android !== 'undefined' && Android.stopMelody) {
        Android.stopMelody();
    }
    isMelodyTesting = false;
    var btns = document.querySelectorAll('[id^="btn-test-"]');
    for(var i=0; i<btns.length; i++) {
        btns[i].textContent = getTranslation('btn_test_melody');
    }
    var mainBtn = document.getElementById('btn-test-melody');
    if (mainBtn) mainBtn.textContent = getTranslation('btn_test_melody');
}
window.stopMelodyTest = stopMelodyTest;

function addReminderItem(time, message) {
    if (time === undefined) time = "";
    if (message === undefined) message = "";
    var id = Date.now() + Math.random();
    currentTaskReminders.push({ id: id, time: time, message: message, melody: 'default', melodyMode: 'once' });
    renderReminderList();
}
window.addReminderItem = addReminderItem;

function removeReminderItem(id) {
    currentTaskReminders = currentTaskReminders.filter(function(r) { return String(r.id) !== String(id); });
    renderReminderList();
}
window.removeReminderItem = removeReminderItem;

function updateReminderData(id, field, value) {
    var reminder = currentTaskReminders.find(function(r) { return String(r.id) === String(id); });
    if (reminder) reminder[field] = value;
}
window.updateReminderData = updateReminderData;

function renderReminderList() {
    var list = document.getElementById('reminderList');
    if (!list) return;
    list.innerHTML = currentTaskReminders.map(function(r) {
        var melody = r.melody || 'default';
        var isCustom = melody.startsWith('content://');
        var displayMelodyName = isCustom ? (r.melodyName || getTranslation('none')) : '';
        var idStr = String(r.id);
        var html = '<div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; border: 1px solid #eee;">';
        html += '<div style="display: flex; gap: 4px; align-items: center;">';
        html += '<input type="time" value="' + r.time + '" oninput="updateReminderData(\'' + idStr + '\', \'time\', this.value)" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">';
        html += '<button class="btn-icon" onclick="removeReminderItem(\'' + idStr + '\')" style="margin-left: auto;">🗑️</button>';
        html += '</div>';
        html += '<input type="text" value="' + r.message + '" placeholder="' + getTranslation('placeholder_reminder_msg') + '" oninput="updateReminderData(\'' + idStr + '\', \'message\', this.value)" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; box-sizing: border-box;">';
        html += '<div style="display: flex; gap: 6px; align-items: center; border-top: 1px solid #f0f0f0; padding-top: 8px;">';
        html += '<select id="melody-' + idStr + '" onchange="handleMelodyChange(\'' + idStr + '\')" style="flex: 1; padding: 6px; border-radius: 4px; border: 1px solid #ddd; background: white; font-size: 12px;">';
        html += '<option value="none" ' + (melody === 'none' ? 'selected' : '') + '>' + getTranslation('melody_none') + '</option>';
        html += '<option value="default" ' + (melody === 'default' ? 'selected' : '') + '>' + getTranslation('melody_default') + '</option>';
        html += '<option value="alarm" ' + (melody === 'alarm' ? 'selected' : '') + '>' + getTranslation('melody_alarm') + '</option>';
        html += '<option value="chime" ' + (melody === 'chime' ? 'selected' : '') + '>' + getTranslation('melody_chime') + '</option>';
        html += '<option value="custom" ' + (isCustom ? 'selected' : '') + '>' + getTranslation('melody_custom') + '</option>';
        html += '</select>';
        html += '<button id="btn-test-' + idStr + '" class="btn btn-secondary" style="padding: 6px 10px; font-size: 11px; white-space: nowrap;" onclick="toggleMelodyTest(\'' + idStr + '\')">' + getTranslation('btn_test_melody') + '</button>';
        html += '</div>';
        html += '<div style="margin-top: 6px; display: flex; align-items: center; gap: 6px;">';
        html += '<label style="font-size: 11px; color: #666; margin: 0;">' + getTranslation('label_melody_mode') + '</label>';
        html += '<select id="melodyMode-' + idStr + '" onchange="updateReminderData(\'' + idStr + '\', \'melodyMode\', this.value)" style="flex: 1; padding: 4px; border-radius: 4px; border: 1px solid #ddd; background: white; font-size: 12px;">';
        html += '<option value="once" ' + (r.melodyMode === 'once' ? 'selected' : '') + '>' + getTranslation('melody_mode_once') + '</option>';
        html += '<option value="loop" ' + (r.melodyMode === 'loop' ? 'selected' : '') + '>' + getTranslation('melody_mode_loop') + '</option>';
        html += '</select>';
        html += '</div>';
        if (isCustom) html += '<div style="font-size: 10px; color: #666; margin-top: 2px;">選択中: ' + displayMelodyName + '</div>';
        html += '</div>';
        return html;
    }).join('');
}
window.renderReminderList = renderReminderList;

function addHyperlinkItem(url, text) {
    if (url === undefined) url = "";
    if (text === undefined) text = "";
    var id = Date.now() + Math.random();
    currentTaskLinks.push({ id: id, url: url, text: text });
    renderHyperlinkList();
}
window.addHyperlinkItem = addHyperlinkItem;

function removeHyperlinkItem(id) {
    showModal(getTranslation('msg_confirm_delete_link'), {
        onConfirm: function() {
            currentTaskLinks = currentTaskLinks.filter(function(l) { return String(l.id) !== String(id); });
            renderHyperlinkList();
        }
    });
}
window.removeHyperlinkItem = removeHyperlinkItem;

function renderHyperlinkList() {
    var list = document.getElementById('hyperlinkList');
    if (!list) return;
    list.innerHTML = currentTaskLinks.map(function(l) {
        var idStr = String(l.id);
        var html = '<div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; padding: 8px; background: #f0f7ff; border-radius: 6px; border: 1px solid #cce5ff;">';
        html += '<div style="display: flex; gap: 4px; align-items: center;">';
        html += '<input type="text" value="' + l.text + '" placeholder="' + getTranslation('placeholder_link_text') + '" oninput="updateHyperlinkData(\'' + idStr + '\', \'text\', this.value)" style="flex: 1; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">';
        html += '<button class="btn-icon" onclick="removeHyperlinkItem(\'' + idStr + '\')" style="margin-left: auto;">🗑️</button>';
        html += '</div>';
        html += '<input type="text" value="' + l.url + '" placeholder="' + getTranslation('placeholder_link_url') + '" oninput="updateHyperlinkData(\'' + idStr + '\', \'url\', this.value)" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; box-sizing: border-box;">';
        html += '</div>';
        return html;
    }).join('');
}
window.renderHyperlinkList = renderHyperlinkList;

function updateHyperlinkData(id, field, value) {
    var l = currentTaskLinks.find(function(x) { return String(x.id) === String(id); });
    if (l) l[field] = value;
}
window.updateHyperlinkData = updateHyperlinkData;

window.showModal = showModal;
window.closeModal = closeModal;
window.switchToViewMode = switchToViewMode;
window.switchToEditMode = switchToEditMode;
window.openTaskModal = openTaskModal;
window.closeTaskModal = closeTaskModal;
window.updateTaskModalVisibility = updateTaskModalVisibility;
window.toggleTimerInput = toggleTimerInput;
window.requestDurationPicker = requestDurationPicker;
window.onDurationPickerDismissed = onDurationPickerDismissed;
window.onDurationSelected = onDurationSelected;
window.openTemporaryVisibilityModal = openTemporaryVisibilityModal;
window.closeTemporaryVisibilityModal = closeTemporaryVisibilityModal;
window.applyTemporaryVisibility = applyTemporaryVisibility;
window.updateMelodyData = updateMelodyData;
window.startMelodyTest = startMelodyTest;

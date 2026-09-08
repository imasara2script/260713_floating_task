/**
 * System, Data, and Ad Management Logic
 */

function exportData() {
    const isPremiumValue = (typeof Android !== 'undefined' && Android.isPremium && Android.isPremium());
    const coins = (typeof Android !== 'undefined' && Android.getCoins) ? Android.getCoins() : 0;
    const msg = getTranslation('msg_backup_confirm');

    if (isPremiumValue) {
        showModal(msg, {
            onConfirm: performBackup
        });
        return;
    }

    if (coins > 0) {
        showModal(msg, {
            confirmText: getTranslation('btn_use_coin'),
            neutralText: getTranslation('btn_watch_ad'),
            onConfirm: () => {
                if (typeof Android !== 'undefined' && Android.consumeCoin()) {
                    updateCoinDisplay();
                    performBackup();
                }
            },
            onNeutral: () => {
                pendingAction = 'backup';
                if (typeof Android !== 'undefined' && Android.showRewardedAd) {
                    Android.showRewardedAd();
                }
            }
        });
        return;
    }

    showModal(msg + "\n\n" + getTranslation('msg_ad_notice'), {
        confirmText: getTranslation('btn_watch_ad'),
        onConfirm: () => {
            pendingAction = 'backup';
            if (typeof Android !== 'undefined' && Android.showRewardedAd) {
                Android.showRewardedAd();
            }
        }
    });
}

function performBackup() {
    const data = {
        tasks: tasks,
        taskHistory: history,
        calendarMark: calendarMark,
        showAllInFloating: showAllInFloating,
        floatX: localStorage.getItem('floatX'),
        floatY: localStorage.getItem('floatY'),
        floatWidth: localStorage.getItem('floatWidth'),
        floatHeight: localStorage.getItem('floatHeight'),
        floatScale: localStorage.getItem('floatScale'),
        floatCollapsedScale: localStorage.getItem('floatCollapsedScale'),
        floatExpandedScale: localStorage.getItem('floatExpandedScale'),
        showWhenEmpty: localStorage.getItem('showWhenEmpty') === 'true',
        alwaysMoveCollapsed: localStorage.getItem('alwaysMoveCollapsed') === 'true',
        alwaysMoveExpanded: localStorage.getItem('alwaysMoveExpanded') === 'true',
        allowDragCollapsed: localStorage.getItem('allowDragCollapsed') !== 'false',
        floatCollapsedX: localStorage.getItem('floatCollapsedX'),
        floatCollapsedY: localStorage.getItem('floatCollapsedY'),
        floatExpandedX: localStorage.getItem('floatExpandedX'),
        floatExpandedY: localStorage.getItem('floatExpandedY'),
        showCloseButtonExpanded: localStorage.getItem('showCloseButtonExpanded') === 'true',
        keepServiceOnClose: localStorage.getItem('keepServiceOnClose') === 'true',
        showCheckedToggle: localStorage.getItem('showCheckedToggle') === 'true',
        showHistoryButton: localStorage.getItem('showHistoryButton') === 'true',
        allowDrag: localStorage.getItem('allowDrag') !== 'false',
        scrollButtonType: localStorage.getItem('scrollButtonType') || 'both',
        navType: localStorage.getItem('navType') || 'button',
        displayTaskCount: localStorage.getItem('displayTaskCount'),
        scrollTaskCount: localStorage.getItem('scrollTaskCount'),
        recheckInterval: localStorage.getItem('recheckInterval'),
        bgThresholds: bgThresholds
    };
    if (typeof Android !== 'undefined' && Android.backupData) {
        Android.backupData(JSON.stringify(data));
    }
}

function startRestore(isImport = false) {
    isImportMode = !!isImport;
    if (typeof Android !== 'undefined' && Android.restoreData) {
        Android.restoreData();
    }
}

function requestPaymentAndRestore(data, options) {
    pendingRestoreData = data;
    pendingRestoreOptions = options;

    const isPremiumValue = (typeof Android !== 'undefined' && Android.isPremium && Android.isPremium());
    const coins = (typeof Android !== 'undefined' && Android.getCoins) ? Android.getCoins() : 0;
    const msg = getTranslation(isImportMode ? 'msg_import_confirm' : 'msg_restore_confirm');

    if (isPremiumValue) {
        performRestore(pendingRestoreData, pendingRestoreOptions);
        return;
    }

    if (coins > 0) {
        showModal(msg, {
            confirmText: getTranslation('btn_use_coin'),
            neutralText: getTranslation('btn_watch_ad'),
            onConfirm: () => {
                if (typeof Android !== 'undefined' && Android.consumeCoin()) {
                    updateCoinDisplay();
                    performRestore(pendingRestoreData, pendingRestoreOptions);
                }
            },
            onNeutral: () => {
                pendingAction = 'restore';
                if (typeof Android !== 'undefined' && Android.showRewardedAd) {
                    Android.showRewardedAd();
                }
            }
        });
        return;
    }

    showModal(msg + "\n\n" + getTranslation('msg_ad_notice'), {
        confirmText: getTranslation('btn_watch_ad'),
        onConfirm: () => {
            pendingAction = 'restore';
            if (typeof Android !== 'undefined' && Android.showRewardedAd) {
                Android.showRewardedAd();
            }
        }
    });
}

function applyRestoredData(jsonString, fileName) {
    try {
        const data = JSON.parse(jsonString);

        // プレビュー表示の構築
        let previewHtml = `<div style="text-align:left; margin-top:10px; white-space: normal;">
<div style="background:#eee; padding:8px; border-radius:4px; margin-bottom:12px; font-size:12px; word-break:break-all;">
📄 ${fileName || '---'}
</div>
<p style="margin-bottom:15px; font-weight:bold;">${getTranslation(isImportMode ? 'msg_import_preview' : 'msg_restore_preview')}</p>`;

        // タスク一覧
        if (data.tasks && data.tasks.length > 0) {
            if (isImportMode) {
                previewHtml += `<div class="preview-section">
                    <label class="preview-title"><input type="checkbox" id="restore-tasks" checked onchange="toggleAllImportTasks(this.checked)"> ${getTranslation('label_tasks')}</label>
                    <div class="preview-item" style="max-height: 350px; overflow-y: auto; white-space: normal;">
                        ${data.tasks.map((t, idx) => {
                            const daysText = (typeof getTaskDaysText === 'function') ? getTaskDaysText(t) : '';
                            const timerText = (typeof getTaskTimerInfo === 'function') ? getTaskTimerInfo(t) : '';
                            return `
                                <div style="margin-bottom: 8px; display: flex; align-items: flex-start; gap: 6px;">
                                    <input type="checkbox" class="import-task-item-check" data-index="${idx}" checked id="task-idx-${idx}" onchange="updateImportHeaderCheckbox()">
                                    <div style="flex: 1;">
                                        <label for="task-idx-${idx}" style="font-weight: normal; cursor: pointer; display: block; word-break: break-all;">${t.text}</label>
                                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                            ${daysText ? `<div style="font-size: 11px; color: #666; margin-top: 2px;">🗓️ ${daysText}</div>` : ''}
                                            ${timerText ? `<div style="font-size: 11px; color: #666; margin-top: 2px;">${timerText}</div>` : ''}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>`;
            } else {
                previewHtml += `<div class="preview-section">
                    <label class="preview-title"><input type="checkbox" id="restore-tasks" checked> ${getTranslation('label_tasks')}</label>
                    <div class="preview-item">${data.tasks.map(t => {
                        const daysText = (typeof getTaskDaysText === 'function') ? getTaskDaysText(t) : '';
                        const timerText = (typeof getTaskTimerInfo === 'function') ? getTaskTimerInfo(t) : '';
                        let meta = [];
                        if (daysText) meta.push(`🗓️ ${daysText}`);
                        if (timerText) meta.push(timerText);
                        return '・' + t.text + (meta.length > 0 ? ` (${meta.join(' / ')})` : '');
                    }).join('\n')}</div>
                </div>`;
            }
        }

        // 完了履歴
        if (data.taskHistory && data.taskHistory.length > 0) {
            const h = data.taskHistory;
            const count = h.length;
            const dates = h.map(x => new Date(x.completedAt)).sort((a,b) => a-b);
            const start = dates[0].toLocaleString();
            const end = dates[dates.length-1].toLocaleString();
            previewHtml += `<div class="preview-section">
                <label class="preview-title"><input type="checkbox" id="restore-history" checked> ${getTranslation('label_history')}</label>
                <div class="preview-item">${count}件：${start} ～ ${end}</div>
            </div>`;
        }

        // カレンダーのマーク
        if (!isImportMode && data.calendarMark) {
            previewHtml += `<div class="preview-section">
                <label class="preview-title"><input type="checkbox" id="restore-calendar" checked> ${getTranslation('label_calendar_mark')}</label>
                <div class="preview-item">${data.calendarMark}</div>
            </div>`;
        }

        // フローティングウィンドウの設定
        const hasFloatSettings = ['floatScale', 'floatWidth', 'floatHeight'].some(k => data[k] !== undefined);
        if (!isImportMode && hasFloatSettings) {
            previewHtml += `<div class="preview-section">
                <label class="preview-title"><input type="checkbox" id="restore-float" checked> ${getTranslation('btn_floating_settings')}</label>
                <div class="preview-item">表示倍率：${data.floatScale || 1.0}倍\n縦幅：${data.floatHeight || 0}px\n横幅：${data.floatWidth || 0}px</div>
            </div>`;
        }

        // 配色ルール
        if (!isImportMode && data.bgThresholds && data.bgThresholds.length > 0) {
            previewHtml += `<div class="preview-section">
                <label class="preview-title"><input type="checkbox" id="restore-colors" checked> ${getTranslation('label_color_rules')}</label>
                <div class="preview-item">${data.bgThresholds.map(r => {
                    const mins = Math.floor(r.threshold / 60);
                    return `${mins}分以下 <span class="color-dot" style="background:${r.bgColor};"></span> / <span class="color-dot" style="background:${r.textColor};"></span>`;
                }).join('\n')}</div>
            </div>`;
        }

        previewHtml += `</div>`;

        showModal(previewHtml, {
            useHTML: true,
            onConfirm: () => {
                const options = {
                    tasks: document.getElementById('restore-tasks')?.checked,
                    history: document.getElementById('restore-history')?.checked,
                    calendar: document.getElementById('restore-calendar')?.checked,
                    float: document.getElementById('restore-float')?.checked,
                    colors: document.getElementById('restore-colors')?.checked
                };
                if (isImportMode) {
                    options.selectedTaskIndices = Array.from(document.querySelectorAll('.import-task-item-check'))
                        .filter(el => el.checked)
                        .map(el => parseInt(el.getAttribute('data-index')));
                }
                requestPaymentAndRestore(data, options);
            }
        });
    } catch (e) {
        showModal(getTranslation('msg_restore_fail'), { hideCancel: true });
        console.error(e);
    }
}

function performRestore(data, options) {
    try {
        let importedCount = 0;
        if (data.tasks && data.tasks.length > 0) {
            if (isImportMode) {
                const selectedIndices = options.selectedTaskIndices || [];
                const selectedTasks = selectedIndices.map(idx => data.tasks[idx]).filter(t => t !== undefined);
                importedCount = selectedTasks.length;

                if (selectedTasks.length > 0) {
                    const now = Date.now();
                    const newTasks = selectedTasks.map((t, idx) => ({
                        ...t,
                        id: now + idx,
                        completed: false // インポート時は未完了状態で追加
                    }));
                    tasks = [...tasks, ...newTasks];
                    localStorage.setItem('tasks', JSON.stringify(tasks));
                }
            } else if (options.tasks) {
                tasks = data.tasks;
                importedCount = tasks.length;
                localStorage.setItem('tasks', JSON.stringify(tasks));
            }
        }
        if (options.history && data.taskHistory) {
            if (isImportMode) {
                // インポートの場合は履歴に追加 (重複はスキップ)
                const existingEntries = new Set(history.map(h => `${h.text}|${h.completedAt}`));
                const newEntries = data.taskHistory.filter(h => !existingEntries.has(`${h.text}|${h.completedAt}`));

                history = [...history, ...newEntries];
                if (history.length > 500) {
                    history.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
                    history = history.slice(0, 500);
                }
            } else {
                history = data.taskHistory;
            }
            localStorage.setItem('taskHistory', JSON.stringify(history));
        }
        if (!isImportMode) {
            if (options.calendar && data.calendarMark) {
                calendarMark = data.calendarMark;
                localStorage.setItem('calendarMark', calendarMark);
            }
            if (options.float) {
                const keys = [
                    'floatX', 'floatY', 'floatWidth', 'floatHeight', 'floatScale',
                    'floatCollapsedScale', 'floatExpandedScale',
                    'floatCollapsedX', 'floatCollapsedY', 'floatExpandedX', 'floatExpandedY',
                    'displayTaskCount', 'scrollTaskCount', 'recheckInterval', 'scrollButtonType', 'navType'
                ];
                const boolKeys = [
                    'showWhenEmpty', 'alwaysMoveCollapsed', 'alwaysMoveExpanded', 'showCloseButtonExpanded', 'keepServiceOnClose', 'showCheckedToggle', 'allowDrag', 'allowDragCollapsed', 'showHistoryButton'
                ];
                if (data.showAllInFloating !== undefined) {
                    localStorage.setItem('showAllInFloating', data.showAllInFloating);
                }
                keys.forEach(key => {
                    if (data[key] !== undefined) {
                        localStorage.setItem(key, data[key]);
                    }
                });
                boolKeys.forEach(key => {
                    if (data[key] !== undefined) {
                        localStorage.setItem(key, data[key] ? 'true' : 'false');
                    }
                });
            }
            if (options.colors && data.bgThresholds) {
                bgThresholds = data.bgThresholds;
                localStorage.setItem('bgThresholds', JSON.stringify(bgThresholds));
            }
        }

        showModal(getTranslation(isImportMode ? 'msg_import_success' : 'msg_restore_success', importedCount), {
            hideCancel: true,
            onConfirm: () => {
                // 全タスクの完了状態を Android 側に同期
                if (typeof Android !== 'undefined' && Android.updateTaskCompletionState) {
                    tasks.forEach(t => Android.updateTaskCompletionState(t.id, t.completed));
                }
                pendingRestoreData = null;
                pendingRestoreOptions = null;
                window.location.reload();
            }
        });
    } catch (e) {
        showModal(getTranslation('msg_restore_fail'), { hideCancel: true });
    }
}

function toggleAllImportTasks(checked) {
    document.querySelectorAll('.import-task-item-check').forEach(el => {
        el.checked = checked;
    });
}

function updateImportHeaderCheckbox() {
    const header = document.getElementById('restore-tasks');
    if (!header) return;
    const items = document.querySelectorAll('.import-task-item-check');
    const checkedCount = Array.from(items).filter(el => el.checked).length;

    header.checked = checkedCount > 0;
    header.indeterminate = checkedCount > 0 && checkedCount < items.length;
}

function updateAlarmStatus() {
    if (typeof Android !== 'undefined' && Android.checkExactAlarmPermission) {
        const hasPermission = Android.checkExactAlarmPermission();
        const statusEl = document.getElementById('alarmStatus');
        const btnEl = document.getElementById('btn-request-alarm');
        if (statusEl) {
            if (hasPermission) {
                statusEl.innerHTML = getTranslation('msg_alarm_enabled');
                statusEl.style.color = "green";
                if (btnEl) btnEl.style.display = "none";
            } else {
                statusEl.innerHTML = getTranslation('msg_alarm_disabled');
                statusEl.style.color = "orange";
                if (btnEl) btnEl.style.display = "block";
            }
        }
    }
}

function toggleLogging() {
    const checkbox = document.getElementById('loggingToggle');
    if (!checkbox) return;
    const newEnabled = checkbox.checked;

    if (newEnabled) {
        // 有効化時は確認モーダルを表示
        showModal(getTranslation('msg_logging_confirm'), {
            onConfirm: () => {
                if (typeof Android !== 'undefined' && Android.setLoggingEnabled) {
                    Android.setLoggingEnabled(true);
                }
                const section = document.getElementById('logInfoSection');
                if (section) section.style.display = 'block';
                updateLogSize();
            },
            onCancel: () => {
                checkbox.checked = false;
            }
        });
    } else {
        if (typeof Android !== 'undefined' && Android.setLoggingEnabled) {
            Android.setLoggingEnabled(false);
        }
        const section = document.getElementById('logInfoSection');
        if (section) section.style.display = 'none';
    }
}

function updateLogSize() {
    if (typeof Android !== 'undefined' && Android.getLogSize) {
        const size = Android.getLogSize();
        const textEl = document.getElementById('logSizeText');
        if (textEl) textEl.textContent = size.toFixed(2);
    }
}

function addLogComment() {
    const input = document.getElementById('logCommentInput');
    if (!input) return;
    const comment = input.value.trim();
    if (comment && typeof Android !== 'undefined' && Android.logComment) {
        Android.logComment(comment);
        input.value = '';
        showModal(getTranslation('msg_log_comment_success'), { hideCancel: true });
        updateLogSize();
    }
}

function viewAppLog() {
    if (typeof Android === 'undefined' || !Android.getLogContent) {
        showModal("Logging interface not available.", { hideCancel: true });
        return;
    }

    // 最新のシステム状態も記録
    if (Android.logSystemStatus) Android.logSystemStatus();
    updateLogSize();

    const logContent = Android.getLogContent();
    showModal(getTranslation('developer_title'), {
        showTextarea: true,
        inputValue: logContent,
        confirmText: getTranslation('btn_copy_log'),
        onConfirm: (val) => {
            const ta = document.getElementById('modalTextarea');
            if (ta) {
                ta.select();
                ta.setSelectionRange(0, 99999);
                document.execCommand("copy");
                showModal("Copied to clipboard", { hideCancel: true });
            }
        }
    });
}

function clearAppLog() {
    if (typeof Android !== 'undefined' && Android.clearLog) {
        Android.clearLog();
        updateLogSize();
        showModal(getTranslation('msg_log_cleared'), { hideCancel: true });
    }
}

function updateCoinDisplay() {
    if (typeof Android !== 'undefined' && Android.getCoins) {
        const coins = Android.getCoins();
        const display = document.getElementById('coin-display');
        if (display) {
            display.textContent = getTranslation('label_current_coins', coins);
        }
    }
}

function earnCoinReward() {
    console.log("earnCoinReward clicked");
    if (typeof Android !== 'undefined' && Android.canEarnCoinToday) {
        if (!Android.canEarnCoinToday()) {
            showModal(getTranslation('msg_ad_limit_reached'), { hideCancel: true });
            return;
        }
    }

    showModal(getTranslation('msg_confirm_reward_ad'), {
        onConfirm: () => {
            console.log("earnCoinReward confirmed");
            if (typeof Android !== 'undefined' && Android.showRewardedAdForCoin) {
                Android.showRewardedAdForCoin();
            } else {
                console.error("Android.showRewardedAdForCoin is undefined");
            }
        }
    });
}

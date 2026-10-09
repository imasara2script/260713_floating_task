package com.example.floatingtask

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.edit
import org.json.JSONArray
import org.json.JSONObject

class WebTaskActionHandler(
    private val context: Context,
    private val permissionHandler: WebPermissionHandler,
    private val listener: TaskActionListener
) {

    interface TaskActionListener {
        fun startFloatingService(isSettingsMode: Boolean)
        fun onPendingTaskCountChanged(count: Int)
    }

    fun testIntervalNotification() {
        AppLogger.log(context, "MainActivity: testIntervalNotification triggered")
        AlarmReceiver().showIntervalNotification(context)
    }

    fun startFloatingWindow() {
        if (!permissionHandler.checkOverlayPermissionGranted()) {
            // 注意: ダイアログ表示は Activity の責務なので、ここでは何もしないか、
            // 必要に応じてリスナー経由で通知する。
            // 現状は WebAppInterface 側で判定して制御している。
        } else {
            listener.startFloatingService(isSettingsMode = true)
        }
    }

    fun stopFloatingWindow() {
        val intent = Intent(context, FloatingWindowService::class.java)
        intent.action = "ACTION_HIDE"
        context.startService(intent)
    }

    fun setReminderAlarms(taskId: Long, taskText: String, jsonReminders: String) {
        val prefs = context.getSharedPreferences("task_reminders_prefs", Context.MODE_PRIVATE)
        val oldTimesJson = prefs.getString(taskId.toString(), null)
        if (oldTimesJson != null) {
            try {
                val oldTimes = JSONArray(oldTimesJson)
                val timeList = mutableListOf<String>()
                for (i in 0 until oldTimes.length()) {
                    timeList.add(oldTimes.getString(i))
                }
                AlarmScheduler.cancelReminderAlarms(context, taskId, timeList)
            } catch (e: Exception) {
                AppLogger.log(context, "Error parsing old reminders: ${e.message}")
            }
        }

        try {
            val reminders = JSONArray(jsonReminders)
            val newTimes = JSONArray()
            for (i in 0 until reminders.length()) {
                val obj = reminders.getJSONObject(i)
                val time = obj.getString("time")
                val message = obj.optString("message", "")
                val melody = obj.optString("melody", "default")
                val melodyMode = obj.optString("melodyMode", "once")
                AlarmScheduler.scheduleReminderAlarm(context, taskId, taskText, time, message, melody, melodyMode)
                newTimes.put(time)
            }
            prefs.edit { putString(taskId.toString(), newTimes.toString()) }
        } catch (e: Exception) {
            AppLogger.log(context, "Error parsing reminders: ${e.message}")
        }
    }

    fun updateTaskCompletionState(taskId: Long, isCompleted: Boolean) {
        val prefs = context.getSharedPreferences("task_completion_prefs", Context.MODE_PRIVATE)
        prefs.edit { putBoolean(taskId.toString(), isCompleted) }
    }

    fun getPendingHistoryItems(): String =
        PendingHistoryManager.getPendingHistoryItems(context)

    fun checkMissedAlarms(jsonTasks: String): String {
        val missedList = JSONArray()
        try {
            val tasks = JSONArray(jsonTasks)
            val firedPrefs = context.getSharedPreferences("alarm_fired_prefs", Context.MODE_PRIVATE)
            val missedReportedPrefs = context.getSharedPreferences("alarm_missed_reported_prefs", Context.MODE_PRIVATE)
            val now = System.currentTimeMillis()

            for (i in 0 until tasks.length()) {
                val task = tasks.getJSONObject(i)
                val taskId = task.optLong("id", -1L)
                val text = task.optString("text", "")
                val completed = task.optBoolean("completed", false)
                val durationMs = task.optLong("durationMs", 0L)
                val startTime = task.optLong("startTime", 0L)

                if (taskId == -1L || completed) continue

                // Check timer expiration
                if (durationMs > 0) {
                    val targetTime = startTime + durationMs
                    if (targetTime <= now) {
                        val firedKey = "timer_$taskId"
                        val reportedKey = "reported_timer_${taskId}_$targetTime"
                        val fired = firedPrefs.getBoolean(firedKey, false)
                        val reported = missedReportedPrefs.getBoolean(reportedKey, false)

                        if (!fired && !reported) {
                            missedReportedPrefs.edit { putBoolean(reportedKey, true) }
                            val obj = JSONObject()
                            obj.put("taskId", taskId)
                            obj.put("text", text)
                            obj.put("type", "timer")
                            missedList.put(obj)
                        }
                    }
                }

                // Check reminders
                val reminders = task.optJSONArray("reminders")
                if (reminders != null) {
                    val calendar = java.util.Calendar.getInstance()
                    val todayStr = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
                    for (j in 0 until reminders.length()) {
                        val rem = reminders.getJSONObject(j)
                        val timeStr = rem.optString("time", "")
                        if (timeStr.isNotEmpty()) {
                            val parts = timeStr.split(":")
                            if (parts.size == 2) {
                                calendar.set(java.util.Calendar.HOUR_OF_DAY, parts[0].toInt())
                                calendar.set(java.util.Calendar.MINUTE, parts[1].toInt())
                                calendar.set(java.util.Calendar.SECOND, 0)
                                calendar.set(java.util.Calendar.MILLISECOND, 0)
                                val remTargetTime = calendar.timeInMillis
                                if (remTargetTime <= now) {
                                    val firedKey = "reminder_${taskId}_${todayStr}_$timeStr"
                                    val reportedKey = "reported_reminder_${taskId}_${todayStr}_$timeStr"
                                    val fired = firedPrefs.getBoolean(firedKey, false)
                                    val reported = missedReportedPrefs.getBoolean(reportedKey, false)

                                    if (!fired && !reported) {
                                        missedReportedPrefs.edit { putBoolean(reportedKey, true) }
                                        val obj = JSONObject()
                                        obj.put("taskId", taskId)
                                        obj.put("text", text)
                                        obj.put("type", "reminder")
                                        obj.put("time", timeStr)
                                        missedList.put(obj)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (e: Exception) {
            AppLogger.log(context, "Error checking missed alarms: ${e.message}")
        }
        return missedList.toString()
    }

    fun testReminderNotification(taskText: String, message: String) {
        val channelId = "reminders_channel"
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                context.getString(R.string.channel_reminders),
                NotificationManager.IMPORTANCE_HIGH
            )
            manager.createNotificationChannel(channel)
        }

        val body = if (message.isNotEmpty()) {
            context.getString(R.string.reminder_body_with_msg, taskText, message)
        } else {
            context.getString(R.string.reminder_body_no_msg, taskText)
        }

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(context.getString(R.string.reminder_title))
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        manager.notify(System.currentTimeMillis().toInt(), notification)
    }

    fun onDataChanged() {
        val intent = Intent("com.example.floatingtask.DATA_CHANGED")
        intent.setPackage(context.packageName)
        context.sendBroadcast(intent)
    }

    fun toggleExpand(expanded: Boolean) {
        if (permissionHandler.checkOverlayPermissionGranted()) {
            val intent = Intent(context, FloatingWindowService::class.java)
            intent.action = if (expanded) "ACTION_EXPAND" else "ACTION_COLLAPSE"
            context.startService(intent)
        }
    }

    fun updatePendingTaskCount(count: Int) {
        listener.onPendingTaskCountChanged(count)
        val prefs = context.getSharedPreferences("prefs", Context.MODE_PRIVATE)
        prefs.edit { putInt("pendingTaskCount", count) }
    }

    fun setIntervalAlarm(minutes: Int) {
        AppLogger.log(context, "setIntervalAlarm called. minutes=$minutes")
        val prefs = context.getSharedPreferences("prefs", Context.MODE_PRIVATE)
        prefs.edit { putInt("recheckInterval", minutes) }

        if (minutes > 0) {
            AlarmScheduler.scheduleIntervalAlarm(context, minutes)
        } else {
            AlarmScheduler.cancelIntervalAlarm(context)
        }
    }

    fun setTimerAlarm(taskId: Long, taskText: String, durationMs: Long, melody: String, melodyMode: String = "once", audioAttribute: String = "alarm") {
        AlarmScheduler.scheduleTimerAlarm(context, taskId, taskText, durationMs, melody, melodyMode, audioAttribute)
    }
}

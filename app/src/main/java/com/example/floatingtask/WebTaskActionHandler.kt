package com.example.floatingtask

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.edit
import org.json.JSONArray

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
                AlarmScheduler.scheduleReminderAlarm(context, taskId, taskText, time, message)
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

    fun setTimerAlarm(taskId: Long, taskText: String, durationMs: Long, melody: String) {
        AlarmScheduler.scheduleTimerAlarm(context, taskId, taskText, durationMs, melody)
    }
}

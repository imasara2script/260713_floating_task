package com.example.floatingtask

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import java.util.Calendar

object AlarmScheduler {
    fun scheduleMidnightAlarm(context: Context) {
        scheduleAlarmAt(context, 0, 0, "ACTION_MIDNIGHT_RESET", 0)
    }

    fun scheduleNoonAlarm(context: Context) {
        scheduleAlarmAt(context, 12, 0, "ACTION_NOON_CHECK", 1)
    }

    fun scheduleIntervalAlarm(context: Context, minutes: Int) {
        // 設定を保存
        val prefs = context.getSharedPreferences("prefs", Context.MODE_PRIVATE)
        prefs.edit().putInt("recheckInterval", minutes).apply()

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = "ACTION_INTERVAL_CHECK"
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            2,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // minutesが0ならアラームをキャンセル
        if (minutes <= 0) {
            alarmManager.cancel(pendingIntent)
            return
        }

        val triggerAt = System.currentTimeMillis() + minutes * 60 * 1000
        setExactAlarm(alarmManager, triggerAt, pendingIntent)
    }

    fun cancelIntervalAlarm(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = "ACTION_INTERVAL_CHECK"
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            2,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager.cancel(pendingIntent)
    }

    fun scheduleTimerAlarm(context: Context, taskId: Long, taskText: String, durationMs: Long, melody: String) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = "ACTION_TIMER_EXPIRED"
            putExtra("EXTRA_TASK_ID", taskId)
            putExtra("EXTRA_TASK_TEXT", taskText)
            putExtra("EXTRA_MELODY", melody)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            (taskId % Int.MAX_VALUE).toInt(), // requestCodeとしてtaskIdの剰余を使用
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val triggerAt = System.currentTimeMillis() + durationMs
        setExactAlarm(alarmManager, triggerAt, pendingIntent)
    }

    fun scheduleReminderAlarm(context: Context, taskId: Long, taskText: String, timeStr: String, message: String) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = "ACTION_REMINDER"
            putExtra("EXTRA_TASK_ID", taskId)
            putExtra("EXTRA_TASK_TEXT", taskText)
            putExtra("EXTRA_REMINDER_MSG", message)
            putExtra("EXTRA_TIME_STR", timeStr)
        }
        
        // requestCodeは taskId と時刻文字列のハッシュを組み合わせて一意にする
        val requestCode = (taskId.toString() + timeStr).hashCode()
        
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val parts = timeStr.split(":").map { it.toInt() }
        val hour = parts[0]
        val minute = parts[1]
        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (timeInMillis <= System.currentTimeMillis()) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }

        setExactAlarm(alarmManager, calendar.timeInMillis, pendingIntent)
    }

    fun cancelReminderAlarms(context: Context, taskId: Long, timeStrings: List<String>) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        timeStrings.forEach { timeStr ->
            val intent = Intent(context, AlarmReceiver::class.java).apply {
                action = "ACTION_REMINDER"
            }
            val requestCode = (taskId.toString() + timeStr).hashCode()
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            )
            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
            }
        }
    }

    private fun setExactAlarm(alarmManager: AlarmManager, triggerAt: Long, pendingIntent: PendingIntent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (alarmManager.canScheduleExactAlarms()) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerAt,
                    pendingIntent
                )
            } else {
                alarmManager.setAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerAt,
                    pendingIntent
                )
            }
        } else {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerAt,
                pendingIntent
            )
        }
    }

    private fun scheduleAlarmAt(context: Context, hour: Int, minute: Int, actionStr: String, requestCode: Int) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = actionStr
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val calendar = Calendar.getInstance().apply {
            timeInMillis = System.currentTimeMillis()
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            // 指定時刻を過ぎている場合は翌日に設定
            if (timeInMillis <= System.currentTimeMillis()) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (alarmManager.canScheduleExactAlarms()) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    pendingIntent
                )
            } else {
                alarmManager.setAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    pendingIntent
                )
            }
        } else {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                calendar.timeInMillis,
                pendingIntent
            )
        }
    }
}

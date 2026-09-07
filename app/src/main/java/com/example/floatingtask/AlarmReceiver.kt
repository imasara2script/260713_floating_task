package com.example.floatingtask

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.provider.Settings
import android.util.Log
import androidx.core.app.NotificationCompat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        AppLogger.log(context, "AlarmReceiver: onReceive called with action=$action")
        
        if (action == Intent.ACTION_BOOT_COMPLETED || action == "android.intent.action.QUICKBOOT_POWERON") {
            // 端末起動時にアラームを再設定
            AlarmScheduler.scheduleMidnightAlarm(context)
            AlarmScheduler.scheduleNoonAlarm(context)
            
            // 保存されているインターバルアラームを復元
            val prefs = context.getSharedPreferences("prefs", Context.MODE_PRIVATE)
            val minutes = prefs.getInt("recheckInterval", 0)
            if (minutes > 0) {
                AlarmScheduler.scheduleIntervalAlarm(context, minutes)
            }

            // タイマーの復元は WebView 起動時の checkDailyReset() で行われるため、
            // ここで FloatingWindowService を起動して WebView をロードさせる
            if (Settings.canDrawOverlays(context)) {
                val serviceIntent = Intent(context, FloatingWindowService::class.java).apply {
                    this.action = "ACTION_SHOW"
                }
                context.startForegroundService(serviceIntent)
            }
        } else if (action == "ACTION_TIMER_EXPIRED") {
            val taskText = intent.getStringExtra("EXTRA_TASK_TEXT") ?: context.getString(R.string.timer_expired)
            val melody = intent.getStringExtra("EXTRA_MELODY") ?: "default"

            // 完了日時を取得
            val sdf = SimpleDateFormat("MM/dd (E) HH:mm", Locale.getDefault())
            val timestamp = sdf.format(Date())
            val messageWithTime = taskText + context.getString(R.string.timer_completion_time_format, timestamp)

            showNotification(context, context.getString(R.string.timer_expired), messageWithTime, melody)
            
            if (Settings.canDrawOverlays(context)) {
                val serviceIntent = Intent(context, FloatingWindowService::class.java).apply {
                    this.action = "ACTION_SHOW"
                }
                context.startForegroundService(serviceIntent)
            }
        } else if (action == "ACTION_NOON_CHECK" || action == "ACTION_INTERVAL_CHECK") {
            // 正午またはインターバルチェック: 未完了タスクがある場合のみ表示
            val prefs = context.getSharedPreferences("prefs", Context.MODE_PRIVATE)
            val pendingTaskCount = prefs.getInt("pendingTaskCount", 0)
            val showWhenEmpty = prefs.getBoolean("showWhenEmpty", false)
            
            AppLogger.log(context, "AlarmReceiver: Processing action=$action, pending=$pendingTaskCount, showWhenEmpty=$showWhenEmpty")
            
            if (pendingTaskCount > 0 || showWhenEmpty) {
                val isAppInForeground = prefs.getBoolean("isAppInForeground", false)
                val isFloatingVisible = prefs.getBoolean("isFloatingVisible", false)
                
                // アプリもウィンドウも表示されていない時のみ通知
                if (!isAppInForeground && !isFloatingVisible) {
                    showIntervalNotification(context)
                } else {
                    AppLogger.log(context, "AlarmReceiver: Skip notification (InForeground=$isAppInForeground, FloatVisible=$isFloatingVisible)")
                }

                if (Settings.canDrawOverlays(context)) {
                    try {
                        AppLogger.log(context, "AlarmReceiver: Attempting auto-show service")
                        val serviceIntent = Intent(context, FloatingWindowService::class.java).apply {
                            this.action = "ACTION_SHOW"
                        }
                        context.startForegroundService(serviceIntent)
                    } catch (e: Exception) {
                        AppLogger.log(context, "AlarmReceiver: Auto-show blocked: ${e.message}")
                    }
                } else {
                    AppLogger.log(context, "AlarmReceiver: Skip auto-show (No Overlay permission)")
                }
            } else {
                AppLogger.log(context, "AlarmReceiver: No tasks to show. Rescheduling only.")
            }
            
            // 次のアラームをスケジュール
            if (action == "ACTION_NOON_CHECK") {
                AlarmScheduler.scheduleNoonAlarm(context)
            } else if (action == "ACTION_INTERVAL_CHECK") {
                val minutes = prefs.getInt("recheckInterval", 0)
                if (minutes > 0) {
                    AlarmScheduler.scheduleIntervalAlarm(context, minutes)
                }
            }
        } else if (action == "ACTION_MIDNIGHT_RESET") {
            AppLogger.log(context, "AlarmReceiver: Midnight reset triggered")
            // AM0時の処理: フローティングサービスを開始してリセットを実行
            if (Settings.canDrawOverlays(context)) {
                val serviceIntent = Intent(context, FloatingWindowService::class.java).apply {
                    putExtra("TRIGGER_RESET", true)
                    this.action = "ACTION_SHOW"
                }
                context.startForegroundService(serviceIntent)
            }
            
            // 次の日の AM0時を再スケジュール
            AlarmScheduler.scheduleMidnightAlarm(context)
        } else if (intent.action == "ACTION_REMINDER") {
            val taskId = intent.getLongExtra("EXTRA_TASK_ID", -1L)
            val taskText = intent.getStringExtra("EXTRA_TASK_TEXT") ?: ""
            val message = intent.getStringExtra("EXTRA_REMINDER_MSG") ?: ""
            val timeStr = intent.getStringExtra("EXTRA_TIME_STR") ?: ""

            // 完了状態を SharedPreferences からチェック
            val prefs = context.getSharedPreferences("task_completion_prefs", Context.MODE_PRIVATE)
            val isCompleted = prefs.getBoolean(taskId.toString(), false)

            if (!isCompleted) {
                showReminderNotification(context, taskText, message)
            }

            // 翌日のアラームを再スケジュール
            if (timeStr.isNotEmpty()) {
                AlarmScheduler.scheduleReminderAlarm(context, taskId, taskText, timeStr, message)
            }
        }
    }

    private fun showReminderNotification(context: Context, taskText: String, message: String) {
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

    private fun showNotification(context: Context, title: String, message: String, melody: String) {
        if (melody == "none") {
            // 通知は出すが音は出さない、または通知自体出さないか検討が必要。
            // ここでは音なし通知とする。
            showSilentNotification(context, title, message)
            return
        }

        val channelId = "timer_notifications_${melody.hashCode()}"
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        val soundUri = when {
            melody == "alarm" -> RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            melody == "chime" -> RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            melody.startsWith("content://") -> android.net.Uri.parse(melody)
            else -> RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channelName = when {
                melody == "alarm" -> context.getString(R.string.channel_timer_alarm)
                melody == "chime" -> context.getString(R.string.channel_timer_chime)
                melody.startsWith("content://") -> context.getString(R.string.channel_timer_custom)
                else -> context.getString(R.string.channel_timer_notifications)
            }
            val channel = NotificationChannel(channelId, channelName, NotificationManager.IMPORTANCE_HIGH).apply {
                setSound(soundUri, Notification.AUDIO_ATTRIBUTES_DEFAULT)
            }
            manager.createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setSound(soundUri)
            .setAutoCancel(true)
            .build()

        manager.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun showSilentNotification(context: Context, title: String, message: String) {
        val channelId = "timer_notifications_silent"
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, context.getString(R.string.channel_timer_silent), NotificationManager.IMPORTANCE_LOW).apply {
                setSound(null, null)
            }
            manager.createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setAutoCancel(true)
            .build()

        manager.notify(System.currentTimeMillis().toInt(), notification)
    }

    internal fun showIntervalNotification(context: Context) {
        AppLogger.log(context, "AlarmReceiver: showIntervalNotification called")
        val channelId = "interval_notification_channel"
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                context.getString(R.string.floating_window_service_name),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = context.getString(R.string.notification_interval_body)
                enableLights(true)
                enableVibration(true)
            }
            manager.createNotificationChannel(channel)
        }

        // 通知タップで MainActivity を起動し、フローティングウィンドウを表示させるフラグを渡す
        val intent = Intent(context, MainActivity::class.java).apply {
            action = "ACTION_SHOW_FLOATING"
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("EXTRA_SHOW_FLOATING", true)
        }
        val pendingIntent = android.app.PendingIntent.getActivity(
            context,
            1001,
            intent,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(context.getString(R.string.notification_interval_title))
            .setContentText(context.getString(R.string.notification_interval_body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setDefaults(Notification.DEFAULT_ALL)
            .build()

        try {
            manager.notify(1001, notification)
            AppLogger.log(context, "AlarmReceiver: manager.notify successful (ID: 1001)")
        } catch (e: Exception) {
            AppLogger.log(context, "AlarmReceiver: manager.notify failed: ${e.message}")
        }
    }
}

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

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Log.d("AlarmReceiver", "Alarm received! Action: ${intent.action}")

        if (intent.action == Intent.ACTION_BOOT_COMPLETED || intent.action == "android.intent.action.QUICKBOOT_POWERON") {
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
                    action = "ACTION_SHOW"
                }
                context.startForegroundService(serviceIntent)
            }
        } else if (intent.action == "ACTION_TIMER_EXPIRED") {
            val taskText = intent.getStringExtra("EXTRA_TASK_TEXT") ?: context.getString(R.string.timer_expired)
            val melody = intent.getStringExtra("EXTRA_MELODY") ?: "default"
            showNotification(context, context.getString(R.string.timer_expired), taskText, melody)
            
            if (Settings.canDrawOverlays(context)) {
                val serviceIntent = Intent(context, FloatingWindowService::class.java).apply {
                    action = "ACTION_SHOW"
                }
                context.startForegroundService(serviceIntent)
            }
        } else if (intent.action == "ACTION_NOON_CHECK" || intent.action == "ACTION_INTERVAL_CHECK") {
            // 正午またはインターバルチェック: 未完了タスクがある場合のみ表示
            AppLogger.log(context, "AlarmReceiver: Triggering re-show for action=${intent.action}")
            if (Settings.canDrawOverlays(context)) {
                val serviceIntent = Intent(context, FloatingWindowService::class.java).apply {
                    action = "ACTION_SHOW"
                }
                context.startForegroundService(serviceIntent)
            }
            
            if (intent.action == "ACTION_NOON_CHECK") {
                AlarmScheduler.scheduleNoonAlarm(context)
            } else if (intent.action == "ACTION_INTERVAL_CHECK") {
                val prefs = context.getSharedPreferences("prefs", android.content.Context.MODE_PRIVATE)
                val minutes = prefs.getInt("recheckInterval", 0)
                if (minutes > 0) {
                    AlarmScheduler.scheduleIntervalAlarm(context, minutes)
                }
            }
        } else if (intent.action == "ACTION_MIDNIGHT_RESET") {
            Log.d("AlarmReceiver", "Midnight reset triggered")
            // AM0時の処理: フローティングサービスを開始してリセットを実行
            if (Settings.canDrawOverlays(context)) {
                val serviceIntent = Intent(context, FloatingWindowService::class.java).apply {
                    putExtra("TRIGGER_RESET", true)
                    action = "ACTION_SHOW"
                }
                context.startForegroundService(serviceIntent)
            }
            
            // 次の日の AM0時を再スケジュール
            AlarmScheduler.scheduleMidnightAlarm(context)
        }
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
}

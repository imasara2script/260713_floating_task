package com.example.floatingtask

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.util.Log
import androidx.core.app.NotificationCompat
import android.app.NotificationManager
import android.app.NotificationChannel

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Log.d("AlarmReceiver", "Alarm received! Action: ${intent.action}")

        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            // 端末起動時にアラームを再設定
            AlarmScheduler.scheduleMidnightAlarm(context)
            AlarmScheduler.scheduleNoonAlarm(context)
            
            // 保存されているインターバルアラームを復元
            val prefs = context.getSharedPreferences("prefs", Context.MODE_PRIVATE)
            val minutes = prefs.getInt("recheckInterval", 0)
            if (minutes > 0) {
                AlarmScheduler.scheduleIntervalAlarm(context, minutes)
            }
        } else if (intent.action == "ACTION_TIMER_EXPIRED") {
            val taskText = intent.getStringExtra("EXTRA_TASK_TEXT") ?: "タイマー終了"
            showNotification(context, "タイマー終了", taskText)
            
            if (Settings.canDrawOverlays(context)) {
                val serviceIntent = Intent(context, FloatingWindowService::class.java).apply {
                    action = "ACTION_SHOW"
                }
                context.startForegroundService(serviceIntent)
            }
        } else if (intent.action == "ACTION_NOON_CHECK" || intent.action == "ACTION_INTERVAL_CHECK") {
            // 正午またはインターバルチェック: 未完了タスクがある場合のみ表示
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
        } else {
            // AM0時の処理: フローティングサービスを開始
            // オーバーレイ権限がある場合のみ開始可能
            if (Settings.canDrawOverlays(context)) {
                val serviceIntent = Intent(context, FloatingWindowService::class.java).apply {
                    putExtra("TRIGGER_RESET", true)
                    action = "ACTION_SHOW"
                }
                context.startForegroundService(serviceIntent)
            }
            
            // 次の日の AM0時を再設定
            AlarmScheduler.scheduleMidnightAlarm(context)
        }
    }

    private fun showNotification(context: Context, title: String, message: String) {
        val channelId = "timer_notifications"
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "Timer Notifications", NotificationManager.IMPORTANCE_HIGH)
            manager.createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        manager.notify(System.currentTimeMillis().toInt(), notification)
    }
}

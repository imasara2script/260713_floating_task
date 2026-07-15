package com.example.floatingtask

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.util.Log

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
}

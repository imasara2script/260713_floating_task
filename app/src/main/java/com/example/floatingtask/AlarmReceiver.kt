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
        } else {
            // AM0時の処理: フローティングサービスを開始
            // オーバーレイ権限がある場合のみ開始可能
            if (Settings.canDrawOverlays(context)) {
                val serviceIntent = Intent(context, FloatingWindowService::class.java)
                context.startForegroundService(serviceIntent)
            }
            
            // 次の日のAM0時を再設定
            AlarmScheduler.scheduleMidnightAlarm(context)
        }
    }
}

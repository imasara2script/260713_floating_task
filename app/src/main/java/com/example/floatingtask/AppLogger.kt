package com.example.floatingtask

import android.app.ActivityManager
import android.app.AlarmManager
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object AppLogger {
    private const val LOG_FILE_NAME = "app_log.txt"
    private const val PREFS_NAME = "prefs"
    private const val KEY_LOGGING_ENABLED = "isLoggingEnabled"

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.getDefault())

    private var isSystemStatusLogged = false

    fun isEnabled(context: Context): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getBoolean(KEY_LOGGING_ENABLED, false)
    }

    fun setEnabled(context: Context, enabled: Boolean) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putBoolean(KEY_LOGGING_ENABLED, enabled).apply()
        if (enabled) {
            isSystemStatusLogged = false // 有効化した際に再度出力されるようにリセット
            log(context, "Logging enabled")
        }
    }

    fun log(context: Context, message: String) {
        android.util.Log.d("AppLogger", message)
        if (!isEnabled(context)) return

        if (!isSystemStatusLogged) {
            isSystemStatusLogged = true
            logSystemStatus(context)
        }

        writeToLogFile(context, message)
    }

    fun clearLog(context: Context) {
        try {
            val file = File(context.filesDir, LOG_FILE_NAME)
            if (file.exists()) {
                file.delete()
            }
            log(context, "Log cleared")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun logSystemStatus(context: Context) {
        val osVersion = Build.VERSION.RELEASE
        val apiLevel = Build.VERSION.SDK_INT
        val model = Build.MODEL
        val canDrawOverlays = Settings.canDrawOverlays(context)
        
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val notificationsEnabled = notificationManager.areNotificationsEnabled()
        
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val batteryOptExempt = powerManager.isIgnoringBatteryOptimizations(context.packageName)
        
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val canScheduleExactAlarms = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            alarmManager.canScheduleExactAlarms()
        } else {
            true
        }

        val status = """
            [SYSTEM STATUS]
            OS Version: $osVersion (API $apiLevel)
            Device: $model
            Overlay Permission: $canDrawOverlays
            Notifications Enabled: $notificationsEnabled
            Battery Optimization Exempt: $batteryOptExempt
            Exact Alarm Permission: $canScheduleExactAlarms
            ----------------------------------------
        """.trimIndent()

        // log() を再帰的に呼び出すのではなく、直接ファイルに書き込む
        writeToLogFile(context, status)
        
        // 初回のメモリ情報も出力
        logMemoryStatus(context, "InitialStatus", "System")
    }

    fun logMemoryStatus(context: Context, tag: String, activeComponents: String) {
        try {
            val runtime = Runtime.getRuntime()
            val usedHeap = (runtime.totalMemory() - runtime.freeMemory()) / 1024 / 1024
            val maxHeap = runtime.maxMemory() / 1024 / 1024

            val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            val memoryInfo = ActivityManager.MemoryInfo()
            activityManager.getMemoryInfo(memoryInfo)

            val cacheSize = (getFolderSize(context.cacheDir) + getFolderSize(context.externalCacheDir)) / 1024.0 / 1024.0

            val status = """
                [MEMORY STATUS]
                Tag: $tag ($activeComponents)
                Java Heap: $usedHeap / $maxHeap MB (Used / Max)
                System Available: ${memoryInfo.availMem / 1024 / 1024} MB (Threshold: ${memoryInfo.threshold / 1024 / 1024} MB)
                Low Memory: ${memoryInfo.lowMemory}
                Total Cache: ${String.format(Locale.US, "%.2f", cacheSize)} MB
                ----------------------------------------
            """.trimIndent()
            
            writeToLogFile(context, status)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun getFolderSize(file: File?): Long {
        if (file == null || !file.exists()) return 0
        if (!file.isDirectory) return file.length()
        
        var size: Long = 0
        file.listFiles()?.forEach {
            size += getFolderSize(it)
        }
        return size
    }

    private fun writeToLogFile(context: Context, message: String) {
        try {
            val timestamp = dateFormat.format(Date())
            val logLine = "[$timestamp] $message\n"
            val file = File(context.filesDir, LOG_FILE_NAME)
            file.appendText(logLine)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getLogFile(context: Context): File {
        return File(context.filesDir, LOG_FILE_NAME)
    }

    fun getLogSizeKb(context: Context): Double {
        val file = File(context.filesDir, LOG_FILE_NAME)
        return if (file.exists()) {
            file.length() / 1024.0
        } else {
            0.0
        }
    }
}

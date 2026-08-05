package com.example.floatingtask

import android.content.Context
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object AppLogger {
    private const val LOG_FILE_NAME = "app_log.txt"
    private const val PREFS_NAME = "prefs"
    private const val KEY_LOGGING_ENABLED = "isLoggingEnabled"

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.getDefault())

    fun isEnabled(context: Context): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getBoolean(KEY_LOGGING_ENABLED, false)
    }

    fun setEnabled(context: Context, enabled: Boolean) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putBoolean(KEY_LOGGING_ENABLED, enabled).apply()
        if (enabled) {
            log(context, "Logging enabled")
        }
    }

    fun log(context: Context, message: String) {
        if (!isEnabled(context)) return

        try {
            val timestamp = dateFormat.format(Date())
            val logLine = "[$timestamp] $message\n"
            val file = File(context.filesDir, LOG_FILE_NAME)
            file.appendText(logLine)
        } catch (e: Exception) {
            e.printStackTrace()
        }
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

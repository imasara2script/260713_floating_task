package com.example.floatingtask

import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import androidx.core.content.FileProvider

class WebLogHandler(private val context: Context) {

    fun isLoggingEnabled(): Boolean = AppLogger.isEnabled(context)

    fun setLoggingEnabled(enabled: Boolean) = AppLogger.setEnabled(context, enabled)

    fun getLogContent(): String {
        val logFile = AppLogger.getLogFile(context)
        return if (logFile.exists()) {
            try {
                logFile.readText()
            } catch (e: Exception) {
                "Error reading log: ${e.message}"
            }
        } else {
            "Log file does not exist."
        }
    }

    fun shareLog() {
        // 共有直前に最新のシステム状態を記録
        AppLogger.logSystemStatus(context)
        
        val logFile = AppLogger.getLogFile(context)
        if (!logFile.exists()) return

        Handler(Looper.getMainLooper()).post {
            try {
                val contentUri = FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.fileprovider",
                    logFile
                )

                val intent = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_STREAM, contentUri)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }
                
                val chooser = Intent.createChooser(intent, "Share Log")
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(chooser)
            } catch (e: Exception) {
                AppLogger.log(context, "Error sharing log: ${e.message}")
            }
        }
    }

    fun clearLog() = AppLogger.clearLog(context)

    fun getLogSize(): Double = AppLogger.getLogSizeKb(context)

    fun logComment(comment: String) = AppLogger.log(context, "[USER COMMENT] $comment")

    fun logToAppLog(message: String) = AppLogger.log(context, "[JS LOG] $message")

    fun logSystemStatus() = AppLogger.logSystemStatus(context)
}

package com.example.floatingtask

import android.content.Context
import android.util.Log
import java.io.PrintWriter
import java.io.StringWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object CrashHandler : Thread.UncaughtExceptionHandler {
    private var defaultHandler: Thread.UncaughtExceptionHandler? = null
    private var appContext: Context? = null
    private const val PREFS_NAME = "native_error_prefs"
    private const val KEY_LAST_ERROR = "last_native_error"

    fun init(context: Context) {
        appContext = context.applicationContext
        if (defaultHandler == null) {
            defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
            Thread.setDefaultUncaughtExceptionHandler(this)
        }
    }

    override fun uncaughtException(thread: Thread, throwable: Throwable) {
        val sw = StringWriter()
        val pw = PrintWriter(sw)
        throwable.printStackTrace(pw)
        val stackTrace = sw.toString()

        val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.getDefault())
        val timestamp = sdf.format(Date())

        val errorDetails = """
            [NATIVE EXCEPTION]
            Time: $timestamp
            Thread: ${thread.name}
            Message: ${throwable.message ?: "No message"}
            Stack Trace:
            $stackTrace
        """.trimIndent()

        appContext?.let { ctx ->
            saveNativeError(ctx, errorDetails)
            AppLogger.log(ctx, errorDetails)
        }

        Log.e("CrashHandler", "Uncaught exception caught:\n$errorDetails")

        // 元のハンドラーに引き渡してアプリを適切にクラッシュ/終了させる
        defaultHandler?.uncaughtException(thread, throwable)
    }

    fun saveNativeError(context: Context, errorMsg: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_LAST_ERROR, errorMsg).apply()
    }

    fun getLastNativeError(context: Context): String? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_LAST_ERROR, null)
    }

    fun clearLastNativeError(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().remove(KEY_LAST_ERROR).apply()
    }
}

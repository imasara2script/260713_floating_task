package com.example.floatingtask

import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.io.File
import org.json.JSONArray

class WebMediaHandler(
    private val context: Context,
    private val listener: MediaActionListener
) {

    interface MediaActionListener {
        fun onPickRingtone(intent: Intent)
        fun onBackupData(fileName: String, jsonData: String)
        fun onRestoreData()
    }

    private val prefs = context.getSharedPreferences("auto_backup_prefs", Context.MODE_PRIVATE)

    fun saveAutoBackup(jsonData: String) {
        try {
            val timestamp = System.currentTimeMillis()
            val fileName = "auto_backup_$timestamp.json"
            context.openFileOutput(fileName, Context.MODE_PRIVATE).use {
                it.write(jsonData.toByteArray())
            }
            prefs.edit().putLong("last_backup_time", timestamp).apply()
            AppLogger.log(context, "Auto backup saved: $fileName")
            
            cleanOldBackups()
        } catch (e: Exception) {
            AppLogger.log(context, "Failed to save auto backup: ${e.message}")
        }
    }

    private fun cleanOldBackups() {
        val maxCount = getAutoBackupCount()
        val files = context.fileList()
            .filter { it.startsWith("auto_backup_") && it.endsWith(".json") }
            .sortedDescending()
        
        if (files.size > maxCount) {
            for (i in maxCount until files.size) {
                context.deleteFile(files[i])
                AppLogger.log(context, "Deleted old auto backup: ${files[i]}")
            }
        }
    }

    fun getAutoBackupList(): String {
        val files = context.fileList()
            .filter { it.startsWith("auto_backup_") && it.endsWith(".json") }
            .map { it.removePrefix("auto_backup_").removeSuffix(".json") }
            .sortedDescending()
        return JSONArray(files).toString()
    }

    fun loadAutoBackup(timestamp: String? = null): String? {
        return try {
            val fileName = if (timestamp != null) {
                "auto_backup_$timestamp.json"
            } else {
                val files = context.fileList()
                    .filter { it.startsWith("auto_backup_") && it.endsWith(".json") }
                    .sortedDescending()
                if (files.isEmpty()) return null
                files[0]
            }
            context.openFileInput(fileName).use {
                it.bufferedReader().readText()
            }
        } catch (e: Exception) {
            null
        }
    }

    fun getLastAutoBackupTime(): Long {
        return prefs.getLong("last_backup_time", 0)
    }

    fun isAutoBackupEnabled(): Boolean {
        return prefs.getBoolean("enabled", true)
    }

    fun setAutoBackupEnabled(enabled: Boolean) {
        prefs.edit().putBoolean("enabled", enabled).apply()
    }

    fun getAutoBackupCount(): Int {
        return prefs.getInt("max_backup_count", 1)
    }

    fun setAutoBackupCount(count: Int) {
        val safeCount = count.coerceIn(1, 5)
        prefs.edit().putInt("max_backup_count", safeCount).apply()
        cleanOldBackups() // 保持数が減った場合に即座に削除を実行
    }

    fun pickRingtone() {
        val intent = Intent(RingtoneManager.ACTION_RINGTONE_PICKER).apply {
            putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_ALL)
            putExtra(RingtoneManager.EXTRA_RINGTONE_TITLE, context.getString(R.string.pick_melody))
            putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true)
            putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, true)
        }
        listener.onPickRingtone(intent)
    }

    fun backupData(jsonData: String) {
        val sdf = SimpleDateFormat("yyyyMMdd HHmmss", Locale.getDefault())
        val timestamp = sdf.format(Date())
        val fileName = "floating task $timestamp.json"
        listener.onBackupData(fileName, jsonData)
    }

    fun restoreData() {
        listener.onRestoreData()
    }

    fun playMelody(melody: String, looping: Boolean = false) {
        MelodyPlayer.play(context, melody, looping)
    }

    fun stopMelody() {
        MelodyPlayer.stop()
    }
}

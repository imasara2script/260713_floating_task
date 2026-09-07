package com.example.floatingtask

import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class WebMediaHandler(
    private val context: Context,
    private val listener: MediaActionListener
) {

    interface MediaActionListener {
        fun onPickRingtone(intent: Intent)
        fun onBackupData(fileName: String, jsonData: String)
        fun onRestoreData()
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

    fun playMelody(melody: String) {
        MelodyPlayer.play(context, melody)
    }

    fun stopMelody() {
        MelodyPlayer.stop()
    }
}

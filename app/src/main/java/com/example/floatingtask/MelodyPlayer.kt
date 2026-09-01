package com.example.floatingtask

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.util.Log

object MelodyPlayer {
    private var mediaPlayer: MediaPlayer? = null

    fun play(context: Context, melody: String) {
        stop() // 既に再生中の場合は停止

        try {
            val soundUri: Uri = when {
                melody == "alarm" -> RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                melody == "chime" -> RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
                melody.startsWith("content://") -> Uri.parse(melody)
                else -> RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            }

            mediaPlayer = MediaPlayer().apply {
                setDataSource(context, soundUri)
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                isLooping = false
                prepare()
                start()
                setOnCompletionListener {
                    stop()
                }
            }
        } catch (e: Exception) {
            Log.e("MelodyPlayer", "Error playing melody: ${e.message}")
        }
    }

    fun stop() {
        try {
            mediaPlayer?.let {
                if (it.isPlaying) {
                    it.stop()
                }
                it.release()
            }
        } catch (e: Exception) {
            Log.e("MelodyPlayer", "Error stopping melody: ${e.message}")
        } finally {
            mediaPlayer = null
        }
    }
}

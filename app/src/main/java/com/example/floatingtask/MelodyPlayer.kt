package com.example.floatingtask

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.util.Log

import android.os.PowerManager

object MelodyPlayer {
    private var mediaPlayer: MediaPlayer? = null

    fun play(context: Context, melody: String, looping: Boolean = false) {
        Log.d("MelodyPlayer", "play: $melody, looping: $looping")
        stop() // 既に再生中の場合は停止

        try {
            val soundUri: Uri = when {
                melody == "alarm" -> RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                melody == "chime" -> RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
                melody.startsWith("content://") -> Uri.parse(melody)
                else -> RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            }

            mediaPlayer = MediaPlayer().apply {
                setWakeMode(context, PowerManager.PARTIAL_WAKE_LOCK)
                setDataSource(context, soundUri)
                
                // ループ設定時はアラーム、単発時は通知の属性を使用する
                // 一部の端末で USAGE_ALARM を指定すると強制的にループされるのを防ぐため
                val usage = if (looping) AudioAttributes.USAGE_ALARM else AudioAttributes.USAGE_NOTIFICATION
                
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(usage)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                isLooping = looping
                
                // 再生開始前にリスナーを登録
                setOnCompletionListener {
                    stop()
                }
                
                prepare()
                start()
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

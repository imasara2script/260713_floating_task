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
    var currentTaskId: Long = -1L
    var currentTaskText: String = ""
    var currentMelody: String = "default"
    var currentMelodyMode: String = "once"
    var currentAudioAttribute: String = "alarm"
    var maxMelodyDurationSec: Int = 5

    fun setMaxMelodyDuration(seconds: Int) {
        maxMelodyDurationSec = if (seconds < 0) 0 else seconds
    }

    fun play(context: Context, melody: String, looping: Boolean = false, taskId: Long = -1L, taskText: String = "", audioAttribute: String = "alarm") {
        Log.d("MelodyPlayer", "play: $melody, looping: $looping, taskId: $taskId, audioAttr: $audioAttribute")
        stop() // 既に再生中の場合は停止

        currentTaskId = taskId
        currentTaskText = taskText
        currentMelody = melody
        currentMelodyMode = if (looping) "loop" else "once"
        currentAudioAttribute = audioAttribute

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
                
                val usage = when (audioAttribute) {
                    "notification" -> AudioAttributes.USAGE_NOTIFICATION
                    "media" -> AudioAttributes.USAGE_MEDIA
                    else -> AudioAttributes.USAGE_ALARM
                }
                
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

                if (!looping) {
                    val dur = try { duration } catch (e: Exception) { 0 }
                    val timeoutMs = when {
                        maxMelodyDurationSec > 0 -> maxMelodyDurationSec * 1000L
                        dur > 0 -> dur.toLong()
                        else -> 0L
                    }

                    if (timeoutMs > 0) {
                        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                            if (mediaPlayer == this) {
                                stop()
                            }
                        }, timeoutMs)
                    }
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
            currentTaskId = -1L
            currentTaskText = ""
        }
    }

    fun isPlaying(): Boolean = mediaPlayer?.isPlaying == true

    fun isLooping(): Boolean = mediaPlayer?.isLooping == true

    fun getCurrentPosition(): Int = try { mediaPlayer?.currentPosition ?: 0 } catch (e: Exception) { 0 }

    fun getDuration(): Int = try { mediaPlayer?.duration ?: 0 } catch (e: Exception) { 0 }
}

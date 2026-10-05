package com.example.floatingtask

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * =====================================================================================
 * CRITICAL ARCHITECTURE COMPONENT: PendingHistoryManager
 * =====================================================================================
 * This manager handles queuing and flushing background alarm history items (e.g., timer expired,
 * reminders, snooze, stop) triggered inside AlarmReceiver.
 *
 * IMPORTANT RULES FOR FUTURE AI AGENTS / DEVELOPERS:
 * 1. DO NOT REPLACE commit() with apply():
 *    AlarmReceiver is a BroadcastReceiver. When onReceive() finishes, the process or execution
 *    context may terminate immediately. Using apply() is asynchronous and will cause disk writes
 *    to be dropped on physical devices. commit() guarantees synchronous disk persistence.
 * 2. BRIDGE PARITY:
 *    Both MainActivity (via WebTaskActionHandler) and FloatingWindowService (via FloatingWebAppInterface)
 *    MUST provide getPendingHistoryItems() so that whichever UI container loads first can flush
 *    and sync the pending history into the user's completion history.
 * =====================================================================================
 */
object PendingHistoryManager {
    private const val PREFS_NAME = "pending_history_prefs"
    private const val KEY_HISTORY_LIST = "history_list"

    fun addPendingHistory(context: Context, taskId: Long, text: String, eventName: String, type: String) {
        try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val listStr = prefs.getString(KEY_HISTORY_LIST, "[]") ?: "[]"
            val jsonArray = JSONArray(listStr)

            val item = JSONObject().apply {
                put("id", System.currentTimeMillis() + Math.random())
                put("taskId", taskId)
                put("text", text)
                put("eventName", eventName)
                put("type", type)
                put("memo", "")
                put("completedAt", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date()))
            }
            jsonArray.put(item)
            
            // CRITICAL: Must use commit() instead of apply() to guarantee disk write before BroadcastReceiver dies.
            val success = prefs.edit().putString(KEY_HISTORY_LIST, jsonArray.toString()).commit()
            AppLogger.log(context, "PendingHistoryManager: addPendingHistory result=$success (event=$eventName, task=$text)")
        } catch (e: Exception) {
            AppLogger.log(context, "PendingHistoryManager: Error adding pending history: ${e.message}")
        }
    }

    fun getPendingHistoryItems(context: Context): String {
        try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val listStr = prefs.getString(KEY_HISTORY_LIST, "[]") ?: "[]"
            prefs.edit().putString(KEY_HISTORY_LIST, "[]").commit()
            return listStr
        } catch (e: Exception) {
            AppLogger.log(context, "PendingHistoryManager: Error getting pending history items: ${e.message}")
        }
        return "[]"
    }
}

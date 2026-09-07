package com.example.floatingtask

import android.content.Context
import android.content.Intent
import android.content.res.Resources
import androidx.core.content.edit
import org.json.JSONObject
import java.security.MessageDigest

class WebSettingsHandler(
    private val context: Context,
    private val adCoinHandler: WebAdCoinHandler,
    private val listener: SettingsActionListener
) {

    interface SettingsActionListener {
        fun onPremiumUnlocked()
    }

    fun updateFloatingSettingsExtended(
        cX: Int, cY: Int, cScale: Float, showEmpty: Boolean, moveC: Boolean,
        eX: Int, eY: Int, eScale: Float, moveE: Boolean,
        width: Int, height: Int, showClose: Boolean,
        displayTaskCount: Int, scrollTaskCount: Int,
        showCheckedToggle: Boolean, scrollButtonType: String,
        allowDrag: Boolean, allowDragCollapsed: Boolean,
        showHistoryButton: Boolean, navType: String, keepService: Boolean,
        menuActionDelay: Int
    ) {
        val prefs = context.getSharedPreferences("prefs", Context.MODE_PRIVATE)
        prefs.edit {
            putInt("floatCollapsedX", cX)
            putInt("floatCollapsedY", cY)
            putFloat("floatCollapsedScale", cScale)
            putBoolean("showWhenEmpty", showEmpty)
            putBoolean("alwaysMoveCollapsed", moveC)
            putBoolean("allowDragCollapsed", allowDragCollapsed)

            putInt("floatExpandedX", eX)
            putInt("floatExpandedY", eY)
            putFloat("floatExpandedScale", eScale)
            putBoolean("alwaysMoveExpanded", moveE)

            putInt("floatWidth", width)
            putInt("floatHeight", height)
            putBoolean("showCloseButtonExpanded", showClose)
            putBoolean("keepServiceOnClose", keepService)
            putBoolean("showCheckedToggle", showCheckedToggle)
            putBoolean("showHistoryButton", showHistoryButton)
            putString("navType", navType)
            putInt("menuActionDelay", menuActionDelay)
            putBoolean("allowDrag", allowDrag)
            putString("scrollButtonType", scrollButtonType)
            putInt("displayTaskCount", displayTaskCount)
            putInt("scrollTaskCount", scrollTaskCount)

            // 互換性のための古いキーも更新しておく
            putInt("floatX", eX)
            putInt("floatY", eY)
            putFloat("floatScale", eScale)
        }
        // サービスが実行中なら更新を通知
        val intent = Intent(context, FloatingWindowService::class.java)
        intent.action = "ACTION_UPDATE_SETTINGS"
        context.startService(intent)
    }

    fun updateFloatingSettings(x: Int, y: Int, width: Int, height: Int, scale: Float) {
        val prefs = context.getSharedPreferences("prefs", Context.MODE_PRIVATE)
        prefs.edit {
            putInt("floatX", x)
            putInt("floatY", y)
            putInt("floatWidth", width)
            putInt("floatHeight", height)
            putFloat("floatScale", scale)
        }
        // サービスが実行中なら更新を通知
        val intent = Intent(context, FloatingWindowService::class.java)
        intent.action = "ACTION_UPDATE_SETTINGS"
        context.startService(intent)
    }

    fun getDisplayMetrics(): String {
        val dm = Resources.getSystem().displayMetrics
        val json = JSONObject()
        json.put("widthPixels", dm.widthPixels)
        json.put("heightPixels", dm.heightPixels)
        json.put("density", dm.density)
        return json.toString()
    }

    fun submitUnlockCode(code: String): Boolean {
        val salt = BuildConfig.PREMIUM_CODE_SALT
        val expectedHash = BuildConfig.PREMIUM_CODE_HASH

        val inputWithSalt = code + salt
        val hashedInput = sha256(inputWithSalt)

        if (hashedInput == expectedHash) {
            adCoinHandler.setAdFree(true)
            listener.onPremiumUnlocked()
            return true
        }
        return false
    }

    fun setAppLanguage(languageCode: String) {
        val appLocale: androidx.core.os.LocaleListCompat = if (languageCode == "system") {
            androidx.core.os.LocaleListCompat.getEmptyLocaleList()
        } else {
            androidx.core.os.LocaleListCompat.forLanguageTags(languageCode)
        }
        androidx.appcompat.app.AppCompatDelegate.setApplicationLocales(appLocale)
    }

    fun getSystemLanguage(): String {
        return java.util.Locale.getDefault().language
    }

    private fun sha256(input: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
}

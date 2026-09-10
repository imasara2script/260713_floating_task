package com.example.floatingtask

import android.app.Activity
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.webkit.WebView
import androidx.core.content.edit
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class WebAdCoinHandler(private val activity: Activity, private val webView: WebView) {
    private val context: Context = activity.applicationContext
    private var rewardedAd: RewardedAd? = null
    var isAdFree: Boolean = false
        private set
    var isLimitUnlockedByReward: Boolean = false
        private set
    private var lastRewardType: String? = null
    private var pendingShowType: String? = null
    
    private val mainHandler = Handler(Looper.getMainLooper())
    private val autoReloadRunnable = Runnable {
        AppLogger.log(context, "Auto-reloading expired rewarded ad")
        loadRewardedAd()
    }

    init {
        val prefs = context.getSharedPreferences("prefs", Context.MODE_PRIVATE)
        isAdFree = prefs.getBoolean("isAdFree", false)
    }

    fun loadRewardedAd() {
        if (isAdFree) return
        
        // 既存のオートリロード予約をキャンセル
        mainHandler.removeCallbacks(autoReloadRunnable)
        
        val adRequest = AdRequest.Builder().build()
        RewardedAd.load(
            activity,
            BuildConfig.ADMOB_REWARDED_UNIT_ID,
            adRequest,
            object : RewardedAdLoadCallback() {
                override fun onAdFailedToLoad(adError: LoadAdError) {
                    rewardedAd = null
                    pendingShowType?.let { type ->
                        val escapedMsg = adError.message.replace("'", "\\'")
                        webView.post { webView.evaluateJavascript("onAdFailed('$type', ${adError.code}, '$escapedMsg');", null) }
                        pendingShowType = null
                    }
                    
                    // 失敗した場合はリトライされるのでここでは何もしない (system-handler.js 側のリトライロジックに任せる)
                }

                override fun onAdLoaded(ad: RewardedAd) {
                    rewardedAd = ad
                    pendingShowType?.let { type ->
                        showRewardedAdWithType(type)
                        pendingShowType = null
                    }
                    
                    // 「アプリ起動時」設定の場合、30分後に自動リロードを予約
                    if (getAdLoadTiming() == "startup") {
                        mainHandler.postDelayed(autoReloadRunnable, 30 * 60 * 1000)
                    }
                }
            },
        )
    }

    fun showRewardedAdWithType(type: String) {
        activity.runOnUiThread {
            lastRewardType = type
            if (rewardedAd != null) {
                val ad = rewardedAd
                rewardedAd = null // 早期にnullをセットして再ロード可能にする
                mainHandler.removeCallbacks(autoReloadRunnable) // 再生開始したらリロード予約を解除
                
                ad?.fullScreenContentCallback = object : FullScreenContentCallback() {
                    override fun onAdDismissedFullScreenContent() {
                        AppLogger.log(context, "Rewarded ad dismissed: type=$lastRewardType")
                        // 設定が「startup」なら、即座に次の広告をロード
                        if (getAdLoadTiming() == "startup") {
                            loadRewardedAd()
                        }
                    }

                    override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                        AppLogger.log(context, "Rewarded ad failed to show: ${adError.message}")
                        val escapedMsg = adError.message.replace("'", "\\'")
                        webView.evaluateJavascript("onAdFailed('$lastRewardType', ${adError.code}, '$escapedMsg');", null)
                        if (getAdLoadTiming() == "startup") {
                            loadRewardedAd()
                        }
                    }
                }
                
                ad?.show(activity) { _ ->
                    AppLogger.log(context, "Rewarded ad reward earned: type=$lastRewardType")
                    if (lastRewardType == "limit") {
                        isLimitUnlockedByReward = true
                        webView.evaluateJavascript("onRewardEarned('limit');", null)
                    } else if (lastRewardType == "coin") {
                        val remaining = earnCoin()
                        webView.evaluateJavascript("onRewardEarned('coin', $remaining);", null)
                    }
                }
            } else {
                // 広告がロードされていない場合
                AppLogger.log(context, "Rewarded ad NOT loaded: type=$type. Setting pendingShowType.")
                pendingShowType = type
                webView.evaluateJavascript("onAdLoading('$type');", null)
                loadRewardedAd()
            }
        }
    }

    fun getAdLoadTiming(): String {
        val prefs = context.getSharedPreferences("prefs", Context.MODE_PRIVATE)
        return prefs.getString("adLoadTiming", "startup") ?: "startup"
    }

    fun setAdLoadTiming(timing: String) {
        val prefs = context.getSharedPreferences("prefs", Context.MODE_PRIVATE)
        prefs.edit { putString("adLoadTiming", timing) }
        
        if (timing == "startup") {
            if (rewardedAd == null) loadRewardedAd()
        } else {
            // 予約キャンセル
            mainHandler.removeCallbacks(autoReloadRunnable)
        }
    }

    fun getCoins(): Int {
        val prefs = context.getSharedPreferences("prefs", Context.MODE_PRIVATE)
        return prefs.getInt("coins", 0)
    }

    fun canEarnCoinToday(): Boolean {
        val prefs = context.getSharedPreferences("prefs", Context.MODE_PRIVATE)
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        val lastAdDate = prefs.getString("lastAdDate", "")
        val dailyCount = if (lastAdDate == today) prefs.getInt("dailyAdCount", 0) else 0
        return dailyCount < 10
    }

    fun earnCoin(): Int {
        val prefs = context.getSharedPreferences("prefs", Context.MODE_PRIVATE)
        val coins = prefs.getInt("coins", 0)
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        val lastAdDate = prefs.getString("lastAdDate", "")
        var dailyCount = if (lastAdDate == today) prefs.getInt("dailyAdCount", 0) else 0

        dailyCount++
        prefs.edit {
            putInt("coins", coins + 1)
            putString("lastAdDate", today)
            putInt("dailyAdCount", dailyCount)
        }
        return 10 - dailyCount
    }

    fun consumeCoin(): Boolean {
        val prefs = context.getSharedPreferences("prefs", Context.MODE_PRIVATE)
        val coins = prefs.getInt("coins", 0)
        if (coins > 0) {
            prefs.edit { putInt("coins", coins - 1) }
            return true
        }
        return false
    }

    fun checkDailyCoinBonus(): Boolean {
        val prefs = context.getSharedPreferences("prefs", Context.MODE_PRIVATE)
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        val lastBonusDate = prefs.getString("lastBonusDate", "")

        if (lastBonusDate != today) {
            val coins = prefs.getInt("coins", 0)
            prefs.edit {
                putInt("coins", coins + 1)
                putString("lastBonusDate", today)
            }
            return true
        }
        return false
    }

    fun isRewardedAdReady(): Boolean = rewardedAd != null

    fun isAdFreeEffective(): Boolean = isAdFree || isLimitUnlockedByReward

    fun setAdFree(enabled: Boolean) {
        isAdFree = enabled
        val prefs = context.getSharedPreferences("prefs", Context.MODE_PRIVATE)
        prefs.edit { putBoolean("isAdFree", enabled) }
    }
}

package com.example.floatingtask

import android.annotation.SuppressLint
import android.app.AlarmManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.res.Resources
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.OpenableColumns
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.view.View
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.edit
import androidx.core.net.toUri
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import org.json.JSONArray
import org.json.JSONObject
import android.util.Log
import android.app.NotificationChannel
import android.app.NotificationManager
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.widget.EditText
import java.util.Locale
import androidx.core.app.NotificationCompat
import java.security.MessageDigest
import androidx.activity.OnBackPressedCallback

class MainActivity : AppCompatActivity() {

    private var pendingTaskCount = 0
    private var isPageLoaded = false
    private var rewardedAd: RewardedAd? = null
    private var isAdFree = false
    private var isLimitUnlockedByReward = false
    private var lastRewardType: String? = null
    private var overlayPermissionDialog: AlertDialog? = null

    private fun loadRewardedAd() {
        if (isAdFree) return
        val adRequest = AdRequest.Builder().build()
        RewardedAd.load(
            this,
            BuildConfig.ADMOB_REWARDED_UNIT_ID,
            adRequest,
            object : RewardedAdLoadCallback() {
                override fun onAdFailedToLoad(adError: LoadAdError) {
                    rewardedAd = null
                }

                override fun onAdLoaded(ad: RewardedAd) {
                    rewardedAd = ad
                }
            },
        )
    }

    private val dataChangeReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val webView: WebView = findViewById(R.id.webView)
            if (!isPageLoaded) return
            
            when (intent?.action) {
                "com.example.floatingtask.DATA_CHANGED" -> {
                    webView.evaluateJavascript("refreshData();", null)
                }
                "com.example.floatingtask.POSITION_CHANGED" -> {
                    val x = intent.getIntExtra("x", 0)
                    val y = intent.getIntExtra("y", 0)
                    val isExpanded = intent.getBooleanExtra("isExpanded", false)
                    webView.evaluateJavascript("onFloatingPositionChanged($x, $y, $isExpanded);", null)
                }
            }
        }
    }

    private val overlayPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult(),
    ) {
        if (Settings.canDrawOverlays(this)) {
            overlayPermissionDialog?.dismiss()
            overlayPermissionDialog = null
            startFloatingService(isSettingsMode = false)
        }
        // 重ねて表示の設定から戻った後、通知権限のチェックを行う
        checkNotificationPermission()
    }

    private var dataToBackup: String? = null

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { _ -> }

    private val createDocumentLauncher = registerForActivityResult(
        ActivityResultContracts.CreateDocument("application/json"),
    ) { uri ->
        uri?.let {
            contentResolver.openOutputStream(it)?.use { outputStream ->
                dataToBackup?.let { data ->
                    outputStream.write(data.toByteArray())
                }
            }
            dataToBackup = null
        }
    }

    private val openDocumentLauncher = registerForActivityResult(
        ActivityResultContracts.OpenDocument(),
    ) { uri ->
        uri?.let {
            val fileName = getFileName(it) ?: "Unknown"
            contentResolver.openInputStream(it)?.use { inputStream ->
                val reader = inputStream.bufferedReader()
                val content = reader.readText()
                val webView: WebView = findViewById(R.id.webView)
                // バッククォートやエスケープ文字を処理
                val escapedContent = content.replace("\\", "\\\\")
                    .replace("`", "\\`")
                    .replace("$", "\\$")
                val escapedFileName = fileName.replace("`", "\\`").replace("$", "\\$")
                webView.evaluateJavascript("applyRestoredData(`$escapedContent`, `$escapedFileName`);", null)
            }
        }
    }

    private fun getFileName(uri: Uri): String? {
        var result: String? = null
        if (uri.scheme == "content") {
            contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val columnIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    if (columnIndex != -1) {
                        result = cursor.getString(columnIndex)
                    }
                }
            }
        }
        if (result == null) {
            result = uri.path
            val cut = result?.lastIndexOf('/') ?: -1
            if (cut != -1) {
                result = result?.substring(cut + 1)
            }
        }
        return result
    }

    private val ringtonePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult(),
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            val uri: Uri? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                result.data?.getParcelableExtra(android.media.RingtoneManager.EXTRA_RINGTONE_PICKED_URI, Uri::class.java)
            } else {
                @Suppress("DEPRECATION")
                result.data?.getParcelableExtra(android.media.RingtoneManager.EXTRA_RINGTONE_PICKED_URI)
            }
            val webView: WebView = findViewById(R.id.webView)
            if (uri != null) {
                val ringtone = android.media.RingtoneManager.getRingtone(this, uri)
                val title = ringtone.getTitle(this)
                webView.evaluateJavascript("onRingtoneSelected('$uri', '${title.replace("'", "\\'")}');", null)
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        AppLogger.log(this, "MainActivity onCreate")
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)

        // 初回起動時などにオーバーレイ権限をチェック
        if (!Settings.canDrawOverlays(this)) {
            showOverlayPermissionDialog()
        } else {
            // オーバーレイ権限が既にある場合は通知権限をチェック
            checkNotificationPermission()
        }

        val webView: WebView = findViewById(R.id.webView)
        WebView.setWebContentsDebuggingEnabled(true)
        
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = true
        webView.settings.allowContentAccess = true

        @Suppress("DEPRECATION")
        webView.settings.allowFileAccessFromFileURLs = true
        @Suppress("DEPRECATION")
        webView.settings.allowUniversalAccessFromFileURLs = true

        webView.settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        webView.addJavascriptInterface(WebAppInterface(this), "Android")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                isPageLoaded = true
                webView.evaluateJavascript("checkDailyReset();", null)
            }
        }
        webView.webChromeClient = android.webkit.WebChromeClient()

        webView.loadUrl("file:///android_asset/index.html")

        // AdMobの初期化
        val prefs = getSharedPreferences("prefs", MODE_PRIVATE)
        isAdFree = prefs.getBoolean("isAdFree", false)
        
        MobileAds.initialize(this) {
            AppLogger.log(this, "AdMob initialized")
            loadRewardedAd()
        }
        
        val adView: AdView = findViewById(R.id.adView)
        if (isAdFree) {
            adView.visibility = View.GONE
        } else {
            adView.visibility = View.VISIBLE
            val adRequest = AdRequest.Builder().build()
            adView.loadAd(adRequest)
        }

        // 毎日 AM 0:00 のリセットアラームと正午のチェックアラームをスケジュール
        AlarmScheduler.scheduleMidnightAlarm(this)
        AlarmScheduler.scheduleNoonAlarm(this)

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val webView: WebView = findViewById(R.id.webView)
                webView.evaluateJavascript("handleBack()") { result ->
                    if (result == "false" || result == "null") {
                        // JS側で処理されなかった場合、コールバックを一時的に無効にしてデフォルトの動作を実行
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                        isEnabled = true
                    }
                }
            }
        })

        // ブロードキャストレシーバーの登録
        val filter = IntentFilter().apply {
            addAction("com.example.floatingtask.DATA_CHANGED")
            addAction("com.example.floatingtask.POSITION_CHANGED")
        }
        ContextCompat.registerReceiver(
            this,
            dataChangeReceiver,
            filter,
            ContextCompat.RECEIVER_NOT_EXPORTED,
        )
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(dataChangeReceiver)
    }

    @Suppress("unused")
    inner class WebAppInterface(private val mContext: Context) {
        @JavascriptInterface
        fun isLoggingEnabled(): Boolean {
            return AppLogger.isEnabled(mContext)
        }

        @JavascriptInterface
        fun setLoggingEnabled(enabled: Boolean) {
            AppLogger.setEnabled(mContext, enabled)
        }

        @JavascriptInterface
        fun shareLog() {
            // 共有直前に最新のシステム状態を記録
            AppLogger.logSystemStatus(mContext)
            
            val logFile = AppLogger.getLogFile(mContext)
            if (!logFile.exists()) return

            runOnUiThread {
                try {
                    val contentUri = androidx.core.content.FileProvider.getUriForFile(
                        mContext,
                        "${mContext.packageName}.fileprovider",
                        logFile
                    )

                    val intent = Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_STREAM, contentUri)
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    }
                    mContext.startActivity(Intent.createChooser(intent, "Share Log"))
                } catch (e: Exception) {
                    AppLogger.log(mContext, "Error sharing log: ${e.message}")
                }
            }
        }

        @JavascriptInterface
        fun clearLog() {
            AppLogger.clearLog(mContext)
        }

        @JavascriptInterface
        fun getLogSize(): Double {
            return AppLogger.getLogSizeKb(mContext)
        }

        @JavascriptInterface
        fun logComment(comment: String) {
            AppLogger.log(mContext, "[USER COMMENT] $comment")
        }

        @JavascriptInterface
        fun startFloatingWindow() {
            if (!Settings.canDrawOverlays(mContext)) {
                runOnUiThread {
                    showOverlayPermissionDialog()
                }
            } else {
                startFloatingService(isSettingsMode = true)
            }
        }

        @JavascriptInterface
        fun checkOverlayPermissionGranted(): Boolean {
            return Settings.canDrawOverlays(mContext)
        }

        @JavascriptInterface
        fun requestOverlayPermission() {
            runOnUiThread {
                showOverlayPermissionDialog()
            }
        }

        @JavascriptInterface
        fun stopFloatingWindow() {
            val intent = Intent(mContext, FloatingWindowService::class.java)
            intent.action = "ACTION_HIDE"
            mContext.startService(intent)
        }

        @JavascriptInterface
        fun setReminderAlarms(taskId: Long, taskText: String, jsonReminders: String) {
            val prefs = mContext.getSharedPreferences("task_reminders_prefs", Context.MODE_PRIVATE)
            val oldTimesJson = prefs.getString(taskId.toString(), null)
            if (oldTimesJson != null) {
                try {
                    val oldTimes = JSONArray(oldTimesJson)
                    val timeList = mutableListOf<String>()
                    for (i in 0 until oldTimes.length()) {
                        timeList.add(oldTimes.getString(i))
                    }
                    AlarmScheduler.cancelReminderAlarms(mContext, taskId, timeList)
                } catch (e: Exception) {
                    Log.e("MainActivity", "Error parsing old reminders", e)
                }
            }

            try {
                val reminders = JSONArray(jsonReminders)
                val newTimes = JSONArray()
                for (i in 0 until reminders.length()) {
                    val obj = reminders.getJSONObject(i)
                    val time = obj.getString("time")
                    val message = obj.optString("message", "")
                    AlarmScheduler.scheduleReminderAlarm(mContext, taskId, taskText, time, message)
                    newTimes.put(time)
                }
                prefs.edit().putString(taskId.toString(), newTimes.toString()).apply()
            } catch (e: Exception) {
                Log.e("MainActivity", "Error parsing reminders", e)
            }
        }

        @JavascriptInterface
        fun updateTaskCompletionState(taskId: Long, isCompleted: Boolean) {
            val prefs = mContext.getSharedPreferences("task_completion_prefs", Context.MODE_PRIVATE)
            prefs.edit().putBoolean(taskId.toString(), isCompleted).apply()
        }

        @JavascriptInterface
        fun testReminderNotification(taskText: String, message: String) {
            val channelId = "reminders_channel"
            val manager = mContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    channelId,
                    mContext.getString(R.string.channel_reminders),
                    NotificationManager.IMPORTANCE_HIGH
                )
                manager.createNotificationChannel(channel)
            }

            val body = if (message.isNotEmpty()) {
                mContext.getString(R.string.reminder_body_with_msg, taskText, message)
            } else {
                mContext.getString(R.string.reminder_body_no_msg, taskText)
            }

            val notification = NotificationCompat.Builder(mContext, channelId)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(mContext.getString(R.string.reminder_title))
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .build()

            manager.notify(System.currentTimeMillis().toInt(), notification)
        }

        @JavascriptInterface
        fun onDataChanged() {
            val intent = Intent("com.example.floatingtask.DATA_CHANGED")
            intent.setPackage(mContext.packageName)
            mContext.sendBroadcast(intent)
        }

        @JavascriptInterface
        fun openMainActivity() {
            val intent = Intent(mContext, MainActivity::class.java)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
            mContext.startActivity(intent)
        }

        @JavascriptInterface
        fun toggleExpand(expanded: Boolean) {
            if (Settings.canDrawOverlays(mContext)) {
                val intent = Intent(mContext, FloatingWindowService::class.java)
                intent.action = if (expanded) "ACTION_EXPAND" else "ACTION_COLLAPSE"
                mContext.startService(intent)
            }
        }

        @JavascriptInterface
        fun updatePendingTaskCount(count: Int) {
            pendingTaskCount = count
            // 必要に応じてネイティブ側でバッジ表示などの処理
        }

        @JavascriptInterface
        fun checkBatteryOptimizationExempt(): Boolean {
            val powerManager = mContext.getSystemService(PowerManager::class.java)
            return powerManager.isIgnoringBatteryOptimizations(mContext.packageName)
        }

        @JavascriptInterface
        fun requestBatteryOptimizationExemption() {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
            intent.data = "package:${mContext.packageName}".toUri()
            mContext.startActivity(intent)
        }

        @JavascriptInterface
        fun checkNotificationPermissionGranted(): Boolean {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ContextCompat.checkSelfPermission(
                    mContext,
                    android.Manifest.permission.POST_NOTIFICATIONS
                ) == android.content.pm.PackageManager.PERMISSION_GRANTED
            } else {
                true
            }
        }

        @JavascriptInterface
        fun requestNotificationPermission() {
            runOnUiThread {
                showNotificationPermissionDialog()
            }
        }

        @JavascriptInterface
        fun checkExactAlarmPermission(): Boolean {
            val alarmManager = mContext.getSystemService(AlarmManager::class.java)
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                alarmManager.canScheduleExactAlarms()
            } else {
                true
            }
        }

        @JavascriptInterface
        fun openExactAlarmSettings() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
                intent.data = "package:${mContext.packageName}".toUri()
                mContext.startActivity(intent)
            }
        }

        @JavascriptInterface
        fun showDurationPicker(h: String, m: String, s: String) {
            runOnUiThread {
                val inflater = LayoutInflater.from(this@MainActivity)
                val view = inflater.inflate(R.layout.dialog_duration_picker, null)
                val editH = view.findViewById<EditText>(R.id.editHours)
                val editM = view.findViewById<EditText>(R.id.editMinutes)
                val editS = view.findViewById<EditText>(R.id.editSeconds)

                editH.setText(h)
                editM.setText(m)
                editS.setText(s)

                AlertDialog.Builder(this@MainActivity)
                    .setTitle(R.string.timer_duration_title)
                    .setView(view)
                    .setPositiveButton(R.string.btn_done) { dialog, which ->
                        val resH = editH.text.toString()
                        val resM = editM.text.toString()
                        val resS = editS.text.toString()
                        
                        val webView: WebView = findViewById(R.id.webView)
                        webView.evaluateJavascript("onDurationSelected('$resH', '$resM', '$resS');", null)
                    }
                    .setNegativeButton(R.string.cancel, null)
                    .setOnDismissListener {
                        val webView: WebView = findViewById(R.id.webView)
                        webView.evaluateJavascript("onDurationPickerDismissed();", null)
                    }
                    .show()
            }
        }

        @JavascriptInterface
        fun setIntervalAlarm(minutes: Int) {
            val prefs = mContext.getSharedPreferences("prefs", MODE_PRIVATE)
            prefs.edit { putInt("recheckInterval", minutes) }

            if (minutes > 0) {
                AlarmScheduler.scheduleIntervalAlarm(mContext, minutes)
            } else {
                AlarmScheduler.cancelIntervalAlarm(mContext)
            }
        }

        @JavascriptInterface
        fun setTimerAlarm(taskId: Long, taskText: String, durationMs: Long, melody: String) {
            AlarmScheduler.scheduleTimerAlarm(mContext, taskId, taskText, durationMs, melody)
        }

        @JavascriptInterface
        fun pickRingtone() {
            val intent = Intent(android.media.RingtoneManager.ACTION_RINGTONE_PICKER).apply {
                putExtra(android.media.RingtoneManager.EXTRA_RINGTONE_TYPE, android.media.RingtoneManager.TYPE_ALL)
                putExtra(android.media.RingtoneManager.EXTRA_RINGTONE_TITLE, getString(R.string.pick_melody))
                putExtra(android.media.RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true)
                putExtra(android.media.RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, true)
            }
            ringtonePickerLauncher.launch(intent)
        }

        @JavascriptInterface
        fun updateFloatingSettingsExtended(
            cX: Int, cY: Int, cScale: Float, showEmpty: Boolean, moveC: Boolean,
            eX: Int, eY: Int, eScale: Float, moveE: Boolean,
            width: Int, height: Int, showClose: Boolean,
            displayTaskCount: Int, scrollTaskCount: Int,
            showCheckedToggle: Boolean, scrollButtonType: String,
            allowDrag: Boolean, allowDragCollapsed: Boolean
        ) {
            val prefs = mContext.getSharedPreferences("prefs", MODE_PRIVATE)
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
                putBoolean("showCheckedToggle", showCheckedToggle)
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
            val intent = Intent(mContext, FloatingWindowService::class.java)
            intent.action = "ACTION_UPDATE_SETTINGS"
            mContext.startService(intent)
        }

        @JavascriptInterface
        fun updateFloatingSettings(x: Int, y: Int, width: Int, height: Int, scale: Float) {
            val prefs = mContext.getSharedPreferences("prefs", MODE_PRIVATE)
            prefs.edit {
                putInt("floatX", x)
                putInt("floatY", y)
                putInt("floatWidth", width)
                putInt("floatHeight", height)
                putFloat("floatScale", scale)
            }
            // サービスが実行中なら更新を通知
            val intent = Intent(mContext, FloatingWindowService::class.java)
            intent.action = "ACTION_UPDATE_SETTINGS"
            mContext.startService(intent)
        }

        @JavascriptInterface
        fun getDisplayMetrics(): String {
            // システム全体のメトリクスを使用することで、より確実に物理ピクセルと密度を取得
            val dm = Resources.getSystem().displayMetrics
            val json = org.json.JSONObject()
            json.put("widthPixels", dm.widthPixels)
            json.put("heightPixels", dm.heightPixels)
            json.put("density", dm.density)
            return json.toString()
        }

        @JavascriptInterface
        fun backupData(jsonData: String) {
            dataToBackup = jsonData
            val sdf = java.text.SimpleDateFormat("yyyyMMdd HHmmss", java.util.Locale.getDefault())
            val timestamp = sdf.format(java.util.Date())
            val fileName = "floating task $timestamp.json"
            createDocumentLauncher.launch(fileName)
        }

        @JavascriptInterface
        fun restoreData() {
            openDocumentLauncher.launch(arrayOf("application/json", "application/octet-stream", "*/*"))
        }

        @JavascriptInterface
        fun showRewardedAd() {
            showRewardedAdWithType("limit")
        }

        @JavascriptInterface
        fun showRewardedAdForCoin() {
            showRewardedAdWithType("coin")
        }

        private fun showRewardedAdWithType(type: String) {
            runOnUiThread {
                lastRewardType = type
                if (rewardedAd != null) {
                    val ad = rewardedAd
                    rewardedAd = null // 早期にnullをセットして再ロード可能にする
                    
                    ad?.fullScreenContentCallback = object : FullScreenContentCallback() {
                        override fun onAdDismissedFullScreenContent() {
                            AppLogger.log(mContext, "Rewarded ad dismissed: type=$lastRewardType")
                            loadRewardedAd()
                        }

                        override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                            AppLogger.log(mContext, "Rewarded ad failed to show: ${adError.message}")
                            val webView: WebView = findViewById(R.id.webView)
                            webView.evaluateJavascript("onAdFailed('$lastRewardType');", null)
                            loadRewardedAd()
                        }
                    }
                    
                    ad?.show(this@MainActivity) { _ ->
                        AppLogger.log(mContext, "Rewarded ad reward earned: type=$lastRewardType")
                        val webView: WebView = findViewById(R.id.webView)
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
                    AppLogger.log(mContext, "Rewarded ad NOT loaded: type=$type")
                    val webView: WebView = findViewById(R.id.webView)
                    webView.evaluateJavascript("onAdFailed('$type');", null)
                    loadRewardedAd()
                }
            }
        }

        @JavascriptInterface
        fun getCoins(): Int {
            val prefs = mContext.getSharedPreferences("prefs", MODE_PRIVATE)
            return prefs.getInt("coins", 0)
        }

        @JavascriptInterface
        fun canEarnCoinToday(): Boolean {
            val prefs = mContext.getSharedPreferences("prefs", MODE_PRIVATE)
            val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
            val lastAdDate = prefs.getString("lastAdDate", "")
            val dailyCount = if (lastAdDate == today) prefs.getInt("dailyAdCount", 0) else 0
            return dailyCount < 10
        }

        private fun earnCoin(): Int {
            val prefs = mContext.getSharedPreferences("prefs", MODE_PRIVATE)
            val coins = prefs.getInt("coins", 0)
            val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
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

        @JavascriptInterface
        fun consumeCoin(): Boolean {
            val prefs = mContext.getSharedPreferences("prefs", MODE_PRIVATE)
            val coins = prefs.getInt("coins", 0)
            if (coins > 0) {
                prefs.edit { putInt("coins", coins - 1) }
                return true
            }
            return false
        }

        @JavascriptInterface
        fun checkDailyCoinBonus(): Boolean {
            val prefs = mContext.getSharedPreferences("prefs", MODE_PRIVATE)
            val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
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

        @JavascriptInterface
        fun isRewardedAdReady(): Boolean {
            return rewardedAd != null
        }

        @JavascriptInterface
        fun isAdFree(): Boolean {
            return isAdFree || isLimitUnlockedByReward
        }

        @JavascriptInterface
        fun isPremium(): Boolean {
            return isAdFree
        }

        @JavascriptInterface
        fun submitUnlockCode(code: String): Boolean {
            // セキュリティ対策: 平文のコードではなくハッシュ値で比較する
            // local.properties -> build.gradle.kts 経由で提供されるハッシュとソルトを使用
            val salt = BuildConfig.PREMIUM_CODE_SALT
            val expectedHash = BuildConfig.PREMIUM_CODE_HASH
            
            val inputWithSalt = code + salt
            val hashedInput = sha256(inputWithSalt)

            if (hashedInput == expectedHash) {
                isAdFree = true
                val prefs = mContext.getSharedPreferences("prefs", MODE_PRIVATE)
                prefs.edit { putBoolean("isAdFree", true) }
                
                runOnUiThread {
                    val adView: AdView = findViewById(R.id.adView)
                    adView.visibility = View.GONE
                    val webView: WebView = findViewById(R.id.webView)
                    webView.evaluateJavascript("location.reload();", null)
                }
                return true
            }
            return false
        }

        @JavascriptInterface
        fun setAppLanguage(languageCode: String) {
            val appLocale: androidx.core.os.LocaleListCompat = if (languageCode == "system") {
                androidx.core.os.LocaleListCompat.getEmptyLocaleList()
            } else {
                androidx.core.os.LocaleListCompat.forLanguageTags(languageCode)
            }
            runOnUiThread {
                androidx.appcompat.app.AppCompatDelegate.setApplicationLocales(appLocale)
            }
        }

        @JavascriptInterface
        fun getSystemLanguage(): String {
            return java.util.Locale.getDefault().language
        }

        private fun sha256(input: String): String {
            val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
            return bytes.joinToString("") { "%02x".format(it) }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        AppLogger.log(this, "MainActivity onNewIntent")
    }

    override fun onResume() {
        super.onResume()
        AppLogger.log(this, "MainActivity onResume")

        val prefs = getSharedPreferences("prefs", MODE_PRIVATE)
        prefs.edit { putBoolean("isAppInForeground", true) }

        // 全画面表示中はフローティングウィンドウを隠す。
        // ただし、設定画面のフローティング調整中はこの限りではない（JS側から表示指示が出る）。
        if (Settings.canDrawOverlays(this)) {
            overlayPermissionDialog?.dismiss()
            overlayPermissionDialog = null

            val intent = Intent(this, FloatingWindowService::class.java)
            intent.action = "ACTION_HIDE"
            startService(intent)
        }

        // 日付を跨いでいた場合、リセットを確認する。そうでない場合もデータを同期する。
        if (isPageLoaded) {
            val webView: WebView = findViewById(R.id.webView)
            webView.requestLayout() // 再描画を強制
            webView.evaluateJavascript("checkDailyReset();", null)
            
            // バナー広告の表示更新
            val adView: AdView = findViewById(R.id.adView)
            if (isAdFree) {
                adView.visibility = View.GONE
            } else {
                adView.visibility = View.VISIBLE
            }
        }
    }

    override fun onPause() {
        super.onPause()
        AppLogger.log(this, "MainActivity onPause")

        val prefs = getSharedPreferences("prefs", MODE_PRIVATE)
        prefs.edit { putBoolean("isAppInForeground", false) }

        val showWhenEmpty = prefs.getBoolean("showWhenEmpty", false)

        // アプリがバックグラウンドに回った時、未完了タスクがあるか、またはタスクゼロでも表示設定の場合に表示する
        if (((pendingTaskCount > 0) || showWhenEmpty) && Settings.canDrawOverlays(this)) {
            startFloatingService(isSettingsMode = false)
        }
    }

    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        AppLogger.log(this, "MainActivity onTrimMemory: level=$level")
        AppLogger.logMemoryStatus(this, "onTrimMemory level=$level", "MainActivity")
    }

    override fun onLowMemory() {
        super.onLowMemory()
        AppLogger.log(this, "MainActivity onLowMemory")
        AppLogger.logMemoryStatus(this, "onLowMemory", "MainActivity")
    }

    private fun startFloatingService(isSettingsMode: Boolean) {
        val intent = Intent(this, FloatingWindowService::class.java)
        intent.action = "ACTION_SHOW"
        intent.putExtra("IS_SETTINGS_MODE", isSettingsMode)
        startForegroundService(intent)
    }

    private fun showOverlayPermissionDialog() {
        if (overlayPermissionDialog?.isShowing == true) return

        overlayPermissionDialog = AlertDialog.Builder(this)
            .setTitle(R.string.permission_required_title)
            .setMessage(R.string.permission_required_message)
            .setPositiveButton(R.string.go_to_settings) { _, _ ->
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    "package:$packageName".toUri(),
                )
                overlayPermissionLauncher.launch(intent)
            }
            .setNegativeButton(R.string.cancel) { _, _ ->
                overlayPermissionDialog = null
                // キャンセルされた場合も一応通知権限のチェックへ進む
                checkNotificationPermission()
            }
            .setCancelable(false)
            .show()
    }

    private fun checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    android.Manifest.permission.POST_NOTIFICATIONS
                ) != android.content.pm.PackageManager.PERMISSION_GRANTED
            ) {
                showNotificationPermissionDialog()
            }
        }
    }

    private fun showNotificationPermissionDialog() {
        AlertDialog.Builder(this)
            .setTitle(R.string.permission_required_title)
            .setMessage(R.string.notification_permission_required_message)
            .setPositiveButton(R.string.btn_allow) { _, _ ->
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    requestPermissionLauncher.launch(android.Manifest.permission.POST_NOTIFICATIONS)
                }
            }
            .setNegativeButton(R.string.cancel, null)
            .setCancelable(false)
            .show()
    }
}

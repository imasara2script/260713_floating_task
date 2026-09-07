package com.example.floatingtask

import android.Manifest
import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.content.res.Resources
import android.net.Uri
import android.os.Build
import android.os.Bundle
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
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.MobileAds
import android.util.Log
import android.view.LayoutInflater
import android.widget.EditText
import androidx.activity.OnBackPressedCallback
import android.widget.Toast
import java.security.MessageDigest

class MainActivity : AppCompatActivity(), 
    WebTaskActionHandler.TaskActionListener, 
    WebSettingsHandler.SettingsActionListener,
    WebMediaHandler.MediaActionListener {

    private var pendingTaskCount = 0
    private var isPageLoaded = false
    private lateinit var adCoinHandler: WebAdCoinHandler
    private lateinit var taskActionHandler: WebTaskActionHandler
    private lateinit var settingsHandler: WebSettingsHandler
    private lateinit var mediaHandler: WebMediaHandler
    private var overlayPermissionDialog: AlertDialog? = null
    private var backPressedTime: Long = 0

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
                "com.example.floatingtask.SWITCH_TAB" -> {
                    val tab = intent.getStringExtra("tab")
                    if (tab != null) {
                        webView.evaluateJavascript("switchTab('$tab');", null)
                    }
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
                webView.evaluateJavascript("onRingtoneSelected('$uri', '${title.replace("'", "\\'") }');", null)
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        AppLogger.log(this, "MainActivity onCreate")
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)

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
        
        adCoinHandler = WebAdCoinHandler(this, webView)
        val permissionHandler = WebPermissionHandler(this)
        taskActionHandler = WebTaskActionHandler(this, permissionHandler, this)
        settingsHandler = WebSettingsHandler(this, adCoinHandler, this)
        mediaHandler = WebMediaHandler(this, this)
        
        webView.addJavascriptInterface(WebAppInterface(this), "Android")

        webView.webChromeClient = object : android.webkit.WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: android.webkit.ConsoleMessage?): Boolean {
                consoleMessage?.let {
                    android.util.Log.d("WebViewConsole", "${it.message()} -- From line ${it.lineNumber()} of ${it.sourceId()}")
                }
                return true
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                isPageLoaded = true
                if (url?.contains("index.html") == true) {
                    webView.evaluateJavascript("checkDailyReset();", null)
                }
            }
        }

        if (permissionHandler.allEssentialPermissionsGranted()) {
            webView.loadUrl("file:///android_asset/index.html")
        } else {
            webView.loadUrl("file:///android_asset/permissions.html")
        }

        // AdMobの初期化
        MobileAds.initialize(this) {
            AppLogger.log(this, "AdMob initialized")
            adCoinHandler.loadRewardedAd()
        }
        
        val adView: AdView = findViewById(R.id.adView)
        if (adCoinHandler.isAdFree) {
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
                        if (backPressedTime + 3000 > System.currentTimeMillis()) {
                            // 3秒以内に再度押された場合は終了
                            isEnabled = false
                            onBackPressedDispatcher.onBackPressed()
                            isEnabled = true
                        } else {
                            // 1回目はメッセージを表示
                            Toast.makeText(
                                this@MainActivity,
                                "もう一度バックボタンを押すとアプリを終了します",
                                Toast.LENGTH_SHORT
                            ).show()
                            backPressedTime = System.currentTimeMillis()
                        }
                    }
                }
            }
        })

        // ブロードキャストレシーバーの登録
        val filter = IntentFilter().apply {
            addAction("com.example.floatingtask.DATA_CHANGED")
            addAction("com.example.floatingtask.POSITION_CHANGED")
            addAction("com.example.floatingtask.SWITCH_TAB")
        }
        ContextCompat.registerReceiver(
            this,
            dataChangeReceiver,
            filter,
            ContextCompat.RECEIVER_NOT_EXPORTED,
        )

        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        if (intent?.getBooleanExtra("EXTRA_SHOW_FLOATING", false) == true) {
            AppLogger.log(this, "MainActivity: EXTRA_SHOW_FLOATING received")
            startFloatingService(false)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(dataChangeReceiver)
    }

    override fun onPendingTaskCountChanged(count: Int) {
        pendingTaskCount = count
    }

    override fun startFloatingService(isSettingsMode: Boolean) {
        val intent = Intent(this, FloatingWindowService::class.java)
        intent.action = "ACTION_SHOW"
        intent.putExtra("IS_SETTINGS_MODE", isSettingsMode)
        startForegroundService(intent)
    }

    override fun onPremiumUnlocked() {
        runOnUiThread {
            val adView: AdView = findViewById(R.id.adView)
            adView.visibility = View.GONE
            val webView: WebView = findViewById(R.id.webView)
            webView.evaluateJavascript("location.reload();", null)
        }
    }

    override fun onPickRingtone(intent: Intent) {
        ringtonePickerLauncher.launch(intent)
    }

    override fun onBackupData(fileName: String, jsonData: String) {
        dataToBackup = jsonData
        createDocumentLauncher.launch(fileName)
    }

    override fun onRestoreData() {
        openDocumentLauncher.launch(arrayOf("application/json", "application/octet-stream", "*/*"))
    }

    @Suppress("unused")
    inner class WebAppInterface(private val mContext: Context) {
        private val logHandler = WebLogHandler(mContext)
        private val permissionHandler = WebPermissionHandler(mContext)

        @JavascriptInterface
        fun isLoggingEnabled(): Boolean = logHandler.isLoggingEnabled()

        @JavascriptInterface
        fun setLoggingEnabled(enabled: Boolean) = logHandler.setLoggingEnabled(enabled)

        @JavascriptInterface
        fun getLogContent(): String = logHandler.getLogContent()

        @JavascriptInterface
        fun shareLog() = logHandler.shareLog()

        @JavascriptInterface
        fun clearLog() = logHandler.clearLog()

        @JavascriptInterface
        fun getLogSize(): Double = logHandler.getLogSize()

        @JavascriptInterface
        fun logComment(comment: String) = logHandler.logComment(comment)

        @JavascriptInterface
        fun logToAppLog(message: String) = logHandler.logToAppLog(message)

        @JavascriptInterface
        fun logSystemStatus() = logHandler.logSystemStatus()

        @JavascriptInterface
        fun testIntervalNotification() = taskActionHandler.testIntervalNotification()

        @JavascriptInterface
        fun showKeyboard() {
            runOnUiThread {
                val imm = mContext.getSystemService(Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager
                val webView: WebView = findViewById(R.id.webView)
                imm.showSoftInput(webView, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT)
            }
        }

        @JavascriptInterface
        fun startFloatingWindow() {
            if (!permissionHandler.checkOverlayPermissionGranted()) {
                runOnUiThread {
                    launchOverlayPermissionSettings()
                }
            } else {
                taskActionHandler.startFloatingWindow()
            }
        }

        @JavascriptInterface
        fun checkOverlayPermissionGranted(): Boolean = permissionHandler.checkOverlayPermissionGranted()

        @JavascriptInterface
        fun requestOverlayPermission() {
            runOnUiThread {
                launchOverlayPermissionSettings()
            }
        }

        @JavascriptInterface
        fun launchOverlayPermissionSettings() {
            runOnUiThread {
                overlayPermissionLauncher.launch(permissionHandler.getOverlayPermissionIntent())
            }
        }

        @JavascriptInterface
        fun stopFloatingWindow() = taskActionHandler.stopFloatingWindow()

        @JavascriptInterface
        fun setReminderAlarms(taskId: Long, taskText: String, jsonReminders: String) =
            taskActionHandler.setReminderAlarms(taskId, taskText, jsonReminders)

        @JavascriptInterface
        fun updateTaskCompletionState(taskId: Long, isCompleted: Boolean) =
            taskActionHandler.updateTaskCompletionState(taskId, isCompleted)

        @JavascriptInterface
        fun testReminderNotification(taskText: String, message: String) =
            taskActionHandler.testReminderNotification(taskText, message)

        @JavascriptInterface
        fun onDataChanged() = taskActionHandler.onDataChanged()

        @JavascriptInterface
        fun openMainActivity() {
            val intent = Intent(mContext, MainActivity::class.java)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
            mContext.startActivity(intent)
        }

        @JavascriptInterface
        fun openHistory() {
            runOnUiThread {
                val intent = Intent(mContext, MainActivity::class.java)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                mContext.startActivity(intent)
                
                // WebViewのタブを履歴に切り替える
                val webView: WebView = findViewById(R.id.webView)
                webView.evaluateJavascript("switchTab('history');", null)
            }
        }

        @JavascriptInterface
        fun toggleExpand(expanded: Boolean) = taskActionHandler.toggleExpand(expanded)

        @JavascriptInterface
        fun updatePendingTaskCount(count: Int) = taskActionHandler.updatePendingTaskCount(count)

        @JavascriptInterface
        fun checkBatteryOptimizationExempt(): Boolean = permissionHandler.checkBatteryOptimizationExempt()

        @JavascriptInterface
        fun requestBatteryOptimizationExemption() {
            mContext.startActivity(permissionHandler.getBatteryOptimizationIntent())
        }

        @JavascriptInterface
        fun checkNotificationPermissionGranted(): Boolean = permissionHandler.checkNotificationPermissionGranted()

        @JavascriptInterface
        fun requestNotificationPermission() {
            runOnUiThread {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    val permission = Manifest.permission.POST_NOTIFICATIONS
                    if (shouldShowRequestPermissionRationale(permission)) {
                        requestPermissionLauncher.launch(permission)
                    } else {
                        val prefs = mContext.getSharedPreferences("prefs", MODE_PRIVATE)
                        val requested = prefs.getBoolean("notif_permission_requested", false)
                        
                        if (!requested) {
                            prefs.edit { putBoolean("notif_permission_requested", true) }
                            requestPermissionLauncher.launch(permission)
                        } else {
                            launchNotificationSettings()
                        }
                    }
                } else {
                    launchNotificationSettings()
                }
            }
        }

        @JavascriptInterface
        fun launchNotificationSettings() {
            runOnUiThread {
                try {
                    val intent = permissionHandler.getNotificationSettingsIntent()
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    mContext.startActivity(intent)
                } catch (e: Exception) {
                    AppLogger.log(mContext, "Error launching notification settings: ${e.message}")
                    val intent = permissionHandler.getAppDetailsSettingsIntent()
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    mContext.startActivity(intent)
                }
            }
        }

        @JavascriptInterface
        fun checkExactAlarmPermission(): Boolean = permissionHandler.checkExactAlarmPermission()

        @JavascriptInterface
        fun openExactAlarmSettings() {
            permissionHandler.getExactAlarmSettingsIntent()?.let {
                mContext.startActivity(it)
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
        fun showConfirmDialog(title: String, message: String, callbackId: String) {
            runOnUiThread {
                AlertDialog.Builder(this@MainActivity)
                    .setTitle(title)
                    .setMessage(message)
                    .setPositiveButton(android.R.string.ok) { _, _ ->
                        val webView: WebView = findViewById(R.id.webView)
                        webView.evaluateJavascript("window.onNativeConfirmResult('$callbackId', true);", null)
                    }
                    .setNegativeButton(android.R.string.cancel) { _, _ ->
                        val webView: WebView = findViewById(R.id.webView)
                        webView.evaluateJavascript("window.onNativeConfirmResult('$callbackId', false);", null)
                    }
                    .setOnCancelListener {
                        val webView: WebView = findViewById(R.id.webView)
                        webView.evaluateJavascript("window.onNativeConfirmResult('$callbackId', false);", null)
                    }
                    .show()
            }
        }

        @JavascriptInterface
        fun setIntervalAlarm(minutes: Int) = taskActionHandler.setIntervalAlarm(minutes)

        @JavascriptInterface
        fun setTimerAlarm(taskId: Long, taskText: String, durationMs: Long, melody: String) =
            taskActionHandler.setTimerAlarm(taskId, taskText, durationMs, melody)

        @JavascriptInterface
        fun pickRingtone() = mediaHandler.pickRingtone()

        @JavascriptInterface
        fun updateFloatingSettingsExtended(
            cX: Int, cY: Int, cScale: Float, showEmpty: Boolean, moveC: Boolean,
            eX: Int, eY: Int, eScale: Float, moveE: Boolean,
            width: Int, height: Int, showClose: Boolean,
            displayTaskCount: Int, scrollTaskCount: Int,
            showCheckedToggle: Boolean, scrollButtonType: String,
            allowDrag: Boolean, allowDragCollapsed: Boolean,
            showHistoryButton: Boolean, navType: String, keepService: Boolean,
            menuActionDelay: Int
        ) = settingsHandler.updateFloatingSettingsExtended(
            cX, cY, cScale, showEmpty, moveC,
            eX, eY, eScale, moveE,
            width, height, showClose,
            displayTaskCount, scrollTaskCount,
            showCheckedToggle, scrollButtonType,
            allowDrag, allowDragCollapsed,
            showHistoryButton, navType, keepService,
            menuActionDelay
        )

        @JavascriptInterface
        fun updateFloatingSettings(x: Int, y: Int, width: Int, height: Int, scale: Float) =
            settingsHandler.updateFloatingSettings(x, y, width, height, scale)

        @JavascriptInterface
        fun getDisplayMetrics(): String = settingsHandler.getDisplayMetrics()

        @JavascriptInterface
        fun backupData(jsonData: String) = mediaHandler.backupData(jsonData)

        @JavascriptInterface
        fun restoreData() = mediaHandler.restoreData()

        @JavascriptInterface
        fun showRewardedAd() {
            adCoinHandler.showRewardedAdWithType("limit")
        }

        @JavascriptInterface
        fun showRewardedAdForCoin() {
            adCoinHandler.showRewardedAdWithType("coin")
        }

        @JavascriptInterface
        fun getCoins(): Int = adCoinHandler.getCoins()

        @JavascriptInterface
        fun canEarnCoinToday(): Boolean = adCoinHandler.canEarnCoinToday()

        @JavascriptInterface
        fun earnCoin(): Int = adCoinHandler.earnCoin()

        @JavascriptInterface
        fun consumeCoin(): Boolean = adCoinHandler.consumeCoin()

        @JavascriptInterface
        fun checkDailyCoinBonus(): Boolean = adCoinHandler.checkDailyCoinBonus()

        @JavascriptInterface
        fun isRewardedAdReady(): Boolean = adCoinHandler.isRewardedAdReady()

        @JavascriptInterface
        fun isAdFree(): Boolean = adCoinHandler.isAdFreeEffective()

        @JavascriptInterface
        fun isPremium(): Boolean = adCoinHandler.isAdFree

        @JavascriptInterface
        fun submitUnlockCode(code: String): Boolean = settingsHandler.submitUnlockCode(code)

        @JavascriptInterface
        fun setAppLanguage(languageCode: String) {
            runOnUiThread {
                settingsHandler.setAppLanguage(languageCode)
            }
        }

        @JavascriptInterface
        fun getSystemLanguage(): String = settingsHandler.getSystemLanguage()

        @JavascriptInterface
        fun playMelody(melody: String) = mediaHandler.playMelody(melody)

        @JavascriptInterface
        fun stopMelody() = mediaHandler.stopMelody()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
        AppLogger.log(this, "MainActivity onNewIntent")
    }

    override fun onResume() {
        super.onResume()
        AppLogger.log(this, "MainActivity onResume")

        val prefs = getSharedPreferences("prefs", MODE_PRIVATE)
        prefs.edit { putBoolean("isAppInForeground", true) }

        if (Settings.canDrawOverlays(this)) {
            overlayPermissionDialog?.dismiss()
            overlayPermissionDialog = null

            val intent = Intent(this, FloatingWindowService::class.java)
            intent.action = "ACTION_HIDE"
            startService(intent)
        }

        if (isPageLoaded) {
            val webView: WebView = findViewById(R.id.webView)
            webView.requestLayout()

            val permissionHandler = WebPermissionHandler(this)
            if (webView.url?.contains("permissions.html") == true) {
                if (permissionHandler.allEssentialPermissionsGranted()) {
                    webView.loadUrl("file:///android_asset/index.html")
                } else {
                    webView.evaluateJavascript("updateAllStatus();", null)
                }
            } else if (webView.url?.contains("index.html") == true) {
                webView.evaluateJavascript("checkDailyReset();", null)
            }
            
            val adView: AdView = findViewById(R.id.adView)
            if (adCoinHandler.isAdFreeEffective()) {
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
}

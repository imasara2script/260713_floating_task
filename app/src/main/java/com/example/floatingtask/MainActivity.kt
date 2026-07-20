package com.example.floatingtask

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.view.WindowManager
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : AppCompatActivity() {

    private var pendingTaskCount = 0
    private var isPageLoaded = false

    private val dataChangeReceiver = object : android.content.BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val webView: WebView = findViewById(R.id.webView)
            if (isPageLoaded) {
                webView.evaluateJavascript("refreshData();", null)
            }
        }
    }

    private val overlayPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) {
        if (Settings.canDrawOverlays(this)) {
            startFloatingService()
        }
    }

    private val ringtonePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            val uri: Uri? = result.data?.getParcelableExtra(android.media.RingtoneManager.EXTRA_RINGTONE_PICKED_URI)
            val webView: WebView = findViewById(R.id.webView)
            if (uri != null) {
                val ringtone = android.media.RingtoneManager.getRingtone(this, uri)
                val title = ringtone.getTitle(this)
                webView.evaluateJavascript("onRingtoneSelected('${uri.toString()}', '${title.replace("'", "\\'")}');", null)
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)

        // 初回起動時などにオーバーレイ権限をチェック
        if (!Settings.canDrawOverlays(this)) {
            showOverlayPermissionDialog()
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val requestPermissionLauncher = registerForActivityResult(
                ActivityResultContracts.RequestPermission()
            ) { isGranted: Boolean -> }
            requestPermissionLauncher.launch(android.Manifest.permission.POST_NOTIFICATIONS)
        }

        val webView: WebView = findViewById(R.id.webView)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = true
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

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        // ブロードキャストレシーバーの登録
        val filter = IntentFilter("com.example.floatingtask.DATA_CHANGED")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(dataChangeReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(dataChangeReceiver, filter)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(dataChangeReceiver)
    }

    inner class WebAppInterface(private val mContext: Context) {
        @JavascriptInterface
        fun startFloatingWindow() {
            checkOverlayPermissionAndStart()
        }

        @JavascriptInterface
        fun stopFloatingWindow() {
            val intent = Intent(mContext, FloatingWindowService::class.java)
            intent.action = "ACTION_HIDE"
            mContext.startService(intent)
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
            val powerManager = mContext.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
            return powerManager.isIgnoringBatteryOptimizations(mContext.packageName)
        }

        @JavascriptInterface
        fun requestBatteryOptimizationExemption() {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
            intent.data = Uri.parse("package:${mContext.packageName}")
            mContext.startActivity(intent)
        }

        @JavascriptInterface
        fun checkExactAlarmPermission(): Boolean {
            val alarmManager = mContext.getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
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
                intent.data = Uri.parse("package:${mContext.packageName}")
                mContext.startActivity(intent)
            }
        }

        @JavascriptInterface
        fun setIntervalAlarm(minutes: Int) {
            val prefs = mContext.getSharedPreferences("prefs", Context.MODE_PRIVATE)
            prefs.edit().putInt("recheckInterval", minutes).apply()

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
                putExtra(android.media.RingtoneManager.EXTRA_RINGTONE_TITLE, "メロディを選択")
                putExtra(android.media.RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true)
                putExtra(android.media.RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, true)
            }
            ringtonePickerLauncher.launch(intent)
        }

        @JavascriptInterface
        fun updateFloatingSettings(x: Int, y: Int, width: Int, height: Int, scale: Float) {
            val prefs = mContext.getSharedPreferences("prefs", Context.MODE_PRIVATE)
            prefs.edit().apply {
                putInt("floatX", x)
                putInt("floatY", y)
                putInt("floatWidth", width)
                putInt("floatHeight", height)
                putFloat("floatScale", scale)
                apply()
            }
            // サービスが実行中なら更新を通知
            val intent = Intent(mContext, FloatingWindowService::class.java)
            intent.action = "ACTION_UPDATE_SETTINGS"
            mContext.startService(intent)
        }

        @JavascriptInterface
        fun getDisplayMetrics(): String {
            // システム全体のメトリクスを使用することで、より確実に物理ピクセルと密度を取得
            val dm = android.content.res.Resources.getSystem().displayMetrics
            val json = org.json.JSONObject()
            json.put("widthPixels", dm.widthPixels)
            json.put("heightPixels", dm.heightPixels)
            json.put("density", dm.density)
            return json.toString()
        }
    }

    override fun onResume() {
        super.onResume()
        // 全画面表示中はフローティングウィンドウを隠す。
        // ただし、設定画面のフローティング調整中はこの限りではない（JS側から表示指示が出る）。
        if (Settings.canDrawOverlays(this)) {
            val intent = Intent(this, FloatingWindowService::class.java)
            intent.action = "ACTION_HIDE"
            startService(intent)
        }

        // 日付を跨いでいた場合、リセットを確認する。そうでない場合もデータを同期する。
        if (isPageLoaded) {
            val webView: WebView = findViewById(R.id.webView)
            webView.evaluateJavascript("checkDailyReset();", null)
        }
    }

    override fun onPause() {
        super.onPause()
        // アプリがバックグラウンドに回った時、未完了タスクがあれば表示する
        if (pendingTaskCount > 0 && Settings.canDrawOverlays(this)) {
            startFloatingService()
        }
    }

    private fun checkOverlayPermissionAndStart() {
        if (!Settings.canDrawOverlays(this)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            overlayPermissionLauncher.launch(intent)
        } else {
            startFloatingService()
        }
    }

    private fun startFloatingService() {
        val intent = Intent(this, FloatingWindowService::class.java)
        intent.action = "ACTION_SHOW"
        startForegroundService(intent)
    }

    private fun showOverlayPermissionDialog() {
        android.app.AlertDialog.Builder(this)
            .setTitle("権限が必要です")
            .setMessage("このアプリを動作させるには「他のアプリの上に重ねて表示」権限を許可する必要があります。設定画面から許可してください。")
            .setPositiveButton("設定へ") { _, _ ->
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")
                )
                startActivity(intent)
            }
            .setNegativeButton("キャンセル", null)
            .setCancelable(false)
            .show()
    }
}

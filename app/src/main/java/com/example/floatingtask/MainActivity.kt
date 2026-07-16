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
        fun setTimerAlarm(taskId: Long, taskText: String, durationMs: Long) {
            AlarmScheduler.scheduleTimerAlarm(mContext, taskId, taskText, durationMs)
        }
    }

    override fun onResume() {
        super.onResume()
        // 全画面表示中はフローティングウィンドウを隠す
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

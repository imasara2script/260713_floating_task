package com.example.floatingtask

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : AppCompatActivity() {

    private var pendingTaskCount = 0

    private val dataChangeReceiver = object : android.content.BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val webView: WebView = findViewById(R.id.webView)
            webView.evaluateJavascript("refreshData();", null)
        }
    }

    // 他のアプリの上に重ねて表示する権限を要求するためのランチャー
    private val overlayPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) {
        if (Settings.canDrawOverlays(this)) {
            startFloatingService()
        } else {
            Toast.makeText(this, "フローティング表示には権限が必要です", Toast.LENGTH_SHORT).show()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerForActivityResult(ActivityResultContracts.RequestPermission()) {}.launch(android.Manifest.permission.POST_NOTIFICATIONS)
        }

        val webView: WebView = findViewById(R.id.webView)
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = android.webkit.WebChromeClient()
        
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
        }

        // HTML/JSから "Android.startFloatingWindow()" で呼び出せるようにインターフェースを登録
        webView.addJavascriptInterface(object {
            @JavascriptInterface
            fun startFloatingWindow() {
                runOnUiThread {
                    checkOverlayPermissionAndStart()
                }
            }

            @JavascriptInterface
            fun checkExactAlarmPermission(): Boolean {
                val alarmManager = getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
                return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    alarmManager.canScheduleExactAlarms()
                } else {
                    true
                }
            }

            @JavascriptInterface
            fun openExactAlarmSettings() {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                        data = Uri.parse("package:$packageName")
                    }
                    startActivity(intent)
                }
            }

            @JavascriptInterface
            fun openMainActivity() {
                val intent = Intent(this@MainActivity, MainActivity::class.java)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                startActivity(intent)
            }

            @JavascriptInterface
            fun updatePendingTaskCount(count: Int) {
                pendingTaskCount = count
            }

            @JavascriptInterface
            fun setIntervalAlarm(minutes: Int) {
                runOnUiThread {
                    AlarmScheduler.scheduleIntervalAlarm(this@MainActivity, minutes)
                }
            }

            @JavascriptInterface
            fun onDataChanged() {
                runOnUiThread {
                    val intent = Intent(this@MainActivity, FloatingWindowService::class.java)
                    intent.action = "ACTION_REFRESH"
                    startService(intent)
                }
            }
        }, "Android")

        webView.loadUrl("file:///android_asset/index.html")

        // 毎日AM0時のリセットと正午のチェックをスケジュール
        AlarmScheduler.scheduleMidnightAlarm(this)
        AlarmScheduler.scheduleNoonAlarm(this)

        registerReceiver(dataChangeReceiver, android.content.IntentFilter("com.example.floatingtask.DATA_CHANGED"), 
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) Context.RECEIVER_EXPORTED else 0)

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(dataChangeReceiver)
    }

    override fun onResume() {
        super.onResume()
        // 全画面表示中はフローティングウィンドウを隠す
        val intent = Intent(this, FloatingWindowService::class.java)
        intent.action = "ACTION_HIDE"
        startService(intent)

        // 日付を跨いでいた場合、リセットを確認する。そうでない場合もデータを同期する。
        val webView: WebView = findViewById(R.id.webView)
        webView.evaluateJavascript("checkDailyReset();", null)
    }

    override fun onPause() {
        super.onPause()
        // アプリがバックグラウンドに回った時にフローティングウィンドウの表示を再開検討
        // ただし、未完了タスクがある場合のみ
        if (pendingTaskCount > 0) {
            val intent = Intent(this, FloatingWindowService::class.java)
            intent.action = "ACTION_SHOW"
            startService(intent)
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
        startForegroundService(intent)
    }
}

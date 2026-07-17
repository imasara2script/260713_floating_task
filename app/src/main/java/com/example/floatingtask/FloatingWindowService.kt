package com.example.floatingtask

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import androidx.core.app.NotificationCompat

class FloatingWindowService : Service() {

    private lateinit var windowManager: WindowManager
    private var floatingView: View? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        startForegroundService()
        showFloatingWindow()
    }

    private fun startForegroundService() {
        val channelId = "floating_window_service"
        val channel = NotificationChannel(
            channelId,
            "Floating Window Service",
            NotificationManager.IMPORTANCE_LOW
        )
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Floating Task Running")
            .setSmallIcon(R.mipmap.ic_launcher)
            .build()

        startForeground(1, notification)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.getBooleanExtra("TRIGGER_RESET", false) == true) {
            val webView: WebView? = floatingView?.findViewById(R.id.floatingWebView)
            webView?.evaluateJavascript("checkDailyReset();", null)
        }

        when (intent?.action) {
            "ACTION_HIDE" -> hideFloatingWindow()
            "ACTION_SHOW" -> showFloatingWindow()
            "ACTION_REFRESH" -> refreshWebView()
            "ACTION_UPDATE_SETTINGS" -> applySettings()
        }
        return START_STICKY
    }

    private fun applySettings() {
        val view = floatingView ?: return
        val params = view.layoutParams as WindowManager.LayoutParams
        val prefs = getSharedPreferences("prefs", Context.MODE_PRIVATE)

        val x = prefs.getInt("floatX", 100)
        val y = prefs.getInt("floatY", 100)
        val width = prefs.getInt("floatWidth", 300)
        val height = prefs.getInt("floatHeight", 32)
        val scale = prefs.getFloat("floatScale", 1.0f)

        // サイズ設定 (倍率考慮)
        val finalWidth = (width * scale).toInt()
        val finalHeight = (height * scale).toInt()
        params.width = finalWidth
        params.height = finalHeight

        // 画面境界内に収める
        val displayMetrics = resources.displayMetrics
        val screenWidth = displayMetrics.widthPixels
        val screenHeight = displayMetrics.heightPixels

        params.gravity = Gravity.TOP or Gravity.START
        params.x = x.coerceIn(0, (screenWidth - finalWidth).coerceAtLeast(0))
        params.y = y.coerceIn(0, (screenHeight - finalHeight).coerceAtLeast(0))

        windowManager.updateViewLayout(view, params)
        
        // WebView内にもリロードを促す
        val webView: WebView = view.findViewById(R.id.floatingWebView)
        webView.evaluateJavascript("location.reload();", null)
    }

    private fun refreshWebView() {
        val webView: WebView? = floatingView?.findViewById(R.id.floatingWebView)
        webView?.evaluateJavascript("refreshData();", null)
    }

    private fun hideFloatingWindow() {
        floatingView?.visibility = View.GONE
    }

    private fun removeFloatingWindow() {
        if (floatingView != null) {
            windowManager.removeView(floatingView)
            floatingView = null
        }
    }

    private fun applySettingsToParams(params: WindowManager.LayoutParams) {
        val prefs = getSharedPreferences("prefs", Context.MODE_PRIVATE)
        val x = prefs.getInt("floatX", 100)
        val y = prefs.getInt("floatY", 100)
        val width = prefs.getInt("floatWidth", 300)
        val height = prefs.getInt("floatHeight", 32)
        val scale = prefs.getFloat("floatScale", 1.0f)

        val finalWidth = (width * scale).toInt()
        val finalHeight = (height * scale).toInt()
        params.width = finalWidth
        params.height = finalHeight

        // 画面境界内に収める
        val displayMetrics = resources.displayMetrics
        val screenWidth = displayMetrics.widthPixels
        val screenHeight = displayMetrics.heightPixels

        params.gravity = Gravity.TOP or Gravity.START
        params.x = x.coerceIn(0, (screenWidth - finalWidth).coerceAtLeast(0))
        params.y = y.coerceIn(0, (screenHeight - finalHeight).coerceAtLeast(0))
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun showFloatingWindow() {
        if (!android.provider.Settings.canDrawOverlays(this)) {
            return
        }
        if (floatingView != null) {
            floatingView?.visibility = View.VISIBLE
            return
        }
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        
        val inflater = getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
        // floating_layout.xml をインフレート
        floatingView = inflater.inflate(R.layout.floating_layout, null)

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        )

        params.gravity = Gravity.TOP or Gravity.START
        params.x = 100
        params.y = 100

        applySettingsToParams(params)

        // WebViewの設定
        val webView: WebView = floatingView!!.findViewById(R.id.floatingWebView)
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = android.webkit.WebChromeClient()
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true

        webView.addJavascriptInterface(object {
            @JavascriptInterface
            fun openMainActivity() {
                val intent = Intent(this@FloatingWindowService, MainActivity::class.java)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                startActivity(intent)
            }

            @JavascriptInterface
            fun updatePendingTaskCount(count: Int) {
                if (count == 0) {
                    val handler = android.os.Handler(android.os.Looper.getMainLooper())
                    handler.post { hideFloatingWindow() }
                }
            }

            @JavascriptInterface
            fun onDataChanged() {
                // MainActivityに通知
                val intent = Intent("com.example.floatingtask.DATA_CHANGED")
                sendBroadcast(intent)
            }
        }, "Android")

        webView.loadUrl("file:///android_asset/index.html?mode=floating")

        // 閉じるボタンの設定
        val closeButton: Button = floatingView!!.findViewById(R.id.closeButton)
        closeButton.setOnClickListener {
            val prefs = getSharedPreferences("prefs", Context.MODE_PRIVATE)
            val intervalMinutes = prefs.getInt("recheckInterval", 0)
            
            if (intervalMinutes > 0) {
                AlarmScheduler.scheduleIntervalAlarm(this, intervalMinutes)
            }

            removeFloatingWindow()
            stopSelf()
        }

        // ドラッグ移動の設定
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f

        floatingView!!.setOnTouchListener { v, event ->
            when (event.action) {
                android.view.MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                android.view.MotionEvent.ACTION_MOVE -> {
                    val newX = initialX + (event.rawX - initialTouchX).toInt()
                    val newY = initialY + (event.rawY - initialTouchY).toInt()

                    // 画面境界内に収める
                    val displayMetrics = resources.displayMetrics
                    val screenWidth = displayMetrics.widthPixels
                    val screenHeight = displayMetrics.heightPixels

                    params.x = newX.coerceIn(0, (screenWidth - params.width).coerceAtLeast(0))
                    params.y = newY.coerceIn(0, (screenHeight - params.height).coerceAtLeast(0))

                    windowManager.updateViewLayout(floatingView, params)
                    
                    // 位置を保存
                    val prefs = getSharedPreferences("prefs", Context.MODE_PRIVATE)
                    prefs.edit().apply {
                        putInt("floatX", params.x)
                        putInt("floatY", params.y)
                        apply()
                    }
                    true
                }
                else -> false
            }
        }

        windowManager.addView(floatingView, params)
    }

    override fun onDestroy() {
        super.onDestroy()
        floatingView?.let {
            windowManager.removeView(it)
        }
    }
}

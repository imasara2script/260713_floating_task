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
        }
        return START_STICKY
    }

    private fun refreshWebView() {
        val webView: WebView? = floatingView?.findViewById(R.id.floatingWebView)
        webView?.evaluateJavascript("refreshData();", null)
    }

    private fun hideFloatingWindow() {
        floatingView?.visibility = View.GONE
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun showFloatingWindow() {
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
            stopSelf()
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

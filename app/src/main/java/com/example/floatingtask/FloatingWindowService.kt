package com.example.floatingtask

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.PixelFormat
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.text.Editable
import android.text.TextWatcher
import android.widget.EditText
import java.util.Locale
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import androidx.core.app.NotificationCompat
import kotlin.math.hypot

class FloatingWindowService : Service() {

    private lateinit var windowManager: WindowManager
    private var floatingView: View? = null
    private var isSettingsMode = false

    private val dataChangeReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            refreshWebView()
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        AppLogger.log(this, "FloatingWindowService onCreate")
        startForegroundService()
        val filter = IntentFilter("com.example.floatingtask.DATA_CHANGED")
        androidx.core.content.ContextCompat.registerReceiver(
            this,
            dataChangeReceiver,
            filter,
            androidx.core.content.ContextCompat.RECEIVER_NOT_EXPORTED,
        )
    }

    private fun startForegroundService() {
        val channelId = "floating_window_service"
        val channel = NotificationChannel(
            channelId,
            getString(R.string.floating_window_service_name),
            NotificationManager.IMPORTANCE_LOW,
        )
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle(getString(R.string.floating_window_service_name))
            .setSmallIcon(R.mipmap.ic_launcher)
            .build()

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(1, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(1, notification)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        AppLogger.log(this, "FloatingWindowService onStartCommand: action=${intent?.action}, flags=$flags")

        if (intent == null) {
            // システムによるサービス再起動時 (START_STICKY)
            AppLogger.log(this, "FloatingWindowService restarted by System (intent is null)")
            showFloatingWindow()
            return START_STICKY
        }

        if (intent.getBooleanExtra("TRIGGER_RESET", false) == true) {
            val webView: WebView? = floatingView?.findViewById(R.id.floatingWebView)
            webView?.evaluateJavascript("checkDailyReset();", null)
        }

        if (intent.hasExtra("IS_SETTINGS_MODE")) {
            isSettingsMode = intent.getBooleanExtra("IS_SETTINGS_MODE", false)
        }

        when (intent.action) {
            "ACTION_HIDE" -> {
                isSettingsMode = false
                hideFloatingWindow()
            }
            "ACTION_SHOW" -> showFloatingWindow()
            "ACTION_REFRESH" -> refreshWebView()
            "ACTION_UPDATE_SETTINGS" -> applySettings()
            "ACTION_EXPAND" -> {
                if (floatingView == null) {
                    isExpanded = true
                    showFloatingWindow()
                } else {
                    updateWindowSize(expanded = true)
                    val webView: WebView? = floatingView?.findViewById(R.id.floatingWebView)
                    webView?.evaluateJavascript("toggleFloatingExpand(true, true);", null)
                }
            }
            "ACTION_COLLAPSE" -> {
                if (floatingView == null) {
                    isExpanded = false
                    showFloatingWindow()
                } else {
                    updateWindowSize(expanded = false)
                    val webView: WebView? = floatingView?.findViewById(R.id.floatingWebView)
                    webView?.evaluateJavascript("toggleFloatingExpand(false, true);", null)
                }
            }
        }
        return START_STICKY
    }

    private fun applySettings() {
        val view = floatingView ?: return
        
        val prefs = getSharedPreferences("prefs", MODE_PRIVATE)
        val isAppInForeground = prefs.getBoolean("isAppInForeground", false)
        if (isAppInForeground && !isSettingsMode) {
            hideFloatingWindow()
            return
        }

        // 現在の状態（展開/縮小）を維持しつつ、新しい設定（スケールやサイズ）を反映
        updateWindowSize(isExpanded)
        
        val scale = if (isExpanded) {
            prefs.getFloat("floatExpandedScale", 1.0f)
        } else {
            prefs.getFloat("floatCollapsedScale", 1.0f)
        }
        val displayTaskCount = prefs.getInt("displayTaskCount", 1)
        val scrollTaskCount = prefs.getInt("scrollTaskCount", 1)
        val showCheckedToggle = prefs.getBoolean("showCheckedToggle", false)
        val scrollButtonType = prefs.getString("scrollButtonType", "both") ?: "both"
        val allowDrag = prefs.getBoolean("allowDrag", true)
        val allowDragCollapsed = prefs.getBoolean("allowDragCollapsed", true)
        
        // WebView内にもリロードを促す（スケール変更などを反映させるため）
        val webView: WebView = view.findViewById(R.id.floatingWebView)
        webView.evaluateJavascript("applyFloatingSettings($scale, $isExpanded, $displayTaskCount, $scrollTaskCount, $showCheckedToggle, '$scrollButtonType', $allowDrag, $allowDragCollapsed);", null)
    }

    private fun refreshWebView() {
        val webView: WebView? = floatingView?.findViewById(R.id.floatingWebView)
        webView?.evaluateJavascript("refreshData();", null)
    }

    private fun hideFloatingWindow() {
        AppLogger.log(this, "hideFloatingWindow called")
        floatingView?.visibility = View.GONE
    }

    private fun removeFloatingWindow() {
        if (floatingView != null) {
            AppLogger.log(this, "removeFloatingWindow called")
            windowManager.removeView(floatingView)
            floatingView = null
        }
    }

    private fun applySettingsToParams(params: WindowManager.LayoutParams) {
        val prefs = getSharedPreferences("prefs", MODE_PRIVATE)
        val density = resources.displayMetrics.density

        val scale = if (isExpanded) {
            prefs.getFloat("floatExpandedScale", 1.0f)
        } else {
            prefs.getFloat("floatCollapsedScale", 1.0f)
        }

        if (isExpanded) {
            val width = prefs.getInt("floatWidth", (300 * density).toInt())
            val height = prefs.getInt("floatHeight", (44 * density).toInt())
            params.width = (width * scale).toInt()
            params.height = (height * scale).toInt()
        } else {
            params.width = (64 * density * scale).toInt()
            params.height = (52 * density * scale).toInt()
        }

        // 画面境界内に収める
        val displayMetrics = resources.displayMetrics
        val screenWidth = displayMetrics.widthPixels
        val screenHeight = displayMetrics.heightPixels

        val xKey = if (isExpanded) "floatExpandedX" else "floatCollapsedX"
        val yKey = if (isExpanded) "floatExpandedY" else "floatCollapsedY"
        val fallbackXKey = "floatX"
        val fallbackYKey = "floatY"

        val x = prefs.getInt(xKey, prefs.getInt(fallbackXKey, 100))
        val y = prefs.getInt(yKey, prefs.getInt(fallbackYKey, 100))

        params.gravity = Gravity.TOP or Gravity.START
        params.x = x.coerceIn(0, (screenWidth - params.width).coerceAtLeast(0))
        params.y = y.coerceIn(0, (screenHeight - params.height).coerceAtLeast(0))
    }

    private var isExpanded = false

    private fun updateWindowSize(expanded: Boolean) {
        AppLogger.log(this, "updateWindowSize: expanded=$expanded")
        isExpanded = expanded
        val view = floatingView ?: return
        val params = view.layoutParams as WindowManager.LayoutParams
        val prefs = getSharedPreferences("prefs", MODE_PRIVATE)
        val density = resources.displayMetrics.density

        val scale = if (expanded) {
            prefs.getFloat("floatExpandedScale", 1.0f)
        } else {
            prefs.getFloat("floatCollapsedScale", 1.0f)
        }

        if (expanded) {
            val width = prefs.getInt("floatWidth", (300 * density).toInt())
            val height = prefs.getInt("floatHeight", (44 * density).toInt())
            params.width = (width * scale).toInt()
            params.height = (height * scale).toInt()
        } else {
            // 畳まれている時のサイズ (目安: 64dp x 52dp)
            params.width = (64 * density * scale).toInt()
            params.height = (52 * density * scale).toInt()
        }

        // 固定位置の設定
        val alwaysMove = if (expanded) {
            prefs.getBoolean("alwaysMoveExpanded", false)
        } else {
            prefs.getBoolean("alwaysMoveCollapsed", false)
        }

        if (alwaysMove) {
            val xKey = if (expanded) "floatExpandedX" else "floatCollapsedX"
            val yKey = if (expanded) "floatExpandedY" else "floatCollapsedY"
            val fallbackXKey = "floatX"
            val fallbackYKey = "floatY"
            params.x = prefs.getInt(xKey, prefs.getInt(fallbackXKey, 100))
            params.y = prefs.getInt(yKey, prefs.getInt(fallbackYKey, 100))
        }

        // 閉じるボタンの表示切り替え
        val showClose = if (expanded) {
            prefs.getBoolean("showCloseButtonExpanded", false)
        } else {
            false
        }
        val closeButton: Button = view.findViewById(R.id.closeButton)
        closeButton.visibility = if (showClose) View.VISIBLE else View.GONE

        // ドラッグハンドルの設定
        val dragHandle: View = view.findViewById(R.id.dragHandle)
        val dragHandleParams = dragHandle.layoutParams as FrameLayout.LayoutParams
        if (expanded) {
            // 展開時は上部のヘッダーの左側（カウンタとボタン以外のエリア）をドラッグ可能にする
            val floatWidth = prefs.getInt("floatWidth", (300 * density).toInt())
            val displayTaskCount = prefs.getInt("displayTaskCount", 1)
            val showCheckedToggle = prefs.getBoolean("showCheckedToggle", false)
            
            // WebView側 (index.html) の計算と一致させる
            // let buttonsWidth = 42 + 8; // Home + Padding
            // if (showCheckedToggle) buttonsWidth += 42;
            // if (scrollButtonType === 'both') buttonsWidth += 84;
            // else if (scrollButtonType === 'down' || scrollButtonType === 'up') buttonsWidth += 42;
            // const counterWidth = (displayTaskCount > 1) ? 50 : 35;
            // buttonsWidth += counterWidth;
            
            val scrollButtonType = prefs.getString("scrollButtonType", "both") ?: "both"
            var buttonsReservedWidthDp = 42 + 8 // Home + Padding
            if (showCheckedToggle) buttonsReservedWidthDp += 42
            when (scrollButtonType) {
                "both" -> buttonsReservedWidthDp += 84
                "down", "up" -> buttonsReservedWidthDp += 42
            }
            val counterWidth = if (displayTaskCount > 1) 50 else 35
            buttonsReservedWidthDp += counterWidth
            
            // 閉じるボタンがある場合
            val extraReserved = if (showClose) 40 else 8
            
            // ピクセル単位の幅から、ボタンエリア（dp * density）を引いて、スケールをかける
            val reservedPx = (buttonsReservedWidthDp + extraReserved) * density
            dragHandleParams.width = ((floatWidth - reservedPx) * scale).toInt().coerceAtLeast(0)
            dragHandleParams.height = (32 * density * scale).toInt()
            dragHandleParams.gravity = Gravity.TOP or Gravity.START
        } else {
            // 縮小時は全体をドラッグ可能にする
            dragHandleParams.width = ViewGroup.LayoutParams.MATCH_PARENT
            dragHandleParams.height = ViewGroup.LayoutParams.MATCH_PARENT
            dragHandleParams.gravity = Gravity.NO_GRAVITY
        }
        dragHandle.layoutParams = dragHandleParams
        dragHandle.visibility = View.VISIBLE

        // 画面境界内に収める
        val displayMetrics = resources.displayMetrics
        val screenWidth = displayMetrics.widthPixels
        val screenHeight = displayMetrics.heightPixels

        params.x = params.x.coerceIn(0, (screenWidth - params.width).coerceAtLeast(0))
        params.y = params.y.coerceIn(0, (screenHeight - params.height).coerceAtLeast(0))

        windowManager.updateViewLayout(view, params)
    }

    @SuppressLint("SetJavaScriptEnabled", "InflateParams")
    private fun showFloatingWindow() {
        AppLogger.log(this, "showFloatingWindow called")
        if (!Settings.canDrawOverlays(this)) {
            AppLogger.log(this, "showFloatingWindow: No overlay permission")
            return
        }

        val prefs = getSharedPreferences("prefs", MODE_PRIVATE)
        val isAppInForeground = prefs.getBoolean("isAppInForeground", false)
        if (isAppInForeground && !isSettingsMode) {
            hideFloatingWindow()
            return
        }

        if (floatingView != null) {
            floatingView?.visibility = View.VISIBLE
            return
        }
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        
        val inflater = getSystemService(LAYOUT_INFLATER_SERVICE) as LayoutInflater
        // floating_layout.xml をインフレート
        floatingView = inflater.inflate(R.layout.floating_layout, null)

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT,
        )

        params.gravity = Gravity.TOP or Gravity.START
        params.x = 100
        params.y = 100

        applySettingsToParams(params)

        // 閉じるボタンの表示切り替え（初期状態・常に非表示）
        val closeButton: Button = floatingView!!.findViewById(R.id.closeButton)
        closeButton.visibility = View.GONE

        // WebViewの設定
        val webView: WebView = floatingView!!.findViewById(R.id.floatingWebView)
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.setBackgroundColor(0) // 透明に設定

        webView.addJavascriptInterface(FloatingWebAppInterface(), "Android")

        webView.loadUrl("file:///android_asset/index.html?mode=floating&expanded=$isExpanded")

        // 閉じるボタンの設定

        // 閉じるボタンの設定
        closeButton.setOnClickListener {
            val prefs = getSharedPreferences("prefs", MODE_PRIVATE)
            val intervalMinutes = prefs.getInt("recheckInterval", 0)
            
            if (intervalMinutes > 0) {
                AlarmScheduler.scheduleIntervalAlarm(this, intervalMinutes)
            }

            removeFloatingWindow()
            stopSelf()
        }

        // ドラッグ移動の設定
        val dragHandle: View = floatingView!!.findViewById(R.id.dragHandle)
        val touchSlop = ViewConfiguration.get(this).scaledTouchSlop
        var isActuallyDragging = false
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f

        val touchListener = View.OnTouchListener { v, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    isActuallyDragging = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - initialTouchX
                    val dy = event.rawY - initialTouchY
                    
                    val prefs = getSharedPreferences("prefs", MODE_PRIVATE)
                    val allowDrag = if (isExpanded) prefs.getBoolean("allowDrag", true) else prefs.getBoolean("allowDragCollapsed", true)

                    if (!isActuallyDragging && (hypot(dx.toDouble(), dy.toDouble()) > touchSlop)) {
                        if (allowDrag) {
                            isActuallyDragging = true
                            webView.evaluateJavascript("setIsDragging(true);", null)
                        } else {
                            // ドラッグ禁止時は、微小移動でもドラッグ中とみなさないことでタップ操作を維持する
                        }
                    }

                    if (isActuallyDragging && allowDrag) {
                        val newX = initialX + dx.toInt()
                        val newY = initialY + dy.toInt()

                        // 画面境界内に収める
                        val displayMetrics = resources.displayMetrics
                        val screenWidth = displayMetrics.widthPixels
                        val screenHeight = displayMetrics.heightPixels

                        params.x = newX.coerceIn(0, (screenWidth - params.width).coerceAtLeast(0))
                        params.y = newY.coerceIn(0, (screenHeight - params.height).coerceAtLeast(0))

                        windowManager.updateViewLayout(floatingView, params)
                        
                        // 位置を保存
                        val prefs = getSharedPreferences("prefs", MODE_PRIVATE)
                        val xKey = if (isExpanded) "floatExpandedX" else "floatCollapsedX"
                        val yKey = if (isExpanded) "floatExpandedY" else "floatCollapsedY"
                        prefs.edit().apply {
                            putInt(xKey, params.x)
                            putInt(yKey, params.y)
                            // 互換性のための古いキーも更新しておく
                            putInt("floatX", params.x)
                            putInt("floatY", params.y)
                            apply()
                        }

                        // MainActivityへ位置更新を通知
                        val intent = Intent("com.example.floatingtask.POSITION_CHANGED")
                        intent.setPackage(packageName)
                        intent.putExtra("x", params.x)
                        intent.putExtra("y", params.y)
                        intent.putExtra("isExpanded", isExpanded)
                        sendBroadcast(intent)
                    }
                    true
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    if ((event.action == MotionEvent.ACTION_UP) && !isActuallyDragging) {
                        // タップ判定: 展開/縮小を切り替え
                        v.performClick()
                        val nextExpanded = !isExpanded
                        updateWindowSize(expanded = nextExpanded)
                        webView.evaluateJavascript("toggleFloatingExpand($nextExpanded);", null)
                    }

                    // ドラッグ終了を通知（タップ判定との競合を避けるため少し遅延させる）
                    val handler = Handler(Looper.getMainLooper())
                    handler.postDelayed(
                        {
                            webView.evaluateJavascript("setIsDragging(false);", null)
                        },
                        150,
                    )
                    true
                }
                else -> false
            }
        }

        dragHandle.setOnTouchListener(touchListener)

        windowManager.addView(floatingView, params)

        // 初期状態の表示を反映
        updateWindowSize(expanded = isExpanded)
    }

    override fun onDestroy() {
        AppLogger.log(this, "FloatingWindowService onDestroy")
        super.onDestroy()
        unregisterReceiver(dataChangeReceiver)
        floatingView?.let {
            windowManager.removeView(it)
        }
    }

    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        AppLogger.log(this, "FloatingWindowService onTrimMemory: level=$level")
        AppLogger.logMemoryStatus(this, "onTrimMemory level=$level", "FloatingWindow")
    }

    override fun onLowMemory() {
        super.onLowMemory()
        AppLogger.log(this, "FloatingWindowService onLowMemory")
        AppLogger.logMemoryStatus(this, "onLowMemory", "FloatingWindow")
    }

    /**
     * WebViewから呼び出されるインターフェースクラス。
     * 匿名オブジェクトだとProGuard/R8やリフレクションの影響でメソッドが見つからない場合があるため、
     * 明示的なクラスとして定義します。
     */
    private inner class FloatingWebAppInterface {
        @JavascriptInterface
        fun showDurationPicker(h: String, m: String, s: String) {
            val handler = android.os.Handler(android.os.Looper.getMainLooper())
            handler.post {
                val inflater = LayoutInflater.from(this@FloatingWindowService)
                val view = inflater.inflate(R.layout.dialog_duration_picker, null)
                val editH = view.findViewById<EditText>(R.id.editHours)
                val editM = view.findViewById<EditText>(R.id.editMinutes)
                val editS = view.findViewById<EditText>(R.id.editSeconds)

                editH.setText(h)
                editM.setText(m)
                editS.setText(s)

                val dialog = androidx.appcompat.app.AlertDialog.Builder(this@FloatingWindowService)
                    .setTitle(R.string.timer_duration_title)
                    .setView(view)
                    .setPositiveButton(R.string.btn_done) { dialog, which ->
                        val resH = editH.text.toString()
                        val resM = editM.text.toString()
                        val resS = editS.text.toString()
                        
                        val fView = floatingView ?: return@setPositiveButton
                        val webView: android.webkit.WebView = fView.findViewById(R.id.floatingWebView)
                        webView.evaluateJavascript("onDurationSelected('$resH', '$resM', '$resS');", null)
                    }
                    .setNegativeButton(R.string.cancel, null)
                    .setOnDismissListener {
                        val fView = floatingView ?: return@setOnDismissListener
                        val webView: android.webkit.WebView = fView.findViewById(R.id.floatingWebView)
                        webView.evaluateJavascript("onDurationPickerDismissed();", null)
                    }
                    .create()
                
                // サービスから表示するためにオーバーレイタイプを指定
                dialog.window?.setType(WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY)
                dialog.show()
            }
        }

        @JavascriptInterface
        fun updateFloatingColors(bgColor: String, textColor: String) {
            val handler = Handler(Looper.getMainLooper())
            handler.post {
                val view = floatingView ?: return@post
                try {
                    val color = android.graphics.Color.parseColor(bgColor)
                    val tColor = android.graphics.Color.parseColor(textColor)
                    
                    val background = view.background
                    if (background is android.graphics.drawable.GradientDrawable) {
                        background.setColor(color)
                    }
                    
                    // 閉じるボタンの文字色も同期（現在は非表示設定ですが、念のため）
                    val closeButton: android.widget.Button = view.findViewById(R.id.closeButton)
                    closeButton.setTextColor(tColor)
                } catch (e: Exception) {
                    AppLogger.log(this@FloatingWindowService, "Error updating colors: ${e.message}")
                }
            }
        }

        @JavascriptInterface
        fun openMainActivity() {
            AppLogger.log(this@FloatingWindowService, "JS: openMainActivity called")
            val handler = Handler(Looper.getMainLooper())
            handler.post {
                try {
                    // ランチャーから起動した際と同じ挙動にするため、getLaunchIntentForPackage を使用
                    val intent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        // 既存のタスクを最前面に持ってくる
                        addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                        // シングルインスタンス的に動作させる
                        addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
                    }
                    if (intent != null) {
                        startActivity(intent)
                    } else {
                        // 万が一取得できない場合は従来の明示的Intentを使用
                        val explicitIntent = Intent(this@FloatingWindowService, MainActivity::class.java).apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                        }
                        startActivity(explicitIntent)
                    }
                } catch (e: Exception) {
                    AppLogger.log(this@FloatingWindowService, "Error opening MainActivity: ${e.message}")
                }
            }
        }

        @JavascriptInterface
        fun updatePendingTaskCount(count: Int) {
            val prefs = getSharedPreferences("prefs", MODE_PRIVATE)
            val showWhenEmpty = prefs.getBoolean("showWhenEmpty", false)
            
            if (count == 0 && !showWhenEmpty) {
                val handler = Handler(Looper.getMainLooper())
                handler.post { hideFloatingWindow() }
            } else {
                val handler = Handler(Looper.getMainLooper())
                handler.post {
                    val view = floatingView
                    if (view != null && view.visibility != View.VISIBLE) {
                        val isAppInForeground = prefs.getBoolean("isAppInForeground", false)
                        if (!isAppInForeground || isSettingsMode) {
                            view.visibility = View.VISIBLE
                        }
                    }
                }
            }
        }

        @JavascriptInterface
        fun onDataChanged() {
            // MainActivityに通知
            val intent = Intent("com.example.floatingtask.DATA_CHANGED")
            intent.setPackage(packageName)
            sendBroadcast(intent)
        }

        @JavascriptInterface
        fun toggleExpand(expanded: Boolean) {
            val handler = Handler(Looper.getMainLooper())
            handler.post {
                isExpanded = expanded
                updateWindowSize(expanded)
            }
        }

        @JavascriptInterface
        fun requestHeight(heightDp: Int) {
            val handler = Handler(Looper.getMainLooper())
            handler.post {
                val view = floatingView ?: return@post
                val params = view.layoutParams as WindowManager.LayoutParams
                val prefs = getSharedPreferences("prefs", MODE_PRIVATE)
                val scale = if (isExpanded) {
                    prefs.getFloat("floatExpandedScale", 1.0f)
                } else {
                    prefs.getFloat("floatCollapsedScale", 1.0f)
                }
                val density = resources.displayMetrics.density

                params.height = (heightDp * density * scale).toInt()
                windowManager.updateViewLayout(view, params)
            }
        }

        @JavascriptInterface
        fun setFocusable(focusable: Boolean) {
            val handler = Handler(Looper.getMainLooper())
            handler.post {
                val view = floatingView ?: return@post
                val params = view.layoutParams as WindowManager.LayoutParams
                val webView: WebView = view.findViewById(R.id.floatingWebView)
                
                if (focusable) {
                    // FLAG_NOT_FOCUSABLE を除外して入力を可能にする
                    params.flags = params.flags and WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE.inv()
                    webView.requestFocus()
                } else {
                    // FLAG_NOT_FOCUSABLE を追加して背後の操作を優先する
                    params.flags = params.flags or WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                }
                windowManager.updateViewLayout(view, params)
            }
        }

        @JavascriptInterface
        fun showKeyboard() {
            val handler = Handler(Looper.getMainLooper())
            handler.post {
                val view = floatingView ?: return@post
                val webView: WebView = view.findViewById(R.id.floatingWebView)
                val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager
                imm.showSoftInput(webView, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT)
            }
        }

        @JavascriptInterface
        fun playMelody(melody: String) {
            MelodyPlayer.play(this@FloatingWindowService, melody)
        }

        @JavascriptInterface
        fun stopMelody() {
            MelodyPlayer.stop()
        }
    }
}

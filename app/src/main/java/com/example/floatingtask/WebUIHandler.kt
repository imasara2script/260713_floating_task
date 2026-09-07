package com.example.floatingtask

import android.app.Activity
import android.view.LayoutInflater
import android.widget.EditText
import androidx.appcompat.app.AlertDialog

class WebUIHandler(
    private val activity: Activity,
    private val listener: UIActionListener
) {

    interface UIActionListener {
        fun onShowKeyboard()
        fun onOpenHistory()
        fun onDurationSelected(h: String, m: String, s: String)
        fun onDurationPickerDismissed()
        fun onNativeConfirmResult(callbackId: String, result: Boolean)
    }

    fun showKeyboard() {
        listener.onShowKeyboard()
    }

    fun openHistory() {
        listener.onOpenHistory()
    }

    fun showDurationPicker(h: String, m: String, s: String) {
        activity.runOnUiThread {
            val inflater = LayoutInflater.from(activity)
            val view = inflater.inflate(R.layout.dialog_duration_picker, null)
            val editH = view.findViewById<EditText>(R.id.editHours)
            val editM = view.findViewById<EditText>(R.id.editMinutes)
            val editS = view.findViewById<EditText>(R.id.editSeconds)

            editH.setText(h)
            editM.setText(m)
            editS.setText(s)

            AlertDialog.Builder(activity)
                .setTitle(R.string.timer_duration_title)
                .setView(view)
                .setPositiveButton(R.string.btn_done) { _, _ ->
                    listener.onDurationSelected(
                        editH.text.toString(),
                        editM.text.toString(),
                        editS.text.toString()
                    )
                }
                .setNegativeButton(R.string.cancel, null)
                .setOnDismissListener {
                    listener.onDurationPickerDismissed()
                }
                .show()
        }
    }

    fun showConfirmDialog(title: String, message: String, callbackId: String) {
        activity.runOnUiThread {
            AlertDialog.Builder(activity)
                .setTitle(title)
                .setMessage(message)
                .setPositiveButton(android.R.string.ok) { _, _ ->
                    listener.onNativeConfirmResult(callbackId, true)
                }
                .setNegativeButton(android.R.string.cancel) { _, _ ->
                    listener.onNativeConfirmResult(callbackId, false)
                }
                .setOnCancelListener {
                    listener.onNativeConfirmResult(callbackId, false)
                }
                .show()
        }
    }
}

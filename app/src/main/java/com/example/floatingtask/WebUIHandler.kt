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
        fun onPeriodSelected(y: String, m: String, w: String, d: String)
        fun onPeriodPickerDismissed()
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

            editH.setText(if (h == "0") "" else h)
            editM.setText(if (m == "0") "" else m)
            editS.setText(if (s == "0") "" else s)

            AlertDialog.Builder(activity)
                .setTitle(R.string.timer_duration_title)
                .setView(view)
                .setPositiveButton(R.string.btn_done) { _, _ ->
                    listener.onDurationSelected(
                        editH.text.toString().ifEmpty { "0" },
                        editM.text.toString().ifEmpty { "0" },
                        editS.text.toString().ifEmpty { "0" }
                    )
                }
                .setNegativeButton(R.string.cancel, null)
                .setOnDismissListener {
                    listener.onDurationPickerDismissed()
                }
                .show()
        }
    }

    fun showPeriodPicker(y: String, m: String, w: String, d: String) {
        activity.runOnUiThread {
            val inflater = LayoutInflater.from(activity)
            val view = inflater.inflate(R.layout.dialog_period_picker, null)
            val editY = view.findViewById<EditText>(R.id.editYears)
            val editM = view.findViewById<EditText>(R.id.editMonths)
            val editW = view.findViewById<EditText>(R.id.editWeeks)
            val editD = view.findViewById<EditText>(R.id.editDays)

            editY.setText(if (y == "0") "" else y)
            editM.setText(if (m == "0") "" else m)
            editW.setText(if (w == "0") "" else w)
            editD.setText(if (d == "0") "" else d)

            AlertDialog.Builder(activity)
                .setTitle(R.string.timer_period_title)
                .setView(view)
                .setPositiveButton(R.string.btn_done) { _, _ ->
                    listener.onPeriodSelected(
                        editY.text.toString().ifEmpty { "0" },
                        editM.text.toString().ifEmpty { "0" },
                        editW.text.toString().ifEmpty { "0" },
                        editD.text.toString().ifEmpty { "0" }
                    )
                }
                .setNegativeButton(R.string.cancel, null)
                .setOnDismissListener {
                    listener.onPeriodPickerDismissed()
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

package com.islamiyoldas.app;

import android.app.NotificationManager;
import android.appwidget.AppWidgetManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private BroadcastReceiver screenUnlockReceiver;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Register a receiver that fires when the user unlocks the screen.
        // This clears all delivered notifications, which stops any playing
        // ezan sound immediately on unlock.
        screenUnlockReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (Intent.ACTION_USER_PRESENT.equals(intent.getAction())) {
                    NotificationManager manager = (NotificationManager) context
                            .getSystemService(Context.NOTIFICATION_SERVICE);
                    if (manager != null) {
                        manager.cancelAll();
                    }
                }
            }
        };

        IntentFilter filter = new IntentFilter(Intent.ACTION_USER_PRESENT);
        // Android 13+ requires explicit exported flag for dynamic receivers
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(screenUnlockReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(screenUnlockReceiver, filter);
        }
    }

    @Override
    public void     onResume() {
        super.onResume();
        // Force refresh all prayer time widgets when app comes to foreground
        // This ensures language changes, new prayer data, etc. are reflected immediately
        refreshWidgets();
    }

    @Override
    public void onPause() {
        super.onPause();
        // Force refresh widgets when app goes to background
        // Added 500ms delay to allow Capacitor's async Preferences.set to finish writing to SharedPreferences
        // before we read from them and update the widget.
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            refreshWidgets();
        }, 500);
    }

    private void refreshWidgets() {
        try {
            AppWidgetManager manager = AppWidgetManager.getInstance(this);

            // Refresh prayer time widgets
            ComponentName prayerWidget = new ComponentName(this, PrayerTimesWidgetProvider.class);
            int[] prayerIds = manager.getAppWidgetIds(prayerWidget);
            if (prayerIds != null && prayerIds.length > 0) {
                for (int id : prayerIds) {
                    PrayerTimesWidgetProvider.updateAppWidget(this, manager, id);
                }
            }

            // Refresh dhikr widgets
            ComponentName dhikrWidget = new ComponentName(this, DhikrWidgetProvider.class);
            int[] dhikrIds = manager.getAppWidgetIds(dhikrWidget);
            if (dhikrIds != null && dhikrIds.length > 0) {
                for (int id : dhikrIds) {
                    DhikrWidgetProvider.updateWidget(this, manager, id);
                }
            }

            // Refresh verse widgets
            ComponentName verseWidget = new ComponentName(this, VerseWidgetProvider.class);
            int[] verseIds = manager.getAppWidgetIds(verseWidget);
            if (verseIds != null && verseIds.length > 0) {
                for (int id : verseIds) {
                    VerseWidgetProvider.updateWidget(this, manager, id);
                }
            }

            // Refresh hourly verse widgets
            ComponentName hourlyVerseWidget = new ComponentName(this, HourlyVerseWidgetProvider.class);
            int[] hourlyVerseIds = manager.getAppWidgetIds(hourlyVerseWidget);
            if (hourlyVerseIds != null && hourlyVerseIds.length > 0) {
                for (int id : hourlyVerseIds) {
                    HourlyVerseWidgetProvider.updateWidget(this, manager, id);
                }
            }

            // Refresh motivation widgets
            ComponentName motivationWidget = new ComponentName(this, MotivationWidgetProvider.class);
            int[] motivationIds = manager.getAppWidgetIds(motivationWidget);
            if (motivationIds != null && motivationIds.length > 0) {
                for (int id : motivationIds) {
                    MotivationWidgetProvider.updateWidget(this, manager, id);
                }
            }

            // Refresh esma widgets
            ComponentName esmaWidget = new ComponentName(this, EsmaWidgetProvider.class);
            int[] esmaIds = manager.getAppWidgetIds(esmaWidget);
            if (esmaIds != null && esmaIds.length > 0) {
                for (int id : esmaIds) {
                    EsmaWidgetProvider.updateWidget(this, manager, id);
                }
            }

            // Refresh hourly esma widgets
            ComponentName hourlyEsmaWidget = new ComponentName(this, HourlyEsmaWidgetProvider.class);
            int[] hourlyEsmaIds = manager.getAppWidgetIds(hourlyEsmaWidget);
            if (hourlyEsmaIds != null && hourlyEsmaIds.length > 0) {
                for (int id : hourlyEsmaIds) {
                    HourlyEsmaWidgetProvider.updateWidget(this, manager, id);
                }
            }
        } catch (Exception e) {
            // Widget refresh is non-critical, don't crash
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (screenUnlockReceiver != null) {
            unregisterReceiver(screenUnlockReceiver);
            screenUnlockReceiver = null;
        }
    }
}

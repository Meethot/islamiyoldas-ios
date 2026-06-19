package com.islamiyoldas.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.SystemClock;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.Locale;

public class PrayerTimesWidgetProvider extends AppWidgetProvider {

    private static final String[] EMOJIS = { "🌙", "☀️", "⛅", "🌆", "✨" };

    // Colors
    private static final int COLOR_GOLD = 0xFFD4AF37;
    private static final int COLOR_WHITE = 0xFFFFFFFF;
    private static final int COLOR_INACTIVE_TEXT = 0x80FFFFFF;
    private static final int COLOR_ACTIVE_LABEL = 0xFFFFFFFF;
    private static final int COLOR_NEXT_TIME = 0x88FFFFFF;

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_prayer_times);

        try {
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String jsonData = prefs.getString("widget_prayer_data_bridge", null);

            if (jsonData != null) {
                JSONObject data = new JSONObject(jsonData);
                String city = data.optString("city", "Bilinmiyor");
                views.setTextViewText(R.id.widget_city, "📍 " + city.toUpperCase(Locale.getDefault()));

                JSONArray prayers = data.optJSONArray("prayers");
                if (prayers != null) {
                    String[] targetIds = { "fajr", "dhuhr", "asr", "maghrib", "isha" };
                    int[] rowIds = { R.id.row_imsak, R.id.row_ogle, R.id.row_ikindi, R.id.row_aksam, R.id.row_yatsi };
                    int[] timeIds = { R.id.time_imsak, R.id.time_ogle, R.id.time_ikindi, R.id.time_aksam, R.id.time_yatsi };
                    int[] labelIds = { R.id.label_imsak, R.id.label_ogle, R.id.label_ikindi, R.id.label_aksam, R.id.label_yatsi };

                    String[] names = new String[5];
                    String[] times = new String[5];

                    for (int i = 0; i < prayers.length(); i++) {
                        JSONObject p = prayers.getJSONObject(i);
                        String id = p.optString("id", "");
                        for (int j = 0; j < targetIds.length; j++) {
                            if (targetIds[j].equals(id)) {
                                names[j] = p.optString("name", targetIds[j]);
                                times[j] = p.optString("time", "--:--");
                                break;
                            }
                        }
                    }

                    int nextIdx = findNextPrayerFromTimes(times);

                    for (int i = 0; i < 5; i++) {
                        String name = names[i] != null ? names[i] : "--";
                        String time = times[i] != null ? times[i] : "--:--";

                        views.setTextViewText(labelIds[i], EMOJIS[i] + "  " + name);
                        views.setTextViewText(timeIds[i], time);

                        if (i == nextIdx) {
                            // Active prayer: gold accent highlight
                            views.setInt(rowIds[i], "setBackgroundResource", R.drawable.widget_prayer_highlight);
                            views.setTextColor(labelIds[i], COLOR_ACTIVE_LABEL);
                            views.setTextColor(timeIds[i], COLOR_GOLD);

                            // Left panel
                            views.setTextViewText(R.id.widget_next_name, name);
                            views.setTextViewText(R.id.widget_next_time, time);

                            // Live countdown
                            setupCountdown(views, time);
                        } else {
                            // Inactive: subtle
                            views.setInt(rowIds[i], "setBackgroundResource", R.drawable.widget_prayer_normal);
                            views.setTextColor(labelIds[i], COLOR_INACTIVE_TEXT);
                            views.setTextColor(timeIds[i], COLOR_INACTIVE_TEXT);
                        }
                    }
                }
            } else {
                views.setTextViewText(R.id.widget_city, "📍 Uygulamayı açın");
                views.setTextViewText(R.id.widget_next_name, "---");
                views.setTextViewText(R.id.widget_next_time, "--:--");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Tap to open app
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static void setupCountdown(RemoteViews views, String nextTime) {
        try {
            if (nextTime == null || !nextTime.contains(":")) return;

            String[] parts = nextTime.split(":");
            int targetHour = Integer.parseInt(parts[0]);
            int targetMin = Integer.parseInt(parts[1]);

            Calendar now = Calendar.getInstance();
            Calendar target = (Calendar) now.clone();
            target.set(Calendar.HOUR_OF_DAY, targetHour);
            target.set(Calendar.MINUTE, targetMin);
            target.set(Calendar.SECOND, 0);

            if (target.before(now)) {
                target.add(Calendar.DAY_OF_MONTH, 1);
            }

            long diffMs = target.getTimeInMillis() - now.getTimeInMillis();
            long base = SystemClock.elapsedRealtime() + diffMs;

            views.setChronometer(R.id.widget_countdown, base, "⏱ %s", true);
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                views.setChronometerCountDown(R.id.widget_countdown, true);
            }
        } catch (Exception e) {
            views.setTextViewText(R.id.widget_countdown, "⏱ --:--");
        }
    }

    private static int findNextPrayerFromTimes(String[] times) {
        try {
            Calendar now = Calendar.getInstance();
            int currentMinutes = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);

            for (int i = 0; i < times.length; i++) {
                if (times[i] != null && times[i].contains(":")) {
                    String[] parts = times[i].split(":");
                    int prayerMinutes = Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
                    if (prayerMinutes > currentMinutes) {
                        return i;
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0;
    }
}

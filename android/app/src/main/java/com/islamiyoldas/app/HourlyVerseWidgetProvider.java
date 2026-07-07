package com.islamiyoldas.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;

/**
 * Saatlik Ayet widget'ı (iOS HourlyVerseWidget karşılığı).
 * Saat başlarında AlarmManager ile, ayrıca 30 dk'lık updatePeriodMillis ile yenilenir.
 */
public class HourlyVerseWidgetProvider extends AppWidgetProvider {

    static final String ACTION_HOURLY_TICK = "com.islamiyoldas.app.HOURLY_VERSE_TICK";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
        WidgetUiHelper.scheduleNextHourUpdate(context, HourlyVerseWidgetProvider.class, ACTION_HOURLY_TICK);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_HOURLY_TICK.equals(intent.getAction())) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, HourlyVerseWidgetProvider.class));
            if (ids != null && ids.length > 0) {
                for (int id : ids) {
                    updateWidget(context, manager, id);
                }
                WidgetUiHelper.scheduleNextHourUpdate(context, HourlyVerseWidgetProvider.class, ACTION_HOURLY_TICK);
            }
        }
    }

    @Override
    public void onDisabled(Context context) {
        super.onDisabled(context);
        WidgetUiHelper.cancelHourlyUpdate(context, HourlyVerseWidgetProvider.class, ACTION_HOURLY_TICK);
    }

    static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        WidgetUiHelper.updateTextWidget(context, appWidgetManager, appWidgetId,
                "SAATLİK AYET", R.drawable.ic_widget_clock, WidgetData.hourlyVerse(context));
    }
}

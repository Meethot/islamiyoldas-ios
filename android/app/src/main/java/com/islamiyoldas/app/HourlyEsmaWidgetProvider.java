package com.islamiyoldas.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;

/**
 * Saatlik Esma widget'ı (iOS HourlyEsmaWidget karşılığı).
 * Saat başlarında AlarmManager ile, ayrıca 30 dk'lık updatePeriodMillis ile yenilenir.
 */
public class HourlyEsmaWidgetProvider extends AppWidgetProvider {

    static final String ACTION_HOURLY_TICK = "com.islamiyoldas.app.HOURLY_ESMA_TICK";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
        WidgetUiHelper.scheduleNextHourUpdate(context, HourlyEsmaWidgetProvider.class, ACTION_HOURLY_TICK);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_HOURLY_TICK.equals(intent.getAction())) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, HourlyEsmaWidgetProvider.class));
            if (ids != null && ids.length > 0) {
                for (int id : ids) {
                    updateWidget(context, manager, id);
                }
                WidgetUiHelper.scheduleNextHourUpdate(context, HourlyEsmaWidgetProvider.class, ACTION_HOURLY_TICK);
            }
        }
    }

    @Override
    public void onDisabled(Context context) {
        super.onDisabled(context);
        WidgetUiHelper.cancelHourlyUpdate(context, HourlyEsmaWidgetProvider.class, ACTION_HOURLY_TICK);
    }

    static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        WidgetUiHelper.updateEsmaWidget(context, appWidgetManager, appWidgetId,
                "SAATLİK ESMA", R.drawable.ic_widget_clock, WidgetData.hourlyEsma());
    }
}

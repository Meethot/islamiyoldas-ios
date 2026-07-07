package com.islamiyoldas.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

/** Günün Motivasyonu widget'ı (iOS MotivationWidget karşılığı). Gece yarısı içerik değişir. */
public class MotivationWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        WidgetUiHelper.updateTextWidget(context, appWidgetManager, appWidgetId,
                "GÜNÜN MOTİVASYONU", R.drawable.ic_widget_sun, WidgetData.dailyMotivation(context));
    }
}

package com.islamiyoldas.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

/** Günün Esması widget'ı (iOS EsmaWidget karşılığı). Gece yarısı içerik değişir. */
public class EsmaWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        WidgetUiHelper.updateEsmaWidget(context, appWidgetManager, appWidgetId,
                "GÜNÜN ESMASI", R.drawable.ic_widget_star, WidgetData.dailyEsma());
    }
}

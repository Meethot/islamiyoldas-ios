package com.islamiyoldas.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

/** Günün Ayeti widget'ı (iOS VerseWidget karşılığı). Gece yarısı içerik değişir. */
public class VerseWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        WidgetUiHelper.updateTextWidget(context, appWidgetManager, appWidgetId,
                "GÜNÜN AYETİ", R.drawable.ic_widget_sparkle, WidgetData.dailyVerse(context));
    }
}

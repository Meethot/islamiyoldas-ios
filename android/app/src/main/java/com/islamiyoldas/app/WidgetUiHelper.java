package com.islamiyoldas.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;
import android.widget.RemoteViews;

import java.util.Calendar;

/**
 * Ayet / Esma / Motivasyon widget'ları için ortak çizim ve güncelleme yardımcıları.
 * Dekor bitmap'i iOS medium widget'lardaki GeometricPatternOverlay + MihrabArchShape +
 * ışık kürelerinin karşılığıdır.
 */
final class WidgetUiHelper {

    private WidgetUiHelper() {}

    // Dekor bitmap boyutu (~320x150dp @2x, fitXY ile ölçeklenir)
    private static final int DECOR_W = 640;
    private static final int DECOR_H = 300;
    private static final float S = 2f; // dp → px ölçeği

    /** Ayet / Motivasyon tarzı (dikey, ortalanmış metin) widget'ı günceller. */
    static void updateTextWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId,
                                 String header, int iconRes, String[] item) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_verse);

        views.setTextViewText(R.id.widget_verse_header, header);
        views.setImageViewResource(R.id.widget_verse_icon, iconRes);
        views.setTextViewText(R.id.widget_verse_text, "“" + item[0] + "”");
        views.setTextViewText(R.id.widget_verse_source,
                "— " + WidgetData.uppercaseSource(context, item[1]));
        views.setImageViewBitmap(R.id.widget_verse_decor, renderDecor(false));

        attachOpenAppIntent(context, views, R.id.widget_verse_root);
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    /** Esma tarzı (yatay iki panel) widget'ı günceller. esma = {numara, arapça, okunuş, anlam}. */
    static void updateEsmaWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId,
                                 String header, int iconRes, String[] esma) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_esma);

        views.setTextViewText(R.id.widget_esma_header, header);
        views.setImageViewResource(R.id.widget_esma_icon, iconRes);
        views.setTextViewText(R.id.widget_esma_arabic, esma[1]);
        views.setTextViewText(R.id.widget_esma_number, "#" + esma[0]);
        views.setTextViewText(R.id.widget_esma_translit, esma[2]);
        views.setTextViewText(R.id.widget_esma_meaning, esma[3]);
        views.setImageViewBitmap(R.id.widget_esma_decor, renderDecor(true));

        attachOpenAppIntent(context, views, R.id.widget_esma_root);
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    /** Widget'a dokununca uygulamayı açar. */
    private static void attachOpenAppIntent(Context context, RemoteViews views, int rootId) {
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(rootId, pendingIntent);
    }

    // MARK: - Saatlik yenileme alarmı (Saatlik Ayet / Saatlik Esma)

    /** Bir sonraki saat başında provider'a broadcast atacak (inexact) alarmı kurar. */
    static void scheduleNextHourUpdate(Context context, Class<?> providerClass, String action) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Calendar next = Calendar.getInstance();
            next.add(Calendar.HOUR_OF_DAY, 1);
            next.set(Calendar.MINUTE, 0);
            next.set(Calendar.SECOND, 5);
            next.set(Calendar.MILLISECOND, 0);

            alarmManager.setAndAllowWhileIdle(
                    AlarmManager.RTC,
                    next.getTimeInMillis(),
                    hourlyPendingIntent(context, providerClass, action)
            );
        } catch (Exception e) {
            // Alarm kurulamazsa updatePeriodMillis (30 dk) yine de içeriği tazeler
        }
    }

    static void cancelHourlyUpdate(Context context, Class<?> providerClass, String action) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager != null) {
                alarmManager.cancel(hourlyPendingIntent(context, providerClass, action));
            }
        } catch (Exception e) { /* ignore */ }
    }

    private static PendingIntent hourlyPendingIntent(Context context, Class<?> providerClass, String action) {
        Intent intent = new Intent(context, providerClass);
        intent.setAction(action);
        return PendingIntent.getBroadcast(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    // MARK: - Dekor bitmap (geometrik desen + mihrap kemeri + ışık küreleri)

    static Bitmap renderDecor(boolean esmaVariant) {
        Bitmap bitmap = Bitmap.createBitmap(DECOR_W, DECOR_H, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);

        // Köşeleri arkaplanla (22dp radius) hizalı kırp
        Path clip = new Path();
        clip.addRoundRect(new RectF(0, 0, DECOR_W, DECOR_H), 22 * S, 22 * S, Path.Direction.CW);
        canvas.clipPath(clip);

        float cx = DECOR_W / 2f;
        float cy = DECOR_H / 2f;

        // 1) Geometrik yıldız deseni (iOS: beyaz %3, 0.3pt çizgi)
        Paint starPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        starPaint.setStyle(Paint.Style.STROKE);
        starPaint.setStrokeWidth(0.8f);
        starPaint.setColor(Color.argb(8, 255, 255, 255));

        float spacing = 24 * S;
        float starSize = 6 * S;
        int cols = (int) (DECOR_W / spacing) + 2;
        int rows = (int) (DECOR_H / spacing) + 2;
        Path starPath = new Path();
        for (int row = 0; row < rows; row++) {
            for (int col = 0; col < cols; col++) {
                float x = col * spacing;
                float y = row * spacing;
                for (int i = 0; i < 8; i++) {
                    double angle = i * Math.PI / 4;
                    float px = x + (float) Math.cos(angle) * starSize;
                    float py = y + (float) Math.sin(angle) * starSize;
                    if (i == 0) starPath.moveTo(px, py); else starPath.lineTo(px, py);
                }
                starPath.close();
            }
        }
        canvas.drawPath(starPath, starPaint);

        // 2) Mihrap kemeri (iOS: beyaz %3, 1.2pt çizgi)
        float archW = (esmaVariant ? 120 : 140) * S;
        float archH = (esmaVariant ? 160 : 180) * S;
        float archOffsetY = (esmaVariant ? 30 : 20) * S;
        float left = cx - archW / 2f;
        float top = cy + archOffsetY - archH / 2f;
        float archSpring = archH * 0.45f; // kemer başlangıç yüksekliği

        Path arch = new Path();
        arch.moveTo(left, top + archH);
        arch.lineTo(left, top + archSpring);
        arch.quadTo(left, top + archSpring * 0.2f, left + archW / 2f, top);
        arch.quadTo(left + archW, top + archSpring * 0.2f, left + archW, top + archSpring);
        arch.lineTo(left + archW, top + archH);

        Paint archPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        archPaint.setStyle(Paint.Style.STROKE);
        archPaint.setStrokeWidth(1.2f * S);
        archPaint.setColor(Color.argb(8, 255, 255, 255));
        canvas.drawPath(arch, archPaint);

        // 3) Işık küreleri (iOS: blur'lu altın %6 ve yeşil %7-8 daireler)
        drawGlowOrb(canvas, cx + 120 * S, cy + (esmaVariant ? -40 : -50) * S, 75 * S,
                Color.argb(15, 212, 175, 55));
        drawGlowOrb(canvas, cx - 110 * S, cy + 40 * S, 62 * S,
                Color.argb(esmaVariant ? 18 : 20, 52, 199, 89));

        return bitmap;
    }

    private static void drawGlowOrb(Canvas canvas, float x, float y, float radius, int color) {
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setShader(new RadialGradient(
                x, y, radius,
                new int[]{ color, Color.TRANSPARENT },
                new float[]{ 0f, 1f },
                Shader.TileMode.CLAMP
        ));
        canvas.drawCircle(x, y, radius, paint);
    }
}

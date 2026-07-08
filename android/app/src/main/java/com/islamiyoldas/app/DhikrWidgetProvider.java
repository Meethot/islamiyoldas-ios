package com.islamiyoldas.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.Shader;
import android.widget.RemoteViews;

import java.text.NumberFormat;
import java.util.Locale;

public class DhikrWidgetProvider extends AppWidgetProvider {

    private static final String ACTION_INCREMENT = "com.islamiyoldas.app.DHIKR_INCREMENT";
    private static final String ACTION_RESET = "com.islamiyoldas.app.DHIKR_RESET";
    private static final int TOTAL_BEADS = 33;

    private static final String[][] PRESETS = {
        {"subhanallah", "Sübhanallah", "سُبْحَانَ اللَّهِ", "Allah noksan sıfatlardan uzaktır", "33"},
        {"elhamdulillah", "Elhamdülillah", "الْحَمْدُ لِلَّهِ", "Hamd Allah'adır", "33"},
        {"allahuekber", "Allahü Ekber", "اللَّهُ أَكْبَرُ", "Allah en büyüktür", "33"},
        {"last", "Lâ ilâhe illallah", "لَا إِلٰهَ إِلَّا اللّٰه", "Allah'tan başka ilah yoktur", "100"},
        {"istigfar", "Estağfirullah", "أَسْتَغْفِرُ اللَّهَ", "Allah'tan bağışlanma dilerim", "100"},
        {"salavat", "Salavat", "اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ", "Allah'ım, Muhammed'e rahmet et", "100"},
        {"ihlas", "İhlas Suresi", "سُورَةُ الإِخْلَاصِ", "O tektir, Samed'dir, doğurmamış ve doğurulmamıştır.", "100"},
        {"fatiha", "Fatiha Suresi", "سُورَةُ الْفَاتِحَةِ", "Hamd, âlemlerin Rabbi olan Allah'a mahsustur.", "100"},
        {"ayetel_kursi", "Ayetel Kürsi", "آيَةُ الْكُرْسِيِّ", "Allah, O'ndan başka ilah yoktur.", "100"},
        {"hasbunallah", "Hasbünallah", "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", "Allah bize yeter, O ne güzel vekildir.", "100"},
        {"lahavle", "Lâ Havle", "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", "Güç ve kuvvet ancak Allah'a mahsustur.", "100"},
        {"yunus_duasi", "Dua-i Yunus", "لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ", "Senden başka ilah yoktur, seni tenzih ederim.", "100"},
        {"salati_tefriciye", "Salat-ı Tefriciye", "الصَّلَاةُ التَّفْرِيجِيَّةُ", "Tüm sıkıntıların giderilmesi için.", "4444"},
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_INCREMENT.equals(intent.getAction())) {
            handleIncrement(context);
        } else if (ACTION_RESET.equals(intent.getAction())) {
            handleReset(context);
        }
    }

    private void handleIncrement(Context context) {
        SharedPreferences capPrefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);

        int presetIndex = getCapInt(capPrefs, "dhikr_widget_preset_index", 0);
        int count = getCapInt(capPrefs, "dhikr_widget_count", 0);
        int total = getCapInt(capPrefs, "dhikr_widget_total", 0);
        int target = getCapInt(capPrefs, "dhikr_widget_target", 0);

        if (presetIndex < 0 || presetIndex >= PRESETS.length) presetIndex = 0;
        if (target <= 0) target = Integer.parseInt(PRESETS[presetIndex][4]);

        count++;
        total++;

        if (count >= target) {
            count = 0;
            // No auto-advance. Stay on the same preset and let 'tur' increase via 'total'
        }

        capPrefs.edit()
            .putString("dhikr_widget_count", String.valueOf(count))
            .putString("dhikr_widget_preset_index", String.valueOf(presetIndex))
            .putString("dhikr_widget_total", String.valueOf(total))
            .putString("dhikr_widget_target", String.valueOf(target))
            // Dhikr.jsx only accepts widget values when this flag is set
            // (on iOS the AppDelegate bridge sets it); without it the app
            // overwrites widget taps with its stale localStorage counts
            .putString("widget_sync_flag", "true")
            .apply();

        refreshAllWidgets(context, true);
    }

    private void handleReset(Context context) {
        SharedPreferences capPrefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        capPrefs.edit()
            .putString("dhikr_widget_count", "0")
            .putString("widget_sync_flag", "true")
            .apply();
        refreshAllWidgets(context, false);
    }

    private int getCapInt(SharedPreferences prefs, String key, int defaultVal) {
        String val = prefs.getString(key, null);
        if (val != null) {
            try { return Integer.parseInt(val); } catch (Exception e) { /* ignore */ }
        }
        return defaultVal;
    }

    private void refreshAllWidgets(Context context, boolean animate) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName widget = new ComponentName(context, DhikrWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(widget);
        if (ids != null) {
            for (int id : ids) {
                updateWidget(context, manager, id, animate);
            }
        }
    }

    public static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        updateWidget(context, appWidgetManager, appWidgetId, false);
    }

    static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId, boolean animate) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_dhikr);

        SharedPreferences capPrefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        int presetIndex = getCapIntStatic(capPrefs, "dhikr_widget_preset_index", 0);
        int count = getCapIntStatic(capPrefs, "dhikr_widget_count", 0);
        int total = getCapIntStatic(capPrefs, "dhikr_widget_total", 0);
        int target = getCapIntStatic(capPrefs, "dhikr_widget_target", 0);

        String customName = capPrefs.getString("dhikr_widget_custom_name", null);
        String customArabic = capPrefs.getString("dhikr_widget_custom_arabic", null);

        String name, arabic, meaning;
        if (presetIndex == -1 && customName != null && !customName.isEmpty()) {
            name = customName;
            arabic = customArabic != null ? customArabic : "";
            meaning = "";
            if (target <= 0) target = 100;
        } else {
            if (presetIndex < 0 || presetIndex >= PRESETS.length) presetIndex = 0;
            name = PRESETS[presetIndex][1];
            arabic = PRESETS[presetIndex][2];
            meaning = PRESETS[presetIndex][3];
            if (target <= 0) target = Integer.parseInt(PRESETS[presetIndex][4]);
        }

        int tur = target > 0 ? total / target : 0;
        NumberFormat nf = NumberFormat.getInstance(new Locale("tr", "TR"));

        // Generate dynamic preset dots matching iOS
        String presetsText = "○ Sübhanallah  ○ Elhamdülil..  ○ Allahü Ekber";
        if (name.equals("Sübhanallah")) {
            presetsText = "● Sübhanallah  ○ Elhamdülil..  ○ Allahü Ekber";
        } else if (name.equals("Elhamdülillah")) {
            presetsText = "○ Sübhanallah  ● Elhamdülil..  ○ Allahü Ekber";
        } else if (name.equals("Allahü Ekber")) {
            presetsText = "○ Sübhanallah  ○ Elhamdülil..  ● Allahü Ekber";
        } else {
            String shortName = name.length() > 14 ? name.substring(0, 12) + ".." : name;
            presetsText = "● " + shortName + "  ○ Sübhanallah  ○ Elhamdülil..";
        }
        views.setTextViewText(R.id.dhikr_presets_label, presetsText);

        // Set text views (set both sides of the flipper to the target count)
        // Note: in a true flipper, one would have the old text and one the new text before flip.
        // For RemoteViews, setting both and calling showNext() gives a decent effect
        // as the views switch and the new one animates in.
        views.setTextViewText(R.id.dhikr_count_1, String.valueOf(count));
        views.setTextViewText(R.id.dhikr_count_2, String.valueOf(count));
        
        if (animate) {
            views.showNext(R.id.dhikr_count_flipper);
        }
        views.setTextViewText(R.id.dhikr_target, "/ " + nf.format(target));
        views.setTextViewText(R.id.dhikr_name, name);
        views.setTextViewText(R.id.dhikr_arabic, arabic);
        views.setTextViewText(R.id.dhikr_meaning, meaning);
        views.setTextViewText(R.id.dhikr_tur, "↻ " + tur + " Tur");

        // Progress bar
        int progress = target > 0 ? (int) ((count * 100L) / target) : 0;
        views.setProgressBar(R.id.dhikr_progress, 100, progress, false);

        // Preset dots
        StringBuilder presetText = new StringBuilder();
        int maxShow = Math.min(3, PRESETS.length);
        for (int i = 0; i < maxShow; i++) {
            if (i > 0) presetText.append("  ");
            presetText.append(i == presetIndex ? "●" : "○");
            presetText.append(" ");
            String shortName = PRESETS[i][1];
            if (shortName.length() > 12) shortName = shortName.substring(0, 10) + "..";
            presetText.append(shortName);
        }
        views.setTextViewText(R.id.dhikr_presets_label, presetText.toString());

        // Draw bead ring bitmap
        int filledBeads = target > 0 ? (int) ((long) count * TOTAL_BEADS / target) : 0;
        filledBeads = Math.min(filledBeads, TOTAL_BEADS);
        Bitmap beadBitmap = drawBeadRing(filledBeads, count > 0);
        views.setImageViewBitmap(R.id.dhikr_bead_ring, beadBitmap);

        // Entire widget taps to increment
        Intent incrementIntent = new Intent(context, DhikrWidgetProvider.class);
        incrementIntent.setAction(ACTION_INCREMENT);
        PendingIntent incrementPending = PendingIntent.getBroadcast(
            context, 0, incrementIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.dhikr_widget_root, incrementPending);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    /**
     * Draws 33 beads arranged in a circle.
     * Filled beads are gold with gradient, empty beads are dim.
     * The last filled bead is slightly larger (active bead).
     */
    private static Bitmap drawBeadRing(int filledCount, boolean hasAny) {
        int size = 240; // px
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);

        float cx = size / 2f;
        float cy = size / 2f;
        float ringRadius = size / 2f - 18f;
        float beadRadius = 7f;
        float activeBeadRadius = 9.5f;

        Paint filledPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        Paint emptyPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        Paint emptyStroke = new Paint(Paint.ANTI_ALIAS_FLAG);
        Paint glowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        Paint threadPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

        // Thread ring (subtle circle behind beads)
        threadPaint.setStyle(Paint.Style.STROKE);
        threadPaint.setStrokeWidth(1f);
        threadPaint.setColor(Color.argb(30, 212, 175, 55));
        canvas.drawCircle(cx, cy, ringRadius, threadPaint);

        // Empty bead styling
        emptyPaint.setColor(Color.argb(15, 255, 255, 255));
        emptyStroke.setStyle(Paint.Style.STROKE);
        emptyStroke.setStrokeWidth(1f);
        emptyStroke.setColor(Color.argb(60, 212, 175, 55));

        for (int i = 0; i < TOTAL_BEADS; i++) {
            double angle = (double) i * (2 * Math.PI / TOTAL_BEADS) - (Math.PI / 2);
            float bx = cx + ringRadius * (float) Math.cos(angle);
            float by = cy + ringRadius * (float) Math.sin(angle);

            boolean isFilled = i < filledCount;
            boolean isActive = hasAny && isFilled && (i == filledCount - 1);

            if (isFilled) {
                float r = isActive ? activeBeadRadius : beadRadius;

                // Gold glow for active bead
                if (isActive) {
                    glowPaint.setColor(Color.argb(70, 212, 175, 55));
                    canvas.drawCircle(bx, by, r + 4f, glowPaint);
                }

                // Gold gradient bead
                filledPaint.setShader(new RadialGradient(
                    bx - r * 0.3f, by - r * 0.3f, r * 1.4f,
                    new int[]{
                        Color.argb(255, 255, 242, 204),  // highlight
                        Color.argb(255, 238, 198, 80),   // main gold
                        Color.argb(255, 150, 111, 30)    // deep shadow
                    },
                    new float[]{0f, 0.4f, 1f},
                    Shader.TileMode.CLAMP
                ));
                canvas.drawCircle(bx, by, r, filledPaint);
                filledPaint.setShader(null);
            } else {
                // Empty bead
                canvas.drawCircle(bx, by, beadRadius, emptyPaint);
                canvas.drawCircle(bx, by, beadRadius, emptyStroke);
            }
        }

        return bitmap;
    }

    private static int getCapIntStatic(SharedPreferences prefs, String key, int defaultVal) {
        String val = prefs.getString(key, null);
        if (val != null) {
            try { return Integer.parseInt(val); } catch (Exception e) { /* ignore */ }
        }
        return defaultVal;
    }
}

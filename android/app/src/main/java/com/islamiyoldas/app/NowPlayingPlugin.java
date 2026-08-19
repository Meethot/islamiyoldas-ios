package com.islamiyoldas.app;

import android.content.Intent;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * iOS'taki NowPlayingPlugin.swift ile aynı JS arayüzü:
 * setNowPlaying / clearNowPlaying + remotePlay / remotePause / remoteSkipForward / remoteSkipBackward
 */
@CapacitorPlugin(name = "NowPlaying")
public class NowPlayingPlugin extends Plugin {

    @Override
    public void load() {
        MediaNotificationService.setListener((action, value) -> {
            JSObject data = new JSObject();
            switch (action) {
                case MediaNotificationService.ACTION_PLAY:
                    notifyListeners("remotePlay", data);
                    break;
                case MediaNotificationService.ACTION_PAUSE:
                    notifyListeners("remotePause", data);
                    break;
                case MediaNotificationService.ACTION_SKIP_FORWARD:
                    data.put("seconds", 15);
                    notifyListeners("remoteSkipForward", data);
                    break;
                case MediaNotificationService.ACTION_SKIP_BACKWARD:
                    data.put("seconds", 15);
                    notifyListeners("remoteSkipBackward", data);
                    break;
                case MediaNotificationService.ACTION_DISMISS:
                    notifyListeners("remoteStop", data);
                    break;
                case MediaNotificationService.ACTION_SEEK:
                    data.put("seconds", value / 1000.0);
                    notifyListeners("remoteSeek", data);
                    break;
                default:
                    break;
            }
        });
    }

    @PluginMethod
    public void setNowPlaying(PluginCall call) {
        // DİKKAT: getDouble/getBoolean nesne döndürür. Doğrudan putExtra'ya verilirse
        // Serializable olarak yazılır ve getDoubleExtra 0 okur — ilkel tipe alıp öyle koy.
        double duration = call.getDouble("duration", 0.0);
        double currentTime = call.getDouble("currentTime", 0.0);
        boolean isPlaying = Boolean.TRUE.equals(call.getBoolean("isPlaying", false));
        double playbackRate = call.getDouble("playbackRate", 1.0);

        Intent intent = new Intent(getContext(), MediaNotificationService.class);
        intent.setAction(MediaNotificationService.ACTION_UPDATE);
        intent.putExtra("title", call.getString("title", ""));
        intent.putExtra("artist", call.getString("artist", "İslami Yoldaş"));
        intent.putExtra("duration", duration);
        intent.putExtra("currentTime", currentTime);
        intent.putExtra("isPlaying", isPlaying);
        intent.putExtra("playbackRate", playbackRate);

        // Bildirim aksiyon metinleri JS'ten (lokalize). Gelmezse servis Türkçe varsayılanı kullanır.
        JSObject labels = call.getObject("labels");
        if (labels != null) {
            intent.putExtra("labelPlay", labels.optString("play", ""));
            intent.putExtra("labelPause", labels.optString("pause", ""));
            intent.putExtra("labelBack", labels.optString("back", ""));
            intent.putExtra("labelForward", labels.optString("forward", ""));
        }

        // Kapak sadece değiştiğinde gönderilir (JS tarafı öyle çağırıyor); servis sonuncuyu saklar
        String artwork = call.getString("artwork");
        if (artwork != null && !artwork.isEmpty()) {
            intent.putExtra("artwork", artwork);
        }

        try {
            ContextCompat.startForegroundService(getContext(), intent);
            call.resolve();
        } catch (IllegalStateException e) {
            // Uygulama arka plandayken servis başlatılamaz — bildirim olmadan devam
            call.resolve();
        }
    }

    @PluginMethod
    public void clearNowPlaying(PluginCall call) {
        Intent intent = new Intent(getContext(), MediaNotificationService.class);
        intent.setAction(MediaNotificationService.ACTION_STOP);
        try {
            getContext().startService(intent);
        } catch (IllegalStateException e) {
            // servis zaten durmuş
        }
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        MediaNotificationService.setListener(null);
        super.handleOnDestroy();
    }
}

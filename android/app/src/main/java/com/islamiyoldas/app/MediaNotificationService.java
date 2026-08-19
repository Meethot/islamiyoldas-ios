package com.islamiyoldas.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.IBinder;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.util.Base64;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;

/**
 * Kilit ekranı / bildirim gölgesindeki medya kartı (hikaye ve ileride Kur'an dinleme için).
 * Ön plan servisi olması şart: uygulama arka plandayken WebView sesinin kesilmemesi buna bağlı.
 */
public class MediaNotificationService extends Service {

    public static final String ACTION_UPDATE = "com.islamiyoldas.app.media.UPDATE";
    public static final String ACTION_STOP = "com.islamiyoldas.app.media.STOP";
    // Kullanıcı bildirimi kaydırdı: sesi de durdurmalıyız (ACTION_STOP sessizdir, JS'ten gelir)
    public static final String ACTION_DISMISS = "com.islamiyoldas.app.media.DISMISS";
    public static final String ACTION_PLAY = "com.islamiyoldas.app.media.PLAY";
    public static final String ACTION_PAUSE = "com.islamiyoldas.app.media.PAUSE";
    public static final String ACTION_SKIP_FORWARD = "com.islamiyoldas.app.media.SKIP_FORWARD";
    public static final String ACTION_SKIP_BACKWARD = "com.islamiyoldas.app.media.SKIP_BACKWARD";
    public static final String ACTION_SEEK = "com.islamiyoldas.app.media.SEEK";

    private static final String CHANNEL_ID = "media_playback";
    public static final int NOTIFICATION_ID = 4711;

    public interface RemoteActionListener {
        // value: yalnız ACTION_SEEK için milisaniye konumu, diğerlerinde 0
        void onRemoteAction(String action, long value);
    }

    private static RemoteActionListener listener;

    public static void setListener(RemoteActionListener value) {
        listener = value;
    }

    private MediaSessionCompat session;
    private Bitmap artwork;
    private String artworkKey;
    private String lastTitle = "";
    private String lastArtist = "";
    private long lastDuration = 0;
    private String labelPlay = "Oynat";
    private String labelPause = "Duraklat";
    private String labelBack = "-15";
    private String labelForward = "+15";

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
        session = new MediaSessionCompat(this, "IslamiYoldasMedia");
        session.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                dispatch(ACTION_PLAY);
            }

            @Override
            public void onPause() {
                dispatch(ACTION_PAUSE);
            }

            @Override
            public void onFastForward() {
                dispatch(ACTION_SKIP_FORWARD);
            }

            @Override
            public void onRewind() {
                dispatch(ACTION_SKIP_BACKWARD);
            }

            @Override
            public void onSeekTo(long pos) {
                dispatch(ACTION_SEEK, pos);
            }
        });
        session.setActive(true);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (action == null) return START_NOT_STICKY;

        switch (action) {
            case ACTION_STOP:
                stopPlaybackNotification();
                return START_NOT_STICKY;
            case ACTION_DISMISS:
                // Kart kaydırıldı: sesi durdur ve kartı kaldır. PAUSE göndermiyoruz —
                // JS pause'da kartı yeniden kurar, kaydırılan kart geri gelirdi.
                dispatch(ACTION_DISMISS);
                stopPlaybackNotification();
                return START_NOT_STICKY;
            case ACTION_PLAY:
            case ACTION_PAUSE:
            case ACTION_SKIP_FORWARD:
            case ACTION_SKIP_BACKWARD:
                dispatch(action);
                return START_NOT_STICKY;
            case ACTION_UPDATE:
            default:
                showNotification(intent);
                return START_NOT_STICKY;
        }
    }

    private void dispatch(String action) {
        dispatch(action, 0L);
    }

    private void dispatch(String action, long value) {
        RemoteActionListener current = listener;
        if (current != null) current.onRemoteAction(action, value);
    }

    private void showNotification(Intent intent) {
        // Kısmi güncelleme gelebilir (sadece isPlaying + currentTime). Gönderilmeyen
        // alanlar sıfırlanmasın, son bilinen değer korunsun.
        if (intent.hasExtra("title")) lastTitle = safe(intent.getStringExtra("title"));
        if (intent.hasExtra("artist")) lastArtist = safe(intent.getStringExtra("artist"));
        if (intent.hasExtra("duration")) lastDuration = (long) (intent.getDoubleExtra("duration", 0) * 1000);
        labelPlay = pick(intent.getStringExtra("labelPlay"), labelPlay);
        labelPause = pick(intent.getStringExtra("labelPause"), labelPause);
        labelBack = pick(intent.getStringExtra("labelBack"), labelBack);
        labelForward = pick(intent.getStringExtra("labelForward"), labelForward);

        String title = lastTitle;
        String artist = lastArtist;
        long duration = lastDuration;
        long position = (long) (intent.getDoubleExtra("currentTime", 0) * 1000);
        boolean isPlaying = intent.getBooleanExtra("isPlaying", false);
        float speed = (float) intent.getDoubleExtra("playbackRate", 1.0);
        if (!(speed > 0)) speed = 1f;

        decodeArtwork(intent.getStringExtra("artwork"));

        MediaMetadataCompat.Builder metadata = new MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
                .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, duration);
        if (artwork != null) {
            metadata.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, artwork);
        }
        session.setMetadata(metadata.build());

        session.setPlaybackState(new PlaybackStateCompat.Builder()
                .setActions(PlaybackStateCompat.ACTION_PLAY
                        | PlaybackStateCompat.ACTION_PAUSE
                        | PlaybackStateCompat.ACTION_PLAY_PAUSE
                        | PlaybackStateCompat.ACTION_FAST_FORWARD
                        | PlaybackStateCompat.ACTION_REWIND
                        | PlaybackStateCompat.ACTION_SEEK_TO)
                .setState(isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED,
                        position, isPlaying ? speed : 0f) // 1.5x/2x'te kilit ekranı sayacı da hızlı aksın
                .build());

        Intent openApp = new Intent(this, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(artist)
                .setSmallIcon(getApplicationInfo().icon)
                .setLargeIcon(artwork)
                .setContentIntent(PendingIntent.getActivity(this, 0, openApp, pendingFlags()))
                .setDeleteIntent(servicePendingIntent(ACTION_DISMISS, 4))
                .setOnlyAlertOnce(true)
                .setSilent(true)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .addAction(android.R.drawable.ic_media_rew, labelBack, servicePendingIntent(ACTION_SKIP_BACKWARD, 1))
                .addAction(isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
                        isPlaying ? labelPause : labelPlay,
                        servicePendingIntent(isPlaying ? ACTION_PAUSE : ACTION_PLAY, 2))
                .addAction(android.R.drawable.ic_media_ff, labelForward, servicePendingIntent(ACTION_SKIP_FORWARD, 3))
                .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                        .setMediaSession(session.getSessionToken())
                        .setShowActionsInCompactView(0, 1, 2));

        Notification notification = builder.build();

        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                ? android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                : 0;
        ServiceCompat.startForeground(this, NOTIFICATION_ID, notification, type);
    }

    private void decodeArtwork(String data) {
        if (data == null || data.isEmpty()) return;              // görsel gönderilmediyse eldekini koru
        if (data.equals(artworkKey) && artwork != null) return;  // aynı kapak, yeniden çözme

        try {
            String payload = data.contains(",") ? data.substring(data.indexOf(',') + 1) : data;
            byte[] bytes = Base64.decode(payload, Base64.DEFAULT);
            Bitmap decoded = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
            if (decoded != null) {
                artwork = decoded;
                artworkKey = data;
            }
        } catch (IllegalArgumentException | OutOfMemoryError e) {
            // bozuk/aşırı büyük görsel — kapaksız devam et
        }
    }

    private void stopPlaybackNotification() {
        if (session != null) {
            session.setActive(false);
        }
        artwork = null;
        artworkKey = null;
        lastTitle = "";
        lastArtist = "";
        lastDuration = 0;
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    private PendingIntent servicePendingIntent(String action, int requestCode) {
        Intent intent = new Intent(this, MediaNotificationService.class);
        intent.setAction(action);
        return PendingIntent.getService(this, requestCode, intent, pendingFlags());
    }

    private int pendingFlags() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                : PendingIntent.FLAG_UPDATE_CURRENT;
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = ContextCompat.getSystemService(this, NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(CHANNEL_ID) != null) return;

        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Dinleme",
                NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Hikaye ve Kur'an dinlerken oynatma kontrolleri");
        channel.setShowBadge(false);
        channel.setSound(null, null);
        manager.createNotificationChannel(channel);
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    // Kısmi güncellemede etiket gelmezse son bilineni koru
    private static String pick(String value, String fallback) {
        return value == null || value.isEmpty() ? fallback : value;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // Uygulama görev listesinden atıldı: WebView ölür, ses biter — kart asılı kalmasın
        stopPlaybackNotification();
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        if (session != null) {
            session.release();
            session = null;
        }
        artwork = null;
        artworkKey = null;
        super.onDestroy();
    }
}

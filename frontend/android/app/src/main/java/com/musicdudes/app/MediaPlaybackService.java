package com.musicdudes.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaMetadata;
import android.media.MediaPlayer;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.net.wifi.WifiManager;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.view.KeyEvent;
import androidx.core.app.NotificationCompat;

public class MediaPlaybackService extends Service implements MediaPlayer.OnPreparedListener, MediaPlayer.OnCompletionListener, MediaPlayer.OnErrorListener {
    public static final String CHANNEL_ID = "musicdudes_playback_channel";
    public static final int NOTIFICATION_ID = 1001;

    public static final String ACTION_PLAY = "com.musicdudes.app.ACTION_PLAY";
    public static final String ACTION_PAUSE = "com.musicdudes.app.ACTION_PAUSE";
    public static final String ACTION_NEXT = "com.musicdudes.app.ACTION_NEXT";
    public static final String ACTION_PREVIOUS = "com.musicdudes.app.ACTION_PREVIOUS";

    private static MediaPlaybackService instance;
    private MediaPlayer mediaPlayer;
    private MediaSession mediaSession;
    private PowerManager.WakeLock wakeLock;
    private WifiManager.WifiLock wifiLock;
    private AudioManager audioManager;

    private String currentTitle = "MusicDudes Track";
    private String currentArtist = "MusicDudes";
    private String currentUrl = "";
    private boolean isPlaying = false;
    private int pendingStartMs = 0;

    private AudioManager.OnAudioFocusChangeListener audioFocusChangeListener = new AudioManager.OnAudioFocusChangeListener() {
        @Override
        public void onAudioFocusChange(int focusChange) {
            if (focusChange == AudioManager.AUDIOFOCUS_LOSS || focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                // Focus lost temporarily or permanently
            } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
                if (mediaPlayer != null && !mediaPlayer.isPlaying() && isPlaying) {
                    mediaPlayer.start();
                }
            }
        }
    };

    public class LocalBinder extends Binder {
        public MediaPlaybackService getService() {
            return MediaPlaybackService.this;
        }
    }

    private final IBinder binder = new LocalBinder();

    public static MediaPlaybackService getInstance() {
        return instance;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;

        try {
            PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MusicDudes::MediaPlaybackWakeLock");
                wakeLock.acquire();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        try {
            WifiManager wifiManager = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wifiManager != null) {
                wifiLock = wifiManager.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "MusicDudes::WifiLock");
                wifiLock.acquire();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        initMediaPlayer();
        initMediaSession();
        createNotificationChannel();
        startForegroundServiceNotification();
    }

    private void requestAudioFocus() {
        try {
            audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                audioManager.requestAudioFocus(
                    audioFocusChangeListener,
                    AudioManager.STREAM_MUSIC,
                    AudioManager.AUDIOFOCUS_GAIN
                );
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void initMediaPlayer() {
        if (mediaPlayer == null) {
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setWakeMode(getApplicationContext(), PowerManager.PARTIAL_WAKE_LOCK);
            
            if (Build.VERSION.SDK_INT >= 21) {
                mediaPlayer.setAudioAttributes(
                    new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build()
                );
            } else {
                mediaPlayer.setAudioStreamType(AudioManager.STREAM_MUSIC);
            }

            mediaPlayer.setOnPreparedListener(this);
            mediaPlayer.setOnCompletionListener(this);
            mediaPlayer.setOnErrorListener(this);
        }
    }

    private void initMediaSession() {
        try {
            mediaSession = new MediaSession(this, "MusicDudesNativeMediaSession");
            updateMediaSessionState(PlaybackState.STATE_PAUSED);
            updateMediaMetadata();

            mediaSession.setCallback(new MediaSession.Callback() {
                @Override
                public void onPlay() {
                    resumeAudio();
                    NativeAudioPlugin.dispatchWebEvent("onPlay", null);
                }

                @Override
                public void onPause() {
                    pauseAudio();
                    NativeAudioPlugin.dispatchWebEvent("onPause", null);
                }

                @Override
                public void onSkipToNext() {
                    NativeAudioPlugin.dispatchWebEvent("onNext", null);
                }

                @Override
                public void onSkipToPrevious() {
                    NativeAudioPlugin.dispatchWebEvent("onPrevious", null);
                }

                @Override
                public boolean onMediaButtonEvent(Intent mediaButtonIntent) {
                    if (mediaButtonIntent != null && Intent.ACTION_MEDIA_BUTTON.equals(mediaButtonIntent.getAction())) {
                        KeyEvent event = mediaButtonIntent.getParcelableExtra(Intent.EXTRA_KEY_EVENT);
                        if (event != null && event.getAction() == KeyEvent.ACTION_DOWN) {
                            int keyCode = event.getKeyCode();
                            if (keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE || keyCode == KeyEvent.KEYCODE_HEADSETHOOK) {
                                if (isPlaying) {
                                    pauseAudio();
                                    NativeAudioPlugin.dispatchWebEvent("onPause", null);
                                } else {
                                    resumeAudio();
                                    NativeAudioPlugin.dispatchWebEvent("onPlay", null);
                                }
                                return true;
                            } else if (keyCode == KeyEvent.KEYCODE_MEDIA_NEXT) {
                                NativeAudioPlugin.dispatchWebEvent("onNext", null);
                                return true;
                            } else if (keyCode == KeyEvent.KEYCODE_MEDIA_PREVIOUS) {
                                NativeAudioPlugin.dispatchWebEvent("onPrevious", null);
                                return true;
                            }
                        }
                    }
                    return super.onMediaButtonEvent(mediaButtonIntent);
                }
            });

            mediaSession.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS | MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
            mediaSession.setActive(true);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void updateMediaSessionState(int state) {
        if (mediaSession == null) return;
        try {
            PlaybackState playbackState = new PlaybackState.Builder()
                .setActions(
                    PlaybackState.ACTION_PLAY |
                    PlaybackState.ACTION_PAUSE |
                    PlaybackState.ACTION_PLAY_PAUSE |
                    PlaybackState.ACTION_SKIP_TO_NEXT |
                    PlaybackState.ACTION_SKIP_TO_PREVIOUS
                )
                .setState(state, mediaPlayer != null ? mediaPlayer.getCurrentPosition() : 0, 1.0f)
                .build();
            mediaSession.setPlaybackState(playbackState);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void updateMediaMetadata() {
        if (mediaSession == null) return;
        try {
            MediaMetadata metadata = new MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, currentTitle)
                .putString(MediaMetadata.METADATA_KEY_ARTIST, currentArtist)
                .putString(MediaMetadata.METADATA_KEY_ALBUM, "MusicDudes")
                .putLong(MediaMetadata.METADATA_KEY_DURATION, mediaPlayer != null ? mediaPlayer.getDuration() : 0)
                .build();
            mediaSession.setMetadata(metadata);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void playUrl(String url, String title, String artist, int startMs) {
        if (url == null || url.isEmpty()) return;
        this.currentUrl = url;
        this.currentTitle = title != null ? title : "MusicDudes Track";
        this.currentArtist = artist != null ? artist : "MusicDudes";
        this.pendingStartMs = startMs;

        try {
            requestAudioFocus();
            initMediaPlayer();
            mediaPlayer.reset();
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                java.util.Map<String, String> headers = new java.util.HashMap<>();
                headers.put("User-Agent", "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36");
                mediaPlayer.setDataSource(getApplicationContext(), android.net.Uri.parse(url), headers);
            } else {
                mediaPlayer.setDataSource(url);
            }

            mediaPlayer.setVolume(1.0f, 1.0f);
            mediaPlayer.prepareAsync();
            updateMediaMetadata();
            updateNotification();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void pauseAudio() {
        if (mediaPlayer != null && mediaPlayer.isPlaying()) {
            mediaPlayer.pause();
            isPlaying = false;
            updateMediaSessionState(PlaybackState.STATE_PAUSED);
            updateNotification();
        }
    }

    public void resumeAudio() {
        requestAudioFocus();
        if (mediaPlayer != null && !mediaPlayer.isPlaying()) {
            mediaPlayer.start();
            isPlaying = true;
            updateMediaSessionState(PlaybackState.STATE_PLAYING);
            updateNotification();
        }
    }

    public void seekTo(int positionMs) {
        if (mediaPlayer != null) {
            mediaPlayer.seekTo(positionMs);
        }
    }

    public void setVolume(float volume) {
        if (mediaPlayer != null) {
            mediaPlayer.setVolume(volume, volume);
        }
    }

    public int getCurrentPosition() {
        return mediaPlayer != null ? mediaPlayer.getCurrentPosition() : 0;
    }

    public int getDuration() {
        return mediaPlayer != null ? mediaPlayer.getDuration() : 0;
    }

    public boolean isAudioPlaying() {
        return mediaPlayer != null && mediaPlayer.isPlaying();
    }

    @Override
    public void onPrepared(MediaPlayer mp) {
        if (pendingStartMs > 0) {
            mp.seekTo(pendingStartMs);
            pendingStartMs = 0;
        }
        mp.start();
        isPlaying = true;
        updateMediaSessionState(PlaybackState.STATE_PLAYING);
        updateMediaMetadata();
        updateNotification();
        NativeAudioPlugin.dispatchWebEvent("onPrepared", null);
    }

    @Override
    public void onCompletion(MediaPlayer mp) {
        isPlaying = false;
        updateMediaSessionState(PlaybackState.STATE_STOPPED);
        updateNotification();
        NativeAudioPlugin.dispatchWebEvent("onEnded", null);
    }

    @Override
    public boolean onError(MediaPlayer mp, int what, int extra) {
        isPlaying = false;
        updateMediaSessionState(PlaybackState.STATE_ERROR);
        updateNotification();
        NativeAudioPlugin.dispatchWebEvent("onError", null);
        return true;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "MusicDudes Background Playback",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Keeps MusicDudes audio playing continuously when screen is locked or app is minimized.");
            channel.setSound(null, null);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void startForegroundServiceNotification() {
        Notification notification = buildNotification();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void updateNotification() {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, buildNotification());
        }
    }

    private Notification buildNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        Intent playIntent = new Intent(this, MediaPlaybackService.class).setAction(ACTION_PLAY);
        PendingIntent pPlayIntent = PendingIntent.getService(this, 1, playIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Intent pauseIntent = new Intent(this, MediaPlaybackService.class).setAction(ACTION_PAUSE);
        PendingIntent pPauseIntent = PendingIntent.getService(this, 2, pauseIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Intent nextIntent = new Intent(this, MediaPlaybackService.class).setAction(ACTION_NEXT);
        PendingIntent pNextIntent = PendingIntent.getService(this, 3, nextIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Intent prevIntent = new Intent(this, MediaPlaybackService.class).setAction(ACTION_PREVIOUS);
        PendingIntent pPrevIntent = PendingIntent.getService(this, 4, prevIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(isPlaying)
            .addAction(android.R.drawable.ic_media_previous, "Previous", pPrevIntent);

        if (isPlaying) {
            builder.addAction(android.R.drawable.ic_media_pause, "Pause", pPauseIntent);
        } else {
            builder.addAction(android.R.drawable.ic_media_play, "Play", pPlayIntent);
        }

        builder.addAction(android.R.drawable.ic_media_next, "Next", pNextIntent);

        if (mediaSession != null) {
            builder.setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                .setMediaSession(android.support.v4.media.session.MediaSessionCompat.Token.fromToken(mediaSession.getSessionToken()))
                .setShowActionsInCompactView(0, 1, 2));
        }

        return builder.build();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            String action = intent.getAction();
            if (ACTION_PLAY.equals(action)) {
                resumeAudio();
                NativeAudioPlugin.dispatchWebEvent("onPlay", null);
            } else if (ACTION_PAUSE.equals(action)) {
                pauseAudio();
                NativeAudioPlugin.dispatchWebEvent("onPause", null);
            } else if (ACTION_NEXT.equals(action)) {
                NativeAudioPlugin.dispatchWebEvent("onNext", null);
            } else if (ACTION_PREVIOUS.equals(action)) {
                NativeAudioPlugin.dispatchWebEvent("onPrevious", null);
            }
        }
        startForegroundServiceNotification();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        instance = null;
        if (mediaPlayer != null) {
            try {
                mediaPlayer.stop();
                mediaPlayer.release();
            } catch (Exception e) {}
            mediaPlayer = null;
        }
        if (mediaSession != null) {
            try {
                mediaSession.setActive(false);
                mediaSession.release();
            } catch (Exception e) {}
            mediaSession = null;
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            try { wakeLock.release(); } catch (Exception e) {}
        }
        if (wifiLock != null && wifiLock.isHeld()) {
            try { wifiLock.release(); } catch (Exception e) {}
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }
}


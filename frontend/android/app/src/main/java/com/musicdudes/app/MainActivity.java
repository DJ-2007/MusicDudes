package com.musicdudes.app;

import android.content.Context;
import android.media.AudioManager;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private MediaSession mediaSession;
    private AudioManager audioManager;
    private Handler clickHandler = new Handler(Looper.getMainLooper());
    private int clickCount = 0;
    private Runnable clickRunnable = new Runnable() {
        @Override
        public void run() {
            if (clickCount == 1) {
                dispatchActionToWeb("togglePlay");
            } else if (clickCount == 2) {
                dispatchActionToWeb("next");
            } else if (clickCount >= 3) {
                dispatchActionToWeb("previous");
            }
            clickCount = 0;
        }
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        WebView webView = this.getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
        }

        setupNativeMediaSession();
    }

    private void setupNativeMediaSession() {
        try {
            audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                audioManager.requestAudioFocus(
                    null,
                    AudioManager.STREAM_MUSIC,
                    AudioManager.AUDIOFOCUS_GAIN
                );
            }

            mediaSession = new MediaSession(this, "MusicDudesMediaSession");
            
            PlaybackState state = new PlaybackState.Builder()
                .setActions(
                    PlaybackState.ACTION_PLAY |
                    PlaybackState.ACTION_PAUSE |
                    PlaybackState.ACTION_PLAY_PAUSE |
                    PlaybackState.ACTION_SKIP_TO_NEXT |
                    PlaybackState.ACTION_SKIP_TO_PREVIOUS |
                    PlaybackState.ACTION_FAST_FORWARD |
                    PlaybackState.ACTION_REWIND |
                    PlaybackState.ACTION_STOP
                )
                .setState(PlaybackState.STATE_PLAYING, PlaybackState.PLAYBACK_POSITION_UNKNOWN, 1.0f)
                .build();

            mediaSession.setPlaybackState(state);

            mediaSession.setCallback(new MediaSession.Callback() {
                @Override
                public void onPlay() {
                    dispatchActionToWeb("play");
                }

                @Override
                public void onPause() {
                    dispatchActionToWeb("pause");
                }

                @Override
                public void onSkipToNext() {
                    dispatchActionToWeb("next");
                }

                @Override
                public void onSkipToPrevious() {
                    dispatchActionToWeb("previous");
                }

                @Override
                public void onFastForward() {
                    dispatchActionToWeb("next");
                }

                @Override
                public void onRewind() {
                    dispatchActionToWeb("previous");
                }

                @Override
                public boolean onMediaButtonEvent(android.content.Intent mediaButtonIntent) {
                    if (mediaButtonIntent != null && android.content.Intent.ACTION_MEDIA_BUTTON.equals(mediaButtonIntent.getAction())) {
                        KeyEvent event = mediaButtonIntent.getParcelableExtra(android.content.Intent.EXTRA_KEY_EVENT);
                        if (event != null && event.getAction() == KeyEvent.ACTION_DOWN) {
                            if (handleMediaKeyEvent(event)) {
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

    private boolean handleMediaKeyEvent(KeyEvent event) {
        int keyCode = event.getKeyCode();
        if (keyCode == KeyEvent.KEYCODE_MEDIA_NEXT || 
            keyCode == KeyEvent.KEYCODE_MEDIA_STEP_FORWARD || 
            keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD) {
            dispatchActionToWeb("next");
            return true;
        } else if (keyCode == KeyEvent.KEYCODE_MEDIA_PREVIOUS || 
                   keyCode == KeyEvent.KEYCODE_MEDIA_STEP_BACKWARD || 
                   keyCode == KeyEvent.KEYCODE_MEDIA_REWIND) {
            dispatchActionToWeb("previous");
            return true;
        } else if (keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE || 
                   keyCode == KeyEvent.KEYCODE_HEADSETHOOK) {
            handleMultiClick();
            return true;
        } else if (keyCode == KeyEvent.KEYCODE_MEDIA_PLAY) {
            dispatchActionToWeb("play");
            return true;
        } else if (keyCode == KeyEvent.KEYCODE_MEDIA_PAUSE) {
            dispatchActionToWeb("pause");
            return true;
        }
        return false;
    }

    private void handleMultiClick() {
        clickCount++;
        clickHandler.removeCallbacks(clickRunnable);
        clickHandler.postDelayed(clickRunnable, 350);
    }

    private void dispatchActionToWeb(String action) {
        WebView webView = this.getBridge().getWebView();
        if (webView != null) {
            final String jsAction = action;
            webView.post(() -> webView.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('earbud-mediakey', { detail: { action: '" + jsAction + "' } }));", null
            ));
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            if (handleMediaKeyEvent(event)) {
                return true;
            }
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onPause() {
        super.onPause();
        WebView webView = this.getBridge().getWebView();
        if (webView != null) {
            webView.onResume();
        }
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
        }
        super.onDestroy();
    }
}

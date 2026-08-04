package com.musicdudes.app;

import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
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
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            int keyCode = event.getKeyCode();
            String action = null;
            if (keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE || keyCode == KeyEvent.KEYCODE_HEADSETHOOK) {
                action = "togglePlay";
            } else if (keyCode == KeyEvent.KEYCODE_MEDIA_PLAY) {
                action = "play";
            } else if (keyCode == KeyEvent.KEYCODE_MEDIA_PAUSE) {
                action = "pause";
            } else if (keyCode == KeyEvent.KEYCODE_MEDIA_NEXT) {
                action = "next";
            } else if (keyCode == KeyEvent.KEYCODE_MEDIA_PREVIOUS) {
                action = "previous";
            }

            if (action != null) {
                WebView webView = this.getBridge().getWebView();
                if (webView != null) {
                    final String jsAction = action;
                    webView.post(() -> webView.evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('earbud-mediakey', { detail: { action: '" + jsAction + "' } }));", null
                    ));
                    return true;
                }
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
}

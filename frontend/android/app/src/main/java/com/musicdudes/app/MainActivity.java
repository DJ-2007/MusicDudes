package com.musicdudes.app;

import android.os.Bundle;
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
    public void onPause() {
        super.onPause();
        WebView webView = this.getBridge().getWebView();
        if (webView != null) {
            webView.onResume();
        }
    }
}

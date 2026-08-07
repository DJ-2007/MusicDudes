package com.musicdudes.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeAudio")
public class NativeAudioPlugin extends Plugin {
    private static NativeAudioPlugin instance;

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    public static void dispatchWebEvent(String eventName, JSObject data) {
        if (instance != null) {
            if (data == null) data = new JSObject();
            instance.notifyListeners(eventName, data);
        }
    }

    @PluginMethod
    public void play(PluginCall call) {
        String url = call.getString("url");
        String title = call.getString("title", "MusicDudes Track");
        String artist = call.getString("artist", "MusicDudes");
        int startMs = call.getInt("startMs", 0);

        MediaPlaybackService service = MediaPlaybackService.getInstance();
        if (service != null) {
            service.playUrl(url, title, artist, startMs);
            call.resolve();
        } else {
            call.reject("MediaPlaybackService is not initialized");
        }
    }

    @PluginMethod
    public void pause(PluginCall call) {
        MediaPlaybackService service = MediaPlaybackService.getInstance();
        if (service != null) {
            service.pauseAudio();
            call.resolve();
        } else {
            call.reject("MediaPlaybackService is not initialized");
        }
    }

    @PluginMethod
    public void resume(PluginCall call) {
        MediaPlaybackService service = MediaPlaybackService.getInstance();
        if (service != null) {
            service.resumeAudio();
            call.resolve();
        } else {
            call.reject("MediaPlaybackService is not initialized");
        }
    }

    @PluginMethod
    public void seek(PluginCall call) {
        int positionMs = call.getInt("positionMs", 0);
        MediaPlaybackService service = MediaPlaybackService.getInstance();
        if (service != null) {
            service.seekTo(positionMs);
            call.resolve();
        } else {
            call.reject("MediaPlaybackService is not initialized");
        }
    }

    @PluginMethod
    public void setVolume(PluginCall call) {
        double volume = call.getDouble("volume", 1.0);
        MediaPlaybackService service = MediaPlaybackService.getInstance();
        if (service != null) {
            service.setVolume((float) volume);
            call.resolve();
        } else {
            call.reject("MediaPlaybackService is not initialized");
        }
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        MediaPlaybackService service = MediaPlaybackService.getInstance();
        JSObject ret = new JSObject();
        if (service != null) {
            ret.put("isPlaying", service.isAudioPlaying());
            ret.put("positionMs", service.getCurrentPosition());
            ret.put("durationMs", service.getDuration());
        } else {
            ret.put("isPlaying", false);
            ret.put("positionMs", 0);
            ret.put("durationMs", 0);
        }
        call.resolve(ret);
    }
}

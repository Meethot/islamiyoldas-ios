package com.islamiyoldas.app;

import android.view.SoundEffectConstants;
import android.view.View;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeEffects")
public class NativeEffectsPlugin extends Plugin {

    @PluginMethod
    public void playSystemSound(PluginCall call) {
        // Run on UI thread for sound effects
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                View decorView = getActivity().getWindow().getDecorView();
                // Standard click sound effect
                decorView.playSoundEffect(SoundEffectConstants.CLICK);
            }
        });

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
}

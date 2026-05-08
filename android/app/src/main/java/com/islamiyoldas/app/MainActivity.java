package com.islamiyoldas.app;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private BroadcastReceiver screenUnlockReceiver;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Register a receiver that fires when the user unlocks the screen.
        // This clears all delivered notifications, which stops any playing
        // ezan sound immediately on unlock.
        screenUnlockReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (Intent.ACTION_USER_PRESENT.equals(intent.getAction())) {
                    NotificationManager manager = (NotificationManager) context
                            .getSystemService(Context.NOTIFICATION_SERVICE);
                    if (manager != null) {
                        manager.cancelAll();
                    }
                }
            }
        };

        IntentFilter filter = new IntentFilter(Intent.ACTION_USER_PRESENT);
        // Android 13+ requires explicit exported flag for dynamic receivers
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(screenUnlockReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(screenUnlockReceiver, filter);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (screenUnlockReceiver != null) {
            unregisterReceiver(screenUnlockReceiver);
            screenUnlockReceiver = null;
        }
    }
}

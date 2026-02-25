import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';

/**
 * Hook to handle audio lifecycle events, specifically bringing audio back
 * when the app returns from background.
 * 
 * @param {HTMLAudioElement} audioInstance - The audio element to manage
 * @param {boolean} isPlaying - Current playing state from React state
 * @param {function} setIsPlaying - State setter to sync UI if needed
 */
export const useAudioLifecycle = (audioInstance, isPlaying, setIsPlaying) => {
    const wasPlayingRef = useRef(false);

    // Sync ref with state so we know if we *should* be playing
    useEffect(() => {
        if (isPlaying) {
            wasPlayingRef.current = true;
        } else {
            // Only update to false if explicitly paused by user/logic, 
            // not if it's just buffering or interrupted.
            // But for simplicity, we track the intent.
            wasPlayingRef.current = isPlaying;
        }
    }, [isPlaying]);

    useEffect(() => {
        const handleAppStateChange = async (state) => {
            if (state.isActive) {
                // App came to foreground

                if (audioInstance && wasPlayingRef.current) {
                    try {
                        // Check if audio is actually paused or ready
                        if (audioInstance.paused) {
                            // Verify src is still valid
                            if (audioInstance.src) {
                                await audioInstance.play();
                                if (setIsPlaying) setIsPlaying(true);
                            } else {
                                console.warn('Audio src lost during backgrounding.');
                            }
                        }
                    } catch (error) {
                        console.error('Failed to auto-resume audio:', error);
                        // If play failed, it might be because the OS killed the media session.
                        // We might need to reload. 
                        // For now detailed error logging helps diagnose.
                    }
                }
            } else {
                // App went to background
                // Note: On iOS, audio usually pauses automatically if background audio is not configured in Info.plist
                // or playing via a specific plugin. Standard HTML5 audio usually stops.
            }
        };

        const listener = App.addListener('appStateChange', handleAppStateChange);

        return () => {
            listener.then(f => f.remove());
        };
    }, [audioInstance, setIsPlaying]);
};

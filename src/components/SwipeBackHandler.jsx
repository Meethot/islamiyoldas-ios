import { useIOSSwipeBack } from '@/hooks/useIOSSwipeBack';

/**
 * Global handler for iOS-style swipe back gesture.
 * This component renders nothing but activates the swipe listener.
 * It must be placed inside the Router context.
 */
export default function SwipeBackHandler() {
    useIOSSwipeBack();
    return null;
}

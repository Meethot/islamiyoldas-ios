import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function useIOSSwipeBack() {
    const navigate = useNavigate();
    const location = useLocation();
    const touchStartRef = useRef(null);

    useEffect(() => {
        // Disable on root path specifically to avoid exiting app context
        if (location.pathname === '/') return;

        const handleTouchStart = (e) => {
            const touch = e.touches[0];
            // Relaxed: Start from left edge (extended to 80px to accommodate cases/thumbs)
            if (touch.clientX < 80) {
                touchStartRef.current = {
                    x: touch.clientX,
                    y: touch.clientY,
                    time: Date.now()
                };
            } else {
                touchStartRef.current = null;
            }
        };

        const handleTouchEnd = (e) => {
            if (!touchStartRef.current) return;

            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartRef.current.x;
            const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

            // Velocity Check: Short flick?
            // const dt = Date.now() - touchStartRef.current.time;
            // const velocity = deltaX / dt;

            // Relaxed Conditions:
            // 1. Swipe Right at least 40px
            // 2. Vertical drift must be less than 100px (tolerant to diagonal swipes)
            if (deltaX > 40 && deltaY < 100) {
                // Tab Logic: Define the specific back-flow for main tabs
                // Order: Home -> Learn -> Stories -> Tracking -> Profile
                const tabBackPath = {
                    '/learn': '/',
                    '/stories': '/learn',
                    '/tracking': '/stories',
                    '/profile': '/tracking'
                };

                const targetTab = tabBackPath[location.pathname];

                if (targetTab) {
                    navigate(targetTab);
                } else {
                    // Default history back for other pages
                    navigate(-1);
                }
            }

            // Reset
            touchStartRef.current = null;
        };

        // Use Capture Phase to ensure we get the event even if children stopPropagation
        const options = { capture: true, passive: true };

        window.addEventListener('touchstart', handleTouchStart, options);
        window.addEventListener('touchend', handleTouchEnd, options);

        return () => {
            window.removeEventListener('touchstart', handleTouchStart, options);
            window.removeEventListener('touchend', handleTouchEnd, options);
        };
    }, [navigate, location.pathname]);
}

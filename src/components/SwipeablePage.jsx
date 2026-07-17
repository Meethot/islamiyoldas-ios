import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/**
 * Wraps a page content to enable iOS-style "Swipe to Go Back" gesture.
 * - Draggable from anywhere (or edge, configurable).
 * - Slides the page right as you drag.
 * - Navigates back (-1) on release if threshold passed.
 */
export default function SwipeablePage({ children, className = "" }) {
    const navigate = useNavigate();
    const x = useMotionValue(0);
    const opacity = useTransform(x, [0, 200], [1, 0.8]); // Fade out slightly as dragged
    const scale = useTransform(x, [0, 300], [1, 0.95]); // Scale down slightly

    // Drag End Handler
    const handleDragEnd = (_, info) => {
        // Threshold: If dragged more than 100px to the right OR velocity is high
        if (info.offset.x > 100 || info.velocity.x > 500) {
            navigate(-1);
        }
    };

    return (
        <motion.div
            className={`absolute inset-0 z-50 bg-[#F6F0E1] dark:bg-[#021a0f] h-[100dvh] shadow-2xl overflow-hidden ${className}`} // Ensure full screen & background
            initial={{ x: "100%" }} // Start from right
            animate={{ x: 0 }}       // Slide in to center
            exit={{ x: "100%" }}     // Slide out to right
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x" // Enable Horizontal Drag
            dragConstraints={{ left: 0, right: 0 }} // "Elastic" drag (pulls back if released)
            dragElastic={{ right: 0.7, left: 0 }} // Allow pulling right freely, block pulling left
            onDragEnd={handleDragEnd}
            style={{ x, opacity, scale }} // Bind motion values
        >
            {/* Visual handle/hint for swiping (optional, maybe subtle shadow) */}
            <div className="absolute inset-y-0 left-0 w-6 z-50 cursor-grab active:cursor-grabbing" />

            {children}
        </motion.div>
    );
}

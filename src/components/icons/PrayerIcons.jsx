import React from "react";

export const MosqueIcon = ({ size = 24, className = "", ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        {/* Dome */}
        <path
            d="M4 14C4 14 5 7 12 7C19 7 20 14 20 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.1"
        />
        {/* Base */}
        <path
            d="M3 14H21V21H3V14Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {/* Door */}
        <path
            d="M10 21V16C10 15 10.5 14 12 14C13.5 14 14 15 14 16V21"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.15"
        />
        {/* Crescent Moon on top */}
        <path
            d="M12 4V7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        <path
            d="M12 2C13 2 13.5 3 13.5 3C13.5 3 12.5 3.5 12.5 4.5C12.5 5.5 13.5 6 13.5 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
    </svg>
);

export const TasbihIcon = ({ size = 24, className = "", ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        {/* String of beads circle */}
        <circle cx="12" cy="14" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1 3" strokeLinecap="round" />

        {/* Main Imam bead (top) */}
        <path
            d="M12 6V2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        <rect x="11" y="4" width="2" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />

        {/* Tassel */}
        <path
            d="M12 2L10 0.5M12 2L14 0.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
    </svg>
);

export const PrayerRugIcon = ({ size = 24, className = "", ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        {/* Main Rug Rect */}
        <rect x="5" y="3" width="14" height="18" rx="1" stroke="currentColor" strokeWidth="1.5" />

        {/* Arch Design */}
        <path
            d="M7 18V9C7 9 7 6 12 6C17 6 17 9 17 9V18"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.1"
        />

        {/* Tassels bottom */}
        <path d="M5 21V23" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M7 21V22.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M9 21V23" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M11 21V22.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M13 21V23" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M15 21V22.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M17 21V23" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M19 21V22.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
);

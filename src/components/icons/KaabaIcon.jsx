import React from "react";

export const KaabaIcon = ({ size = 24, className = "", ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        {/* Main Cube Structure */}
        <path
            d="M20 8L12 4L4 8V20L12 24L20 20V8Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.1"
        />

        {/* Middle Band (Gold Stripe) */}
        <path
            d="M4 8L12 12L20 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M4 11L12 15L20 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />

        {/* Vertical center line */}
        <path
            d="M12 4V24"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />

        {/* Door (approximate on right side) */}
        <path
            d="M14 16L18 14V17L14 19V16Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.2"
        />
    </svg>
);

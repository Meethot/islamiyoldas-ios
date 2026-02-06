import React from "react";

export const PrayerHandsIcon = ({ size = 24, className = "", ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor" // Allows styling with text-color class
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        {/* Stylized open hands (Dua) */}
        <path
            d="M11.9999 13.9999C11.9999 13.9999 10.4999 9.49991 7.49991 9.49991C4.49991 9.49991 2.99991 11.9999 2.99991 13.9999C2.99991 17.9999 6.49991 21.4999 11.4999 21.4999H12.4999C17.4999 21.4999 20.9999 17.9999 20.9999 13.9999C20.9999 11.9999 19.4999 9.49991 16.4999 9.49991C13.4999 9.49991 11.9999 13.9999 11.9999 13.9999Z"
            stroke="none"
            fillOpacity="0.2" // Slight background fill
        />
        <path
            d="M12 21.5C7 21.5 3.5 18 3.5 14C3.5 12 5 10 7.5 10C10.5 10 12 14 12 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
        <path
            d="M12 21.5C17 21.5 20.5 18 20.5 14C20.5 12 19 10 16.5 10C13.5 10 12 14 12 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
        {/* Finger lines details */}
        <path d="M7.5 10V7C7.5 5.5 8.5 5 9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16.5 10V7C16.5 5.5 15.5 5 15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

        <path d="M5.5 12V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M18.5 12V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

        {/* Thumbs area */}
        <path d="M12 14L12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

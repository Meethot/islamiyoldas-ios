import React, { createContext, useContext, useState, useEffect } from 'react';

const FontSizeContext = createContext();

export const FONT_SIZES = {
    SMALL: { scale: 0.9, id: 'small' },
    NORMAL: { scale: 1.0, id: 'normal' },
    LARGE: { scale: 1.15, id: 'large' },
    XLARGE: { scale: 1.3, id: 'xlarge' }
};

export function FontSizeProvider({ children }) {
    const [fontSize, setFontSize] = useState(() => {
        const saved = localStorage.getItem('appFontSize');
        return saved || 'normal';
    });

    useEffect(() => {
        // Find the scale value for the selected fontSize id
        const selectedSize = Object.values(FONT_SIZES).find(s => s.id === fontSize) || FONT_SIZES.NORMAL;
        
        // Apply the scale to the document root
        document.documentElement.style.setProperty('--app-font-scale', selectedSize.scale.toString());
        
        // Also save to localStorage
        localStorage.setItem('appFontSize', fontSize);
        
        // Dispatch global event for non-react subscribers if any
        window.dispatchEvent(new Event('fontSizeChanged'));
    }, [fontSize]);

    const updateFontSize = (id) => {
        if (FONT_SIZES[id.toUpperCase()] || Object.values(FONT_SIZES).find(s => s.id === id)) {
            setFontSize(id);
        }
    };

    return (
        <FontSizeContext.Provider value={{ fontSize, updateFontSize, FONT_SIZES }}>
            {children}
        </FontSizeContext.Provider>
    );
}

export function useFontSize() {
    const context = useContext(FontSizeContext);
    if (!context) {
        throw new Error('useFontSize must be used within a FontSizeProvider');
    }
    return context;
}

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first
        const saved = localStorage.getItem('theme');
        if (saved) return saved;

        // Default to dark mode if no preference saved
        return 'dark';
    });

    const [resolvedTheme, setResolvedTheme] = useState('dark');

    useEffect(() => {
        const root = window.document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = () => {
            let active = theme;

            if (theme === 'system') {
                active = mediaQuery.matches ? 'dark' : 'light';
            }

            setResolvedTheme(active);

            if (active === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        applyTheme();
        localStorage.setItem('theme', theme);

        // Listen for system changes if mode is 'system'
        if (theme === 'system') {
            const listener = () => applyTheme();
            mediaQuery.addEventListener('change', listener);
            return () => mediaQuery.removeEventListener('change', listener);
        }
    }, [theme]);

    // Compatibility helper for existing code that expects a boolean
    const isDarkMode = resolvedTheme === 'dark';

    const toggleTheme = () => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
}

'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
const ThemeContext = createContext(undefined);
export function ThemeProvider({ children, defaultTheme = 'system', storageKey = 'ganger-theme', }) {
    const [theme, setTheme] = useState(defaultTheme);
    const [actualTheme, setActualTheme] = useState('light');
    useEffect(() => {
        // Load theme from localStorage on mount
        const savedTheme = localStorage.getItem(storageKey);
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, [storageKey]);
    useEffect(() => {
        // Determine actual theme based on selection and system preference
        let resolvedTheme = 'light';
        if (theme === 'system') {
            resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
        }
        else {
            resolvedTheme = theme;
        }
        setActualTheme(resolvedTheme);
        // Apply theme to document
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(resolvedTheme);
        // Save theme to localStorage
        localStorage.setItem(storageKey, theme);
    }, [theme, storageKey]);
    const handleSetTheme = (newTheme) => {
        setTheme(newTheme);
    };
    const value = {
        theme,
        setTheme: handleSetTheme,
        actualTheme,
    };
    return (_jsx(ThemeContext.Provider, { value: value, children: children }));
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

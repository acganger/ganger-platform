"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeProvider = ThemeProvider;
exports.useTheme = useTheme;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ThemeContext = (0, react_1.createContext)(undefined);
function ThemeProvider({ children, defaultTheme = 'system', storageKey = 'ganger-theme', }) {
    const [theme, setTheme] = (0, react_1.useState)(defaultTheme);
    const [actualTheme, setActualTheme] = (0, react_1.useState)('light');
    (0, react_1.useEffect)(() => {
        // Load theme from localStorage on mount
        const savedTheme = localStorage.getItem(storageKey);
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, [storageKey]);
    (0, react_1.useEffect)(() => {
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
    return ((0, jsx_runtime_1.jsx)(ThemeContext.Provider, { value: value, children: children }));
}
function useTheme() {
    const context = (0, react_1.useContext)(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

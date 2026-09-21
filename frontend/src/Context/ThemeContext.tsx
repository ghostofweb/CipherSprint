import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { themeOptions, Theme } from "../Utils/themeOptions";
import { deriveUiTokens } from "../Utils/themeTokens";

interface ThemeContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const themeContext = createContext<ThemeContextValue | undefined>(undefined);

const CSS_VAR_MAP: Record<keyof Theme, string> = {
    label: '',
    background: '--bg',
    textColor: '--text',
    correctWordColor: '--correct-color',
    incorrectWordColor: '--incorrect-color',
    wordColor: '--word-color',
    cursorColor: '--caret-color',
    subTextColor: '--sub-text',
};

const applyThemeVars = (theme: Theme) => {
    const root = document.documentElement;
    (Object.keys(CSS_VAR_MAP) as (keyof Theme)[]).forEach((themeKey) => {
        const cssVar = CSS_VAR_MAP[themeKey];
        if (!cssVar) return;
        if (theme[themeKey] !== undefined) {
            root.style.setProperty(cssVar, theme[themeKey]);
        }
    });
    // Contrast-guaranteed variants for UI text (see themeTokens.ts).
    Object.entries(deriveUiTokens(theme)).forEach(([name, value]) => {
        root.style.setProperty(name, value);
    });
};

const readStoredTheme = (): Theme => {
    try {
        const stored = JSON.parse(localStorage.getItem('theme') as string);
        if (stored && stored.background) return stored;
    } catch {
        // ignore malformed/legacy localStorage value
    }
    return themeOptions[0].value;
};

export const ThemeContextProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setTheme] = useState<Theme>(readStoredTheme);

    useEffect(() => {
        applyThemeVars(theme);
    }, [theme]);

    const values: ThemeContextValue = {
        theme,
        setTheme,
    };

    return (
        <themeContext.Provider value={values}>{children}</themeContext.Provider>
    );
};

export const useTheme = (): ThemeContextValue => {
    const ctx = useContext(themeContext);
    if (!ctx) throw new Error("useTheme must be used within a ThemeContextProvider");
    return ctx;
};

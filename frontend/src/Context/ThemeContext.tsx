import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { themeOptions, Theme, DEFAULT_THEME } from "../Utils/themeOptions";
import { deriveUiTokens } from "../Utils/themeTokens";

interface ThemeContextValue {
    // What is on screen right now (a preview, if one is active).
    theme: Theme;
    // The theme the user chose; saved.
    chosen: Theme;
    setTheme: (theme: Theme) => void;
    // Shows a theme without choosing it (theme picker hover, command
    // palette arrow keys). null ends the preview.
    previewTheme: (theme: Theme | null) => void;
}

const themeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'theme';

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
    // Browser chrome (mobile address bar) follows the theme.
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.background);
};

export const findTheme = (label: string | undefined | null): Theme | undefined =>
    label ? themeOptions.find((t) => t.value.label === label)?.value : undefined;

const readStoredTheme = (): Theme => {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
        // Prefer the current definition of a named theme, so palette tweaks
        // reach people who saved it earlier.
        if (stored && stored.background) return findTheme(stored.label) ?? stored;
    } catch {
        // ignore malformed/legacy localStorage value
    }
    return DEFAULT_THEME;
};

export const ThemeContextProvider = ({ children }: { children: ReactNode }) => {
    const [chosen, setChosen] = useState<Theme>(readStoredTheme);
    const [preview, setPreview] = useState<Theme | null>(null);
    const theme = preview ?? chosen;

    useEffect(() => {
        applyThemeVars(theme);
    }, [theme]);

    const setTheme = useCallback((next: Theme) => {
        setPreview(null);
        setChosen(next);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            // Storage blocked: the theme still applies for this visit.
        }
    }, []);

    const values: ThemeContextValue = { theme, chosen, setTheme, previewTheme: setPreview };

    return <themeContext.Provider value={values}>{children}</themeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
    const ctx = useContext(themeContext);
    if (!ctx) throw new Error("useTheme must be used within a ThemeContextProvider");
    return ctx;
};

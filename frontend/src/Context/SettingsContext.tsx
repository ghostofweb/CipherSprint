import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { DEFAULT_SETTINGS, settingsSchema } from '@ciphersprint/shared';
import type { Settings } from '@ciphersprint/shared';
import { useAuth } from './AuthContext';
import { findTheme, useTheme } from './ThemeContext';
import { api } from '../Utils/api';

interface SettingsContextValue {
    settings: Settings;
    update: (patch: Partial<Omit<Settings, 'updatedAt'>>) => void;
    reset: () => void;
    // 'local' for guests; for accounts, the state of the last sync.
    sync: 'local' | 'syncing' | 'synced' | 'offline';
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

const STORAGE_KEY = 'settings';
const PUSH_DELAY_MS = 800;

const TEST_FONT_STACKS: Record<Settings['testFont'], string> = {
    plex: '"IBM Plex Mono", ui-monospace, monospace',
    jetbrains: '"JetBrains Mono", ui-monospace, monospace',
    roboto: '"Roboto Mono", ui-monospace, monospace',
    fira: '"Fira Code", ui-monospace, monospace',
};

// Anything unreadable or from an older version falls back field by field.
function parse(raw: unknown): Settings {
    const merged = { ...DEFAULT_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) };
    const parsed = settingsSchema.safeParse(merged);
    return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

function readLocal(): Settings {
    try {
        return parse(JSON.parse(localStorage.getItem(STORAGE_KEY) as string));
    } catch {
        return DEFAULT_SETTINGS;
    }
}

function writeLocal(s: Settings) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
        // Storage blocked: settings still apply for this visit.
    }
}

// The typing surface reads these from <html> so no component re-renders.
function applyToDocument(s: Settings) {
    const root = document.documentElement;
    root.dataset.caret = s.caretStyle;
    root.dataset.smoothCaret = String(s.smoothCaret);
    root.dataset.fontSize = s.fontSize;
    root.style.setProperty('--font-test', TEST_FONT_STACKS[s.testFont]);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { chosen, setTheme } = useTheme();
    const [settings, setSettings] = useState<Settings>(readLocal);
    const [sync, setSync] = useState<SettingsContextValue['sync']>('local');
    const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const userRef = useRef(user);
    userRef.current = user;

    useEffect(() => applyToDocument(settings), [settings]);

    const push = useCallback((s: Settings) => {
        if (!userRef.current) return;
        if (pushTimer.current) clearTimeout(pushTimer.current);
        setSync('syncing');
        pushTimer.current = setTimeout(() => {
            api.saveSettings(s)
                .then(() => setSync('synced'))
                .catch(() => setSync('offline'));
        }, PUSH_DELAY_MS);
    }, []);

    const commit = useCallback(
        (next: Settings, { remote = true } = {}) => {
            setSettings(next);
            writeLocal(next);
            if (remote) push(next);
        },
        [push]
    );

    const update = useCallback(
        (patch: Partial<Omit<Settings, 'updatedAt'>>) => {
            setSettings((prev) => {
                const next = { ...prev, ...patch, updatedAt: Date.now() };
                writeLocal(next);
                push(next);
                return next;
            });
        },
        [push]
    );

    const reset = useCallback(() => commit({ ...DEFAULT_SETTINGS, theme: chosen.label, updatedAt: Date.now() }), [commit, chosen.label]);

    // Signing in reconciles this device with the account: whichever copy
    // changed last wins, and the theme comes along.
    useEffect(() => {
        if (!user) {
            setSync('local');
            return undefined;
        }
        let cancelled = false;
        setSync('syncing');
        api.getSettings()
            .then(({ settings: remote }) => {
                if (cancelled) return;
                const local = readLocal();
                if (remote && remote.updatedAt > local.updatedAt) {
                    const adopted = parse(remote);
                    commit(adopted, { remote: false });
                    const t = findTheme(adopted.theme);
                    if (t && t.label !== chosen.label) setTheme(t);
                    setSync('synced');
                } else {
                    commit({ ...local, theme: local.theme ?? chosen.label, updatedAt: local.updatedAt || Date.now() });
                }
            })
            .catch(() => !cancelled && setSync('offline'));
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    // A theme chosen anywhere (picker, palette, settings) is a setting too.
    // Recording the theme a visitor already had is not a change, so it must
    // not look newer than the account's copy (that would overwrite it on
    // the next sign-in from a fresh device).
    useEffect(() => {
        if (settings.theme === chosen.label) return;
        if (settings.theme === undefined) {
            setSettings((prev) => {
                const next = { ...prev, theme: chosen.label };
                writeLocal(next);
                return next;
            });
            return;
        }
        update({ theme: chosen.label });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chosen.label]);

    useEffect(() => () => {
        if (pushTimer.current) clearTimeout(pushTimer.current);
    }, []);

    const value = useMemo(() => ({ settings, update, reset, sync }), [settings, update, reset, sync]);
    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
    return ctx;
}

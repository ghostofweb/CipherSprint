import React, { createContext, lazy, Suspense, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import ThemePickerModal from '../Components/ThemePickerModal';

// Loaded on first use: nobody pays for them until they open one.
const CommandPalette = lazy(() => import('../Components/CommandPalette'));
const ShortcutsSheet = lazy(() => import('../Components/ShortcutsSheet'));

type Overlay = 'themes' | 'palette' | 'shortcuts' | null;

interface UiContextValue {
    openThemePicker: () => void;
    openPalette: () => void;
    openShortcuts: () => void;
    close: () => void;
    overlay: Overlay;
}

const UiContext = createContext<UiContextValue | undefined>(undefined);

// Anywhere a "?" is something being typed, including the test itself.
const isTextField = (el: Element | null) =>
    !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || (el as HTMLElement).isContentEditable);

// App-wide overlays (theme picker, command palette, shortcuts), mounted once
// instead of by every page, plus the global keys that open them.
export function UiProvider({ children }: { children: ReactNode }) {
    const [overlay, setOverlay] = useState<Overlay>(null);
    const [loaded, setLoaded] = useState<{ palette: boolean; shortcuts: boolean }>({ palette: false, shortcuts: false });

    const openPalette = useCallback(() => {
        setLoaded((l) => ({ ...l, palette: true }));
        setOverlay('palette');
    }, []);
    const openShortcuts = useCallback(() => {
        setLoaded((l) => ({ ...l, shortcuts: true }));
        setOverlay('shortcuts');
    }, []);
    const openThemePicker = useCallback(() => setOverlay('themes'), []);
    const close = useCallback(() => setOverlay(null), []);

    // Load the palette once the page is idle, so the first Ctrl+K opens at
    // once and no keystroke typed straight after it is lost.
    useEffect(() => {
        const w = window as Window & { requestIdleCallback?: (cb: () => void) => number; cancelIdleCallback?: (id: number) => void };
        const load = () => setLoaded((l) => (l.palette ? l : { ...l, palette: true }));
        if (w.requestIdleCallback) {
            const id = w.requestIdleCallback(load);
            return () => w.cancelIdleCallback?.(id);
        }
        const id = window.setTimeout(load, 1500);
        return () => window.clearTimeout(id);
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const mod = e.ctrlKey || e.metaKey;
            // Esc pressed while an overlay is still loading must not leave it
            // half-open (the open overlays handle Esc themselves too).
            if (e.key === 'Escape') {
                setOverlay((o) => (o === 'palette' || o === 'shortcuts' ? null : o));
                return;
            }
            if (mod && !e.altKey && (e.key === 'k' || e.key === 'K')) {
                e.preventDefault();
                setOverlay((o) => (o === 'palette' ? null : 'palette'));
                setLoaded((l) => ({ ...l, palette: true }));
            } else if (mod && e.key === '/') {
                e.preventDefault();
                openShortcuts();
            } else if (e.key === '?' && !mod && !isTextField(document.activeElement)) {
                e.preventDefault();
                openShortcuts();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [openShortcuts]);

    const value = useMemo(() => ({ openThemePicker, openPalette, openShortcuts, close, overlay }), [openThemePicker, openPalette, openShortcuts, close, overlay]);

    return (
        <UiContext.Provider value={value}>
            {children}
            <ThemePickerModal open={overlay === 'themes'} onClose={close} />
            <Suspense fallback={null}>
                {loaded.palette && <CommandPalette open={overlay === 'palette'} onClose={close} />}
                {loaded.shortcuts && <ShortcutsSheet open={overlay === 'shortcuts'} onClose={close} />}
            </Suspense>
        </UiContext.Provider>
    );
}

export function useUi(): UiContextValue {
    const ctx = useContext(UiContext);
    if (!ctx) throw new Error('useUi must be used within a UiProvider');
    return ctx;
}

import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Chrome and Edge offer "install" through an event we have to catch and keep;
// Safari and Firefox only through their own menus.
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferred = e as BeforeInstallPromptEvent;
        listeners.forEach((l) => l());
    });
    window.addEventListener('appinstalled', () => {
        deferred = null;
        listeners.forEach((l) => l());
    });
}

const isStandalone = () => typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches;

export function useInstallPrompt() {
    const [, force] = useState(0);
    useEffect(() => {
        const l = () => force((n) => n + 1);
        listeners.add(l);
        return () => {
            listeners.delete(l);
        };
    }, []);

    const prompt = useCallback(async () => {
        if (!deferred) return;
        await deferred.prompt();
        await deferred.userChoice.catch(() => undefined);
        deferred = null;
        listeners.forEach((l) => l());
    }, []);

    return { canInstall: deferred !== null, installed: isStandalone(), prompt };
}

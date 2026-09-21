// The auth modal lives inside AccountCircle. Anything else that needs the
// user to sign in (the social panel for guests, a profile's "Add friend")
// asks for it through this event instead of owning a second modal.
const EVENT = 'cipher:open-auth';

export function openAuthModal(tab: 'login' | 'signup' = 'login'): void {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { tab } }));
}

export function onOpenAuthModal(handler: (tab: 'login' | 'signup') => void): () => void {
    const listener = (e: Event) => handler((e as CustomEvent<{ tab: 'login' | 'signup' }>).detail?.tab ?? 'login');
    window.addEventListener(EVENT, listener);
    return () => window.removeEventListener(EVENT, listener);
}

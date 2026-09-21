import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { useFriendActions } from '../../Hooks/useFriendActions';
import { useSocial } from '../../Context/SocialContext';

// Friend actions for a row/button, with per-person "in flight" tracking and
// a consistent error toast. Success needs no toast: the row changing state
// (Add -> Requested) is the feedback.
export function usePersonActions() {
    const actions = useFriendActions();
    const { openChat } = useSocial();
    const [busy, setBusy] = useState<Set<string>>(new Set());

    const run = useCallback(async (username: string, fn: () => Promise<unknown>) => {
        setBusy((s) => new Set(s).add(username));
        try {
            await fn();
        } catch (err) {
            toast.error((err as Error).message || 'Something went wrong');
        } finally {
            setBusy((s) => {
                const next = new Set(s);
                next.delete(username);
                return next;
            });
        }
    }, []);

    return {
        isBusy: (username: string) => busy.has(username),
        add: (username: string) => run(username, () => actions.send(username)),
        cancel: (username: string, requestId: string) => run(username, () => actions.cancel(requestId)),
        accept: (username: string, requestId: string) => run(username, () => actions.accept(requestId)),
        unfriend: (username: string, userId: string) => run(username, () => actions.unfriend(userId)),
        message: (username: string) => openChat({ kind: 'dm', username }),
    };
}

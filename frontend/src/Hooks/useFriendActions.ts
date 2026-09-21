import { useCallback, useMemo } from 'react';
import { api } from '../Utils/api';
import { useSocial } from '../Context/SocialContext';

// The single place friend mutations live, so the panel's search results,
// request rows, friend menu and a profile page all behave identically and
// keep the shared lists in SocialContext in sync. Each action throws on
// failure; callers decide how to surface it (toast, inline error).
export function useFriendActions() {
    const { refreshFriends, refreshRequests } = useSocial();

    const send = useCallback(
        async (username: string): Promise<string> => {
            const { id } = await api.sendFriendRequest(username);
            await refreshRequests();
            return id;
        },
        [refreshRequests]
    );

    // Cancels a request you sent, or declines one you received: the same
    // DELETE serves both.
    const cancel = useCallback(
        async (requestId: string) => {
            await api.declineFriendRequest(requestId);
            await refreshRequests();
        },
        [refreshRequests]
    );

    const accept = useCallback(
        async (requestId: string) => {
            await api.acceptFriendRequest(requestId);
            await Promise.all([refreshFriends(), refreshRequests()]);
        },
        [refreshFriends, refreshRequests]
    );

    const unfriend = useCallback(
        async (userId: string) => {
            await api.unfriend(userId);
            await refreshFriends();
        },
        [refreshFriends]
    );

    return useMemo(() => ({ send, cancel, decline: cancel, accept, unfriend }), [send, cancel, accept, unfriend]);
}

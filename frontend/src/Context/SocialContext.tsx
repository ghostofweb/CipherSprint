import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { toast } from 'react-toastify';
import type {
    FriendRow,
    FriendRequestRow,
    GroupSummary,
    FriendRequestNotification,
    FriendAcceptedNotification,
    MessageNotification,
    PresenceUpdate,
} from '@ciphersprint/shared';
import { useAuth } from './AuthContext';
import { getSocket } from '../Utils/socket';
import { api } from '../Utils/api';

export type SocialTab = 'friends' | 'groups';

// What the panel is currently showing a conversation with.
export type ChatTarget = { kind: 'dm'; username: string } | { kind: 'group'; id: string };

interface ActiveConversation {
    contextType: 'group' | 'dm';
    contextId: string;
}

interface RequestLists {
    incoming: FriendRequestRow[];
    outgoing: FriendRequestRow[];
}

interface SocialContextValue {
    isOpen: boolean;
    activeTab: SocialTab;
    open: (tab?: SocialTab) => void;
    close: () => void;
    setActiveTab: (tab: SocialTab) => void;

    // Opens the panel straight into a conversation (used by the panel's own
    // lists and by "Message" buttons elsewhere, e.g. on a profile).
    activeChat: ChatTarget | null;
    openChat: (target: ChatTarget) => void;
    closeChat: () => void;

    // Socket connection state, for the "reconnecting" banner.
    connected: boolean;

    friends: FriendRow[];
    groups: GroupSummary[];
    requests: RequestLists;
    loadingFriends: boolean;
    loadingGroups: boolean;
    pendingRequestCount: number;
    totalUnreadCount: number;

    refreshFriends: () => Promise<void>;
    refreshGroups: () => Promise<void>;
    refreshRequests: () => Promise<void>;
    // Instant local zero-out on opening a conversation -- the server marks
    // it read on join, so this just mirrors that without a network round
    // trip.
    markConversationRead: (contextType: 'group' | 'dm', contextId: string) => void;
    // Whichever conversation is actively mounted right now (a DM open in
    // the panel, or a group chat page) -- lets us avoid bumping the unread
    // badge for a message notification about the thing you're already
    // looking at.
    setActiveConversation: (conv: ActiveConversation | null) => void;
}

const SocialContext = createContext<SocialContextValue | undefined>(undefined);

const byActivityDesc = (
    a: { lastMessageAt?: string | null; username?: string; name?: string },
    b: { lastMessageAt?: string | null; username?: string; name?: string }
) => {
    const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    if (bt !== at) return bt - at;
    // Conversations with no messages yet: alphabetical, so the order is stable.
    return (a.username ?? a.name ?? '').localeCompare(b.username ?? b.name ?? '');
};

export const SocialContextProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<SocialTab>('friends');
    const [activeChat, setActiveChat] = useState<ChatTarget | null>(null);
    const [connected, setConnected] = useState(false);
    const [friends, setFriends] = useState<FriendRow[]>([]);
    const [groups, setGroups] = useState<GroupSummary[]>([]);
    const [requests, setRequests] = useState<RequestLists>({ incoming: [], outgoing: [] });
    const [loadingFriends, setLoadingFriends] = useState(true);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const activeConversationRef = useRef<ActiveConversation | null>(null);
    const activeChatRef = useRef<ChatTarget | null>(null);
    const friendsRef = useRef<FriendRow[]>([]);
    const hasConnectedOnce = useRef(false);

    activeChatRef.current = activeChat;
    friendsRef.current = friends;

    const refreshFriends = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.friends();
            setFriends(res.friends.slice().sort(byActivityDesc));
        } catch {
            // Keep whatever we last had rather than blanking the list on a
            // transient network hiccup.
        } finally {
            setLoadingFriends(false);
        }
    }, [user]);

    const refreshGroups = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.myGroups();
            setGroups(res.groups.slice().sort(byActivityDesc));
        } catch {
            // ignore
        } finally {
            setLoadingGroups(false);
        }
    }, [user]);

    const refreshRequests = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.friendRequests();
            setRequests(res);
        } catch {
            // ignore
        }
    }, [user]);

    const open = useCallback((tab?: SocialTab) => {
        if (tab) setActiveTab(tab);
        setIsOpen(true);
    }, []);
    const close = useCallback(() => setIsOpen(false), []);
    const openChat = useCallback((target: ChatTarget) => {
        setActiveChat(target);
        setActiveTab(target.kind === 'dm' ? 'friends' : 'groups');
        setIsOpen(true);
    }, []);
    const closeChat = useCallback(() => setActiveChat(null), []);

    useEffect(() => {
        if (!user) {
            setFriends([]);
            setGroups([]);
            setRequests({ incoming: [], outgoing: [] });
            setLoadingFriends(false);
            setLoadingGroups(false);
            setActiveChat(null);
            setConnected(false);
            hasConnectedOnce.current = false;
            return;
        }
        refreshFriends();
        refreshGroups();
        refreshRequests();

        const socket = getSocket();
        if (!socket) return;

        setConnected(socket.connected);
        const onConnect = () => {
            setConnected(true);
            // Anything that happened while offline (messages, requests,
            // presence) never reached us: resync on every reconnect.
            if (hasConnectedOnce.current) {
                refreshFriends();
                refreshGroups();
                refreshRequests();
            }
            hasConnectedOnce.current = true;
        };
        const onDisconnect = () => setConnected(false);

        const onRequest = (payload: FriendRequestNotification) => {
            toast.info(
                ({ closeToast }) => (
                    <div className="toast-action">
                        <span>{payload.username} sent you a friend request</span>
                        <button
                            type="button"
                            className="toast-link"
                            onClick={() => {
                                open('friends');
                                closeToast?.();
                            }}
                        >
                            View
                        </button>
                    </div>
                ),
                { toastId: `friend-request-${payload.id}` }
            );
            refreshRequests();
        };
        const onAccepted = (payload: FriendAcceptedNotification) => {
            toast.success(`${payload.username} accepted your friend request`);
            refreshFriends();
            refreshRequests();
        };
        const onDeclined = () => refreshRequests();
        // Something this same account did in another tab/device.
        const onOwnChange = () => {
            refreshFriends();
            refreshRequests();
        };
        const onRemoved = (payload: { userId?: string }) => {
            // If you were mid-conversation with the person who just removed
            // you, close that view rather than leaving a dead chat open.
            const chat = activeChatRef.current;
            if (chat?.kind === 'dm' && payload?.userId) {
                const gone = friendsRef.current.find((f) => f.userId === String(payload.userId));
                if (gone && gone.username === chat.username) setActiveChat(null);
            }
            refreshFriends();
        };
        const onPresence = (payload: PresenceUpdate) => {
            setFriends((prev) => prev.map((f) => (f.userId === String(payload.userId) ? { ...f, online: payload.online } : f)));
        };
        // A friend started or finished a race (watchable while it lasts).
        const onRacing = (payload: { userId: string; code: string | null }) => {
            setFriends((prev) => prev.map((f) => (f.userId === String(payload.userId) ? { ...f, racingCode: payload.code } : f)));
        };

        // Fired for every participant of a message, sender included -- so
        // this is the single path that keeps the friends/groups list
        // preview, timestamp, and unread badge live for everyone, without
        // a full refetch on every send.
        const onMessage = (payload: MessageNotification) => {
            const { contextType, contextId, preview, senderUsername, createdAt } = payload;
            const isSelf = senderUsername === user.username;
            const active = activeConversationRef.current;
            const isActive = !!active && active.contextType === contextType && String(active.contextId) === String(contextId);
            const bump = isSelf || isActive ? 0 : 1;

            if (contextType === 'dm') {
                setFriends((prev) => {
                    let matched = false;
                    const next = prev.map((f) => {
                        if (f.dmConversationId && String(f.dmConversationId) === String(contextId)) {
                            matched = true;
                            return {
                                ...f,
                                lastMessageText: preview,
                                lastMessageSenderUsername: senderUsername,
                                lastMessageAt: createdAt,
                                unreadCount: f.unreadCount + bump,
                            };
                        }
                        return f;
                    });
                    if (!matched) {
                        // First message of a brand-new conversation -- this
                        // friend row doesn't know its dmConversationId yet.
                        refreshFriends();
                        return prev;
                    }
                    return next.sort(byActivityDesc);
                });
            } else {
                setGroups((prev) =>
                    prev
                        .map((g) =>
                            String(g._id) === String(contextId)
                                ? {
                                      ...g,
                                      lastMessageText: preview,
                                      lastMessageSenderUsername: senderUsername,
                                      lastMessageAt: createdAt,
                                      unreadCount: (g.unreadCount ?? 0) + bump,
                                  }
                                : g
                        )
                        .sort(byActivityDesc)
                );
            }
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onDisconnect);
        socket.on('friend:request', onRequest);
        socket.on('friend:accepted', onAccepted);
        socket.on('friend:declined', onDeclined);
        socket.on('friends:changed', onOwnChange);
        socket.on('friend:removed', onRemoved);
        socket.on('presence:update', onPresence);
        socket.on('friend:racing', onRacing);
        socket.on('notification:message', onMessage);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onDisconnect);
            socket.off('friend:request', onRequest);
            socket.off('friend:accepted', onAccepted);
            socket.off('friend:declined', onDeclined);
            socket.off('friends:changed', onOwnChange);
            socket.off('friend:removed', onRemoved);
            socket.off('presence:update', onPresence);
            socket.off('friend:racing', onRacing);
            socket.off('notification:message', onMessage);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, refreshFriends, refreshGroups, refreshRequests]);

    const setActiveConversation = useCallback((conv: ActiveConversation | null) => {
        activeConversationRef.current = conv;
    }, []);
    const markConversationRead = useCallback((contextType: 'group' | 'dm', contextId: string) => {
        if (contextType === 'dm') {
            setFriends((prev) => prev.map((f) => (f.dmConversationId && String(f.dmConversationId) === String(contextId) ? { ...f, unreadCount: 0 } : f)));
        } else {
            setGroups((prev) => prev.map((g) => (String(g._id) === String(contextId) ? { ...g, unreadCount: 0 } : g)));
        }
    }, []);

    const pendingRequestCount = requests.incoming.length;
    const totalUnreadCount =
        friends.reduce((sum, f) => sum + (f.unreadCount || 0), 0) + groups.reduce((sum, g) => sum + (g.unreadCount || 0), 0);

    const value: SocialContextValue = {
        isOpen, activeTab, open, close, setActiveTab,
        activeChat, openChat, closeChat,
        connected,
        friends, groups, requests, loadingFriends, loadingGroups,
        pendingRequestCount, totalUnreadCount,
        refreshFriends, refreshGroups, refreshRequests,
        markConversationRead, setActiveConversation,
    };

    return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
};

export const useSocial = (): SocialContextValue => {
    const ctx = useContext(SocialContext);
    if (!ctx) throw new Error('useSocial must be used within a SocialContextProvider');
    return ctx;
};

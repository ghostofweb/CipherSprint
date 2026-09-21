import { useEffect, useRef, useState, useCallback } from 'react';
import type { ChatMessage, TypingUpdate } from '@ciphersprint/shared';
import { getSocket } from '../Utils/socket';
import { useSocial } from '../Context/SocialContext';
import { useAuth } from '../Context/AuthContext';

type ContextType = 'group' | 'dm';

// Must match the server's default page size (routes/groups.ts, routes/dm.ts).
export const PAGE_SIZE = 50;

export type MessageStatus = 'sending' | 'failed';

// A message as the UI holds it: the saved message, or an optimistic local
// copy that has not been confirmed yet.
export interface ChatItem extends ChatMessage {
    status?: MessageStatus;
    error?: string;
}

interface UseChatOptions {
    // `before` is a timestamp (ms); omit it for the latest page.
    fetchHistory: (before?: number) => Promise<{ messages: ChatMessage[] }>;
}

interface Ack {
    ok: boolean;
    error?: string;
    message?: ChatMessage;
    lastReadAt?: string | null;
}

// How long a "typing" indicator stays up after the last keystroke, and
// after the last typing:update we heard from someone else (a safety net
// in case their own stop event never arrives, e.g. they closed the tab).
const TYPING_IDLE_MS = 2500;
const TYPING_EXPIRE_MS = 5000;
const SEND_TIMEOUT_MS = 10000;

const newClientId = (): string =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// Replace the entry a saved message corresponds to (matched by the
// clientId we generated, or by its real id), else append it. Used for both
// the send ack and the message:new echo, which may arrive in either order.
function upsert(list: ChatItem[], saved: ChatMessage): ChatItem[] {
    const i = list.findIndex((m) => (saved.clientId && m.clientId === saved.clientId) || m._id === saved._id);
    if (i === -1) return [...list, saved];
    const next = list.slice();
    next[i] = saved;
    return next;
}

const byTime = (a: ChatItem, b: ChatItem) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

// Shared by group chat and DM chat -- both are otherwise identical (fetch
// history, join a room, listen for new messages, send). contextId must be
// a resolved id (a group's _id, or a DirectConversation's _id) -- callers
// resolve DM conversations via api.openDm() before using this.
export function useChat(contextType: ContextType, contextId: string | null, { fetchHistory }: UseChatOptions) {
    const { user } = useAuth();
    const { setActiveConversation, markConversationRead } = useSocial();

    const [messages, setMessages] = useState<ChatItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [connected, setConnected] = useState(false);
    // undefined until the server tells us where the reader left off; null
    // means "never opened before".
    const [lastReadAt, setLastReadAt] = useState<string | null | undefined>(undefined);
    const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);

    const socketRef = useRef<ReturnType<typeof getSocket>>(null);
    const fetchHistoryRef = useRef(fetchHistory);
    fetchHistoryRef.current = fetchHistory;
    const messagesRef = useRef<ChatItem[]>([]);
    messagesRef.current = messages;
    const hasMoreRef = useRef(false);
    hasMoreRef.current = hasMore;
    const loadingOlderRef = useRef(false);
    const dividerComputed = useRef(false);

    const isTypingRef = useRef(false);
    const typingIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingExpiryRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    useEffect(() => {
        if (!contextId) return undefined;
        let cancelled = false;
        let wasDisconnected = false;

        setMessages([]);
        setLoading(true);
        setError(null);
        setHasMore(false);
        setLastReadAt(undefined);
        setFirstUnreadId(null);
        setTypingUsers([]);
        dividerComputed.current = false;

        // One tick: messages and loading must flip together so the list never
        // renders "loaded but still loading".
        fetchHistoryRef
            .current()
            .then((res) => {
                if (cancelled) return;
                setMessages(res.messages);
                setHasMore(res.messages.length >= PAGE_SIZE);
                setLoading(false);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err.message);
                setLoading(false);
            });

        const socket = getSocket();
        socketRef.current = socket;
        if (!socket) return () => { cancelled = true; };
        setConnected(socket.connected);

        const room = { contextType, contextId };

        const handleNew = (message: ChatMessage) => {
            if (message.contextType !== contextType || String(message.contextId) !== String(contextId)) return;
            setMessages((prev) => upsert(prev, message));
        };

        const clearTypingExpiry = (username: string) => {
            const timer = typingExpiryRef.current.get(username);
            if (timer) clearTimeout(timer);
            typingExpiryRef.current.delete(username);
        };

        const handleTyping = (payload: TypingUpdate) => {
            if (payload.contextType !== contextType || String(payload.contextId) !== String(contextId)) return;
            clearTypingExpiry(payload.username);
            if (payload.isTyping) {
                setTypingUsers((prev) => (prev.includes(payload.username) ? prev : [...prev, payload.username]));
                typingExpiryRef.current.set(
                    payload.username,
                    setTimeout(() => {
                        setTypingUsers((prev) => prev.filter((u) => u !== payload.username));
                        typingExpiryRef.current.delete(payload.username);
                    }, TYPING_EXPIRE_MS)
                );
            } else {
                setTypingUsers((prev) => prev.filter((u) => u !== payload.username));
            }
        };

        const onDisconnect = () => {
            wasDisconnected = true;
            setConnected(false);
        };
        // Server-side rooms are per socket, so after a reconnect we are in
        // none of them: rejoin, and refetch the latest page to fill whatever
        // arrived while we were gone.
        const onConnect = () => {
            setConnected(true);
            if (!wasDisconnected) return;
            wasDisconnected = false;
            socket.emit('join:room', room);
            fetchHistoryRef
                .current()
                .then((res) => {
                    if (cancelled) return;
                    setMessages((prev) => {
                        const known = new Set(prev.map((m) => m._id));
                        const missing = res.messages.filter((m) => !known.has(m._id));
                        return missing.length ? [...prev, ...missing].sort(byTime) : prev;
                    });
                })
                .catch(() => {});
        };

        // Joining a room server-side marks it read -- mirror that locally
        // (instant) instead of waiting on a network refetch.
        setActiveConversation(room);
        markConversationRead(contextType, contextId);
        socket.emit('join:room', room, (ack: Ack) => {
            if (!cancelled && ack?.ok) setLastReadAt(ack.lastReadAt ?? null);
        });
        socket.on('message:new', handleNew);
        socket.on('typing:update', handleTyping);
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        return () => {
            cancelled = true;
            setActiveConversation(null);
            socket.emit('leave:room', room);
            socket.off('message:new', handleNew);
            socket.off('typing:update', handleTyping);
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            if (isTypingRef.current) socket.emit('typing:stop', room);
            if (typingIdleTimerRef.current) clearTimeout(typingIdleTimerRef.current);
            isTypingRef.current = false;
            typingExpiryRef.current.forEach((timer) => clearTimeout(timer));
            typingExpiryRef.current.clear();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextType, contextId]);

    // Once history AND the previous read position are both known, pin the
    // "new messages" divider to the first message from someone else that
    // arrived after it. Computed once per open, so messages that arrive
    // while you are looking never move it.
    useEffect(() => {
        if (dividerComputed.current || loading || lastReadAt === undefined || !user) return;
        dividerComputed.current = true;
        const since = lastReadAt ? new Date(lastReadAt).getTime() : 0;
        const first = messages.find((m) => m.senderUsername !== user.username && new Date(m.createdAt).getTime() > since);
        setFirstUnreadId(first ? first._id : null);
    }, [loading, lastReadAt, messages, user]);

    const markFailed = useCallback((clientId: string, message: string) => {
        setMessages((prev) =>
            prev.map((m) => (m.clientId === clientId && m.status === 'sending' ? { ...m, status: 'failed', error: message } : m))
        );
    }, []);

    const emitSend = useCallback(
        (item: ChatItem) => {
            const socket = socketRef.current;
            const clientId = item.clientId as string;
            if (!socket || !socket.connected) {
                markFailed(clientId, "You're offline.");
                return;
            }
            socket
                .timeout(SEND_TIMEOUT_MS)
                .emit('message:send', { contextType, contextId, text: item.text, clientId }, (err: Error | null, ack?: Ack) => {
                    if (err) return markFailed(clientId, 'No response. Check your connection.');
                    if (ack?.ok && ack.message) setMessages((prev) => upsert(prev, ack.message as ChatMessage));
                    else markFailed(clientId, ack?.error || "Couldn't send.");
                });
        },
        [contextType, contextId, markFailed]
    );

    // Notifies the room that you are typing. Debounced: emits typing:start at
    // most once per idle window instead of on every keystroke, and
    // auto-emits typing:stop after a pause.
    const notifyTyping = useCallback(() => {
        const socket = socketRef.current;
        if (!socket || !contextId) return;
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            socket.emit('typing:start', { contextType, contextId });
        }
        if (typingIdleTimerRef.current) clearTimeout(typingIdleTimerRef.current);
        typingIdleTimerRef.current = setTimeout(() => {
            isTypingRef.current = false;
            socket.emit('typing:stop', { contextType, contextId });
        }, TYPING_IDLE_MS);
    }, [contextType, contextId]);

    const stopTyping = useCallback(() => {
        const socket = socketRef.current;
        if (typingIdleTimerRef.current) clearTimeout(typingIdleTimerRef.current);
        if (socket && contextId && isTypingRef.current) {
            isTypingRef.current = false;
            socket.emit('typing:stop', { contextType, contextId });
        }
    }, [contextType, contextId]);

    // Optimistic: the message appears immediately as "sending" and is
    // swapped for the saved copy when the server confirms.
    const sendMessage = useCallback(
        (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || !contextId || !user) return;
            const clientId = newClientId();
            const item: ChatItem = {
                _id: clientId,
                clientId,
                contextType,
                contextId,
                senderId: user.id,
                senderUsername: user.username,
                text: trimmed,
                createdAt: new Date().toISOString(),
                status: 'sending',
            };
            setMessages((prev) => [...prev, item]);
            stopTyping();
            emitSend(item);
        },
        [contextType, contextId, user, stopTyping, emitSend]
    );

    // Same clientId on retry: if the first attempt actually landed (lost
    // ack), the server answers with the message it already saved instead of
    // creating a duplicate.
    const retry = useCallback(
        (clientId: string) => {
            const item = messagesRef.current.find((m) => m.clientId === clientId && m.status === 'failed');
            if (!item) return;
            const sending: ChatItem = { ...item, status: 'sending', error: undefined };
            setMessages((prev) => prev.map((m) => (m.clientId === clientId ? sending : m)));
            emitSend(sending);
        },
        [emitSend]
    );

    const discard = useCallback((clientId: string) => {
        setMessages((prev) => prev.filter((m) => !(m.clientId === clientId && m.status === 'failed')));
    }, []);

    const loadOlder = useCallback(async () => {
        if (loadingOlderRef.current || !hasMoreRef.current) return;
        const oldest = messagesRef.current.find((m) => !m.status);
        if (!oldest) return;
        loadingOlderRef.current = true;
        setLoadingOlder(true);
        try {
            const res = await fetchHistoryRef.current(new Date(oldest.createdAt).getTime());
            setMessages((prev) => {
                const known = new Set(prev.map((m) => m._id));
                return [...res.messages.filter((m) => !known.has(m._id)), ...prev];
            });
            setHasMore(res.messages.length >= PAGE_SIZE);
        } catch {
            // Leave hasMore set: scrolling to the top again retries.
        } finally {
            loadingOlderRef.current = false;
            setLoadingOlder(false);
        }
    }, []);

    return {
        messages,
        loading,
        error,
        hasMore,
        loadingOlder,
        loadOlder,
        connected,
        firstUnreadId,
        sendMessage,
        retry,
        discard,
        typingUsers,
        notifyTyping,
        stopTyping,
    };
}

export type ChatState = ReturnType<typeof useChat>;

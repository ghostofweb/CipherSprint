import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ChatState, ChatItem } from '../../Hooks/useChat';
import Avatar from '../Avatar';
import Icon from '../ui/Icon';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import { NoMessagesArt } from '../assets/illustrations';
import MessageText from './MessageText';
import { cx } from '../../Utils/cx';
import { formatClock, formatDayLabel, sameDay } from '../../Utils/format';

// Consecutive messages from one sender within this window read as one block.
const GROUP_WINDOW_MS = 5 * 60 * 1000;
// "Near the bottom" for sticky scrolling.
const STICK_PX = 48;

type Row =
    | { type: 'day'; key: string; label: string }
    | { type: 'new'; key: string }
    | { type: 'msg'; key: string; m: ChatItem; mine: boolean; first: boolean; last: boolean };

function buildRows(messages: ChatItem[], me: string, firstUnreadId: string | null): Row[] {
    const rows: Row[] = [];
    let prev: ChatItem | null = null;
    messages.forEach((m, i) => {
        const newDay = !prev || !sameDay(prev.createdAt, m.createdAt);
        if (newDay) rows.push({ type: 'day', key: `day-${m.createdAt}`, label: formatDayLabel(m.createdAt) });
        if (m._id === firstUnreadId) rows.push({ type: 'new', key: 'new-divider' });

        const continues =
            !newDay &&
            m._id !== firstUnreadId &&
            prev !== null &&
            prev.senderUsername === m.senderUsername &&
            new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < GROUP_WINDOW_MS;

        const next = messages[i + 1];
        const nextContinues =
            !!next &&
            sameDay(m.createdAt, next.createdAt) &&
            next._id !== firstUnreadId &&
            next.senderUsername === m.senderUsername &&
            new Date(next.createdAt).getTime() - new Date(m.createdAt).getTime() < GROUP_WINDOW_MS;

        rows.push({ type: 'msg', key: m.clientId || m._id, m, mine: m.senderUsername === me, first: !continues, last: !nextContinues });
        prev = m;
    });
    return rows;
}

interface MessageRowProps {
    m: ChatItem;
    mine: boolean;
    first: boolean;
    last: boolean;
    showName: boolean;
    avatarUrl?: string | null;
    onRetry: (clientId: string) => void;
    onDiscard: (clientId: string) => void;
}

const MessageRow = React.memo(function MessageRow({ m, mine, first, last, showName, avatarUrl, onRetry, onDiscard }: MessageRowProps) {
    return (
        <div className={cx('cr-msg', mine && 'is-mine', first && 'is-first', m.status && `is-${m.status}`)}>
            {!mine && (
                <div className="cr-msg__avatar">
                    {last && <Avatar url={avatarUrl} name={m.senderUsername} size="sm" />}
                </div>
            )}
            <div className="cr-msg__body">
                {first && (
                    <div className="cr-msg__meta">
                        {!mine && showName && <span className="cr-msg__name">{m.senderUsername}</span>}
                        <time dateTime={m.createdAt} className="tnum">{formatClock(m.createdAt)}</time>
                    </div>
                )}
                <div className="cr-msg__bubble" title={new Date(m.createdAt).toLocaleString()}>
                    <MessageText text={m.text} />
                </div>
                {m.status === 'failed' && m.clientId && (
                    <div className="cr-msg__failed" role="alert">
                        <span>Not sent{m.error ? `. ${m.error}` : '.'}</span>
                        <button type="button" onClick={() => onRetry(m.clientId as string)}>Retry</button>
                        <button type="button" onClick={() => onDiscard(m.clientId as string)}>Delete</button>
                    </div>
                )}
            </div>
        </div>
    );
});

interface MessageListProps {
    chat: ChatState;
    me: string;
    avatarsByUsername: Record<string, string | null | undefined>;
    showNames: boolean;
    emptyTitle: string;
    emptyBody?: string;
    // Shown when the whole history is on screen ("start of your conversation").
    startLabel?: string;
}

function MessageList({ chat, me, avatarsByUsername, showNames, emptyTitle, emptyBody, startLabel }: MessageListProps) {
    const { messages, loading, error, hasMore, loadingOlder, loadOlder, firstUnreadId, retry, discard } = chat;
    const listRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const topRef = useRef<HTMLDivElement>(null);
    const atBottomRef = useRef(true);
    const [atBottom, setAtBottom] = useState(true);
    const [unseen, setUnseen] = useState(0);
    const prevFirstId = useRef<string | null>(null);
    const prevLastId = useRef<string | null>(null);
    const prevScrollHeight = useRef(0);
    const initialScrolled = useRef(false);

    const rows = useMemo(() => buildRows(messages, me, firstUnreadId), [messages, me, firstUnreadId]);

    const scrollToBottom = () => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    };

    const onScroll = () => {
        const el = listRef.current;
        if (!el) return;
        const near = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_PX;
        atBottomRef.current = near;
        setAtBottom(near);
        if (near) setUnseen(0);
    };

    // Scroll policy: stay put while reading history; follow new messages only
    // when already at the bottom or when you sent them; keep your place when
    // older messages are prepended.
    useLayoutEffect(() => {
        const el = listRef.current;
        // Nothing is rendered while loading, so there is nothing to position.
        if (!el || loading) return;
        const first = messages[0]?._id ?? null;
        const last = messages[messages.length - 1]?._id ?? null;
        const prepended = prevFirstId.current !== null && first !== prevFirstId.current && last === prevLastId.current;

        if (!initialScrolled.current && messages.length > 0) {
            // First paint of real content: start at the newest message.
            scrollToBottom();
            initialScrolled.current = true;
        } else if (prepended) {
            el.scrollTop += el.scrollHeight - prevScrollHeight.current;
        } else if (last !== prevLastId.current) {
            const lastMsg = messages[messages.length - 1];
            if (atBottomRef.current || lastMsg?.senderUsername === me) scrollToBottom();
            else setUnseen((n) => n + 1);
        }
        prevFirstId.current = first;
        prevLastId.current = last;
        prevScrollHeight.current = el.scrollHeight;
    }, [messages, me, loading]);

    // Content can grow after we positioned the list (the "new messages"
    // divider lands when the read position arrives, fonts swap, ...). While
    // you are at the bottom, stay there.
    useEffect(() => {
        const inner = innerRef.current;
        if (!inner || typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(() => {
            if (atBottomRef.current) scrollToBottom();
        });
        observer.observe(inner);
        return () => observer.disconnect();
    }, []);

    // Load older history when the top edge scrolls into view. The observer is
    // recreated when a page finishes so a still-visible edge (a short page)
    // immediately asks for the next one.
    useEffect(() => {
        const el = topRef.current;
        const root = listRef.current;
        if (!el || !root || loading || !hasMore || loadingOlder) return undefined;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) loadOlder();
            },
            { root, rootMargin: '120px 0px 0px 0px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [loading, hasMore, loadingOlder, loadOlder]);

    const isEmpty = !loading && !error && messages.length === 0;

    return (
        <div className="cr-list-wrap">
            <div className="cr-list" ref={listRef} onScroll={onScroll} role="log" aria-live="polite" aria-label="Messages">
              <div className="cr-inner" ref={innerRef}>
                <div className="cr-top" ref={topRef}>
                    {loadingOlder && <span className="cr-top__note">Loading earlier messages</span>}
                    {!loading && !hasMore && messages.length > 0 && startLabel && <span className="cr-top__note">{startLabel}</span>}
                </div>

                {loading && <SkeletonRows count={4} />}
                {!loading && error && <EmptyState title="Couldn't load messages">{error}</EmptyState>}
                {isEmpty && (
                    <EmptyState art={<NoMessagesArt size={80} />} title={emptyTitle}>
                        {emptyBody}
                    </EmptyState>
                )}

                {!loading &&
                    rows.map((row) => {
                        if (row.type === 'day') {
                            return (
                                <div className="cr-sep" key={row.key} role="separator">
                                    <span>{row.label}</span>
                                </div>
                            );
                        }
                        if (row.type === 'new') {
                            return (
                                <div className="cr-sep cr-sep--new" key={row.key} role="separator">
                                    <span>New messages</span>
                                </div>
                            );
                        }
                        return (
                            <MessageRow
                                key={row.key}
                                m={row.m}
                                mine={row.mine}
                                first={row.first}
                                last={row.last}
                                showName={showNames}
                                avatarUrl={avatarsByUsername[row.m.senderUsername]}
                                onRetry={retry}
                                onDiscard={discard}
                            />
                        );
                    })}
              </div>
            </div>

            {!atBottom && messages.length > 0 && (
                <button type="button" className="cr-jump" onClick={scrollToBottom}>
                    <Icon name="arrow-down" size={14} />
                    {unseen > 0 ? `${unseen} new` : 'Latest'}
                </button>
            )}
        </div>
    );
}

export default MessageList;

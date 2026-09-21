import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../ui/Input';
import Count from '../ui/Count';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import { NoFriendsArt, NoResultsArt } from '../assets/illustrations';
import FriendRow from './FriendRow';
import PersonRow from './PersonRow';
import RequestRow from './RequestRow';
import { usePersonActions } from './usePersonActions';
import { focusMemory } from './focusMemory';
import { useSocial } from '../../Context/SocialContext';
import { useAuth } from '../../Context/AuthContext';
import { usePeopleSearch, MIN_SEARCH_LENGTH } from '../../Hooks/usePeopleSearch';
import { resolveRelationship } from '../../Utils/relationship';
import { cx } from '../../Utils/cx';
import Icon from '../ui/Icon';

function FriendsTab() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { friends, requests, loadingFriends, openChat, close } = useSocial();
    const actions = usePersonActions();
    const [query, setQuery] = useState('');
    const [confirming, setConfirming] = useState<string | null>(null);
    const [showSent, setShowSent] = useState(false);
    const search = usePeopleSearch(query);
    const inputRef = useRef<HTMLInputElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);

    const me = user?.username ?? '';
    const q = search.query;
    const searching = q.length > 0;

    // On open (or on backing out of a chat) put focus somewhere useful: the
    // row you came from, else the search field on devices with a keyboard.
    useEffect(() => {
        const key = focusMemory.key;
        focusMemory.key = null;
        const target = key ? bodyRef.current?.querySelector<HTMLElement>(`[data-nav-key="${CSS.escape(key)}"]`) : null;
        if (target) target.focus();
        else if (window.matchMedia?.('(pointer: fine)').matches) inputRef.current?.focus();
    }, []);

    const shownFriends = useMemo(
        () => (q ? friends.filter((f) => f.username.toLowerCase().includes(q.toLowerCase())) : friends),
        [friends, q]
    );

    const people = useMemo(() => {
        if (search.state.status !== 'ready') return [];
        return search.state.users
            .map((person) => ({ person, resolved: resolveRelationship(person, friends, requests, !loadingFriends) }))
            .filter(({ resolved }) => resolved.relationship !== 'friends' && resolved.relationship !== 'self');
    }, [search.state, friends, requests, loadingFriends]);

    const matchedSelf = search.state.status === 'ready' && search.state.users.some((u) => u.relationship === 'self');
    const nothingFound = searching && search.state.status === 'ready' && people.length === 0 && shownFriends.length === 0;

    const navItems = () => Array.from(bodyRef.current?.querySelectorAll<HTMLElement>('[data-nav]:not(:disabled)') ?? []);

    const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            navItems()[0]?.focus();
        } else if (e.key === 'Enter') {
            // Quick open: the first friend that matches.
            e.preventDefault();
            const first = shownFriends[0];
            if (first) openFriend(first.username);
        } else if (e.key === 'Escape' && query) {
            // Clear the query instead of closing the whole panel.
            e.preventDefault();
            e.stopPropagation();
            setQuery('');
        }
    };

    const onListKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        const items = navItems();
        const i = items.indexOf(document.activeElement as HTMLElement);
        if (i === -1) return;
        e.preventDefault();
        if (e.key === 'ArrowDown') items[Math.min(i + 1, items.length - 1)]?.focus();
        else if (i === 0) inputRef.current?.focus();
        else items[i - 1]?.focus();
    };

    const openFriend = (username: string) => {
        focusMemory.key = `dm:${username}`;
        openChat({ kind: 'dm', username });
    };

    const removeFriend = async (username: string, userId: string) => {
        await actions.unfriend(username, userId);
        setConfirming(null);
    };

    const announce =
        search.state.status === 'ready'
            ? `${people.length + shownFriends.length} result${people.length + shownFriends.length === 1 ? '' : 's'}`
            : search.state.status === 'loading'
              ? 'Searching'
              : '';

    return (
        <div className={cx('sp-tab', searching && 'sp-searching')}>
            <div className="sp-search">
                <Input
                    ref={inputRef}
                    label="Find people by name or ID"
                    icon="search"
                    placeholder="Find people by name or ID"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onClear={() => {
                        setQuery('');
                        inputRef.current?.focus();
                    }}
                    onKeyDown={onInputKeyDown}
                    hint={q.length > 0 && q.length < MIN_SEARCH_LENGTH ? 'Keep typing to search everyone.' : undefined}
                    autoComplete="off"
                    spellCheck={false}
                />
            </div>

            <div className="sp-scroll" ref={bodyRef} onKeyDown={onListKeyDown}>
                <div className="visually-hidden" role="status" aria-live="polite">{announce}</div>

                {/* Incoming requests: the thing most worth seeing first. */}
                {!searching && requests.incoming.length > 0 && (
                    <section className="sp-sec" aria-label="Friend requests">
                        <h3 className="sp-sec__title">requests <Count n={requests.incoming.length} accent /></h3>
                        <ul className="sp-list">
                            {requests.incoming.map((r) => (
                                <RequestRow
                                    key={r.id}
                                    request={r}
                                    direction="incoming"
                                    busy={actions.isBusy(r.username)}
                                    onAccept={() => actions.accept(r.username, r.id)}
                                    onDismiss={() => actions.cancel(r.username, r.id)}
                                />
                            ))}
                        </ul>
                    </section>
                )}

                {/* Friends (filtered live while a query is typed). */}
                {loadingFriends ? (
                    <SkeletonRows count={3} />
                ) : (
                    <>
                        {friends.length === 0 && !searching && (
                            <EmptyState art={<NoFriendsArt />} title="No friends yet">
                                Search by username or ID above to send your first request.
                            </EmptyState>
                        )}
                        {shownFriends.length > 0 && (
                            <section className="sp-sec" aria-label="Friends">
                                <h3 className="sp-sec__title">friends <Count n={shownFriends.length} /></h3>
                                <ul className="sp-list">
                                    {shownFriends.map((f) => (
                                        <FriendRow
                                            key={f.userId}
                                            friend={f}
                                            me={me}
                                            query={q}
                                            confirming={confirming === f.userId}
                                            removing={actions.isBusy(f.username)}
                                            onOpen={() => openFriend(f.username)}
                                            onProfile={() => {
                                                close();
                                                navigate(`/u/${f.username}`);
                                            }}
                                            onAskRemove={() => setConfirming(f.userId)}
                                            onCancelRemove={() => setConfirming(null)}
                                            onConfirmRemove={() => removeFriend(f.username, f.userId)}
                                        />
                                    ))}
                                </ul>
                            </section>
                        )}
                    </>
                )}

                {/* Everyone else: inline below friends, never an overlay. */}
                {searching && q.length >= MIN_SEARCH_LENGTH && (
                    <section className="sp-sec" aria-label="People">
                        {!nothingFound && <h3 className="sp-sec__title">people</h3>}
                        {search.state.status === 'loading' && <SkeletonRows count={2} />}
                        {search.state.status === 'error' && (
                            <div className="sp-note" role="alert">
                                <span>Couldn&apos;t search. {search.state.message}</span>
                                <Button size="sm" variant="ghost" onClick={search.retry}>Retry</Button>
                            </div>
                        )}
                        {search.state.status === 'ready' && people.length > 0 && (
                            <ul className="sp-list">
                                {people.map(({ person, resolved }) => (
                                    <PersonRow
                                        key={person.publicId}
                                        person={person}
                                        resolved={resolved}
                                        query={q}
                                        busy={actions.isBusy(person.username)}
                                        onAdd={() => actions.add(person.username)}
                                        onCancel={() => resolved.requestId && actions.cancel(person.username, resolved.requestId)}
                                        onAccept={() => resolved.requestId && actions.accept(person.username, resolved.requestId)}
                                        onMessage={() => actions.message(person.username)}
                                    />
                                ))}
                            </ul>
                        )}
                        {nothingFound && (
                            <EmptyState art={<NoResultsArt size={72} />} title={matchedSelf ? "That's you" : `No one named "${q}"`}>
                                {matchedSelf
                                    ? 'Try a friend\'s username or ID.'
                                    : 'Usernames match from the start. IDs must be exact.'}
                            </EmptyState>
                        )}
                    </section>
                )}

                {/* Requests you sent: collapsed, they are waiting on someone else. */}
                {!searching && requests.outgoing.length > 0 && (
                    <section className="sp-sec" aria-label="Sent requests">
                        <button
                            type="button"
                            className="sp-sec__toggle"
                            aria-expanded={showSent}
                            onClick={() => setShowSent((v) => !v)}
                        >
                            <span className="sp-sec__title">sent <Count n={requests.outgoing.length} /></span>
                            <Icon name={showSent ? 'chevron-up' : 'chevron-down'} size={16} />
                        </button>
                        {showSent && (
                            <ul className="sp-list">
                                {requests.outgoing.map((r) => (
                                    <RequestRow
                                        key={r.id}
                                        request={r}
                                        direction="outgoing"
                                        busy={actions.isBusy(r.username)}
                                        onDismiss={() => actions.cancel(r.username, r.id)}
                                    />
                                ))}
                            </ul>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}

export default FriendsTab;

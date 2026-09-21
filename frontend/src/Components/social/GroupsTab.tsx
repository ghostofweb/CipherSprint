import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Count from '../ui/Count';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import { NoGroupsArt, NoResultsArt } from '../assets/illustrations';
import GroupRow from './GroupRow';
import { focusMemory } from './focusMemory';
import { useSocial } from '../../Context/SocialContext';
import { useAuth } from '../../Context/AuthContext';

// Only worth a filter box once the list stops fitting at a glance.
const FILTER_FROM = 5;

function GroupsTab() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { groups, loadingGroups, openChat, close } = useSocial();
    const [query, setQuery] = useState('');
    const bodyRef = useRef<HTMLDivElement>(null);
    const q = query.trim();

    useEffect(() => {
        const key = focusMemory.key;
        focusMemory.key = null;
        const target = key ? bodyRef.current?.querySelector<HTMLElement>(`[data-nav-key="${CSS.escape(key)}"]`) : null;
        target?.focus();
    }, []);

    const shown = useMemo(
        () => (q ? groups.filter((g) => g.name.toLowerCase().includes(q.toLowerCase())) : groups),
        [groups, q]
    );

    const go = (path: string) => {
        close();
        navigate(path);
    };

    const navItems = () => Array.from(bodyRef.current?.querySelectorAll<HTMLElement>('[data-nav]:not(:disabled)') ?? []);
    const onListKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        const items = navItems();
        const i = items.indexOf(document.activeElement as HTMLElement);
        if (i === -1) return;
        e.preventDefault();
        items[e.key === 'ArrowDown' ? Math.min(i + 1, items.length - 1) : Math.max(i - 1, 0)]?.focus();
    };

    return (
        <div className="sp-tab">
            {groups.length >= FILTER_FROM && (
                <div className="sp-search">
                    <Input
                        label="Filter your groups"
                        icon="search"
                        placeholder="Filter your groups"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onClear={() => setQuery('')}
                        autoComplete="off"
                        spellCheck={false}
                    />
                </div>
            )}

            <div className="sp-scroll" ref={bodyRef} onKeyDown={onListKeyDown}>
                {loadingGroups ? (
                    <SkeletonRows count={3} />
                ) : groups.length === 0 ? (
                    <EmptyState
                        art={<NoGroupsArt />}
                        title="No groups yet"
                        action={
                            <div className="sp-actions">
                                <Button variant="primary" onClick={() => go('/groups')}>Browse groups</Button>
                                <Button onClick={() => go('/groups?new=1')}>New group</Button>
                            </div>
                        }
                    >
                        Join one to chat with people who type like you.
                    </EmptyState>
                ) : shown.length === 0 ? (
                    <EmptyState art={<NoResultsArt size={72} />} title={`No group named "${q}"`}>
                        Filtering only covers groups you are in.
                    </EmptyState>
                ) : (
                    <section className="sp-sec" aria-label="Your groups">
                        <h3 className="sp-sec__title">your groups <Count n={shown.length} /></h3>
                        <ul className="sp-list">
                            {shown.map((g) => (
                                <GroupRow
                                    key={g._id}
                                    group={g}
                                    me={user?.username ?? ''}
                                    query={q}
                                    onOpen={() => {
                                        focusMemory.key = `group:${g._id}`;
                                        openChat({ kind: 'group', id: g._id });
                                    }}
                                />
                            ))}
                        </ul>
                    </section>
                )}
            </div>

            {groups.length > 0 && (
                <div className="sp-foot">
                    <Button variant="ghost" size="sm" onClick={() => go('/groups')}>Browse groups</Button>
                    <Button variant="ghost" size="sm" onClick={() => go('/groups?new=1')}>New group</Button>
                </div>
            )}
        </div>
    );
}

export default GroupsTab;

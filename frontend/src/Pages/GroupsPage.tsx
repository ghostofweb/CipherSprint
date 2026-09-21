import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { GroupSummary } from '@ciphersprint/shared';
import Avatar from '../Components/Avatar';
import Button from '../Components/ui/Button';
import Input from '../Components/ui/Input';
import Segmented from '../Components/ui/Segmented';
import EmptyState from '../Components/ui/EmptyState';
import { SkeletonRows } from '../Components/ui/Skeleton';
import { NoGroupsArt, NoResultsArt } from '../Components/assets/illustrations';
import CreateGroupDialog from '../Components/CreateGroupDialog';
import { useAuth } from '../Context/AuthContext';
import { useSocial } from '../Context/SocialContext';
import { useDebouncedValue } from '../Hooks/useDebouncedValue';
import { api } from '../Utils/api';
import { openAuthModal } from '../Utils/authModal';
import { cx } from '../Utils/cx';

type Sort = 'members' | 'new';

function GroupsPage() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { refreshGroups } = useSocial();
    const [params, setParams] = useSearchParams();
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState<Sort>('members');
    const [groups, setGroups] = useState<GroupSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [joining, setJoining] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const debounced = useDebouncedValue(query.trim(), 250);
    const creating = params.get('new') === '1';

    // The panel's "New group" links here with ?new=1.
    const setCreating = useCallback(
        (open: boolean) => {
            const next = new URLSearchParams(params);
            if (open) next.set('new', '1');
            else next.delete('new');
            setParams(next, { replace: true });
        },
        [params, setParams]
    );

    useEffect(() => {
        if (!user) return undefined;
        let cancelled = false;
        setLoading(true);
        setError(null);
        api.listGroups(debounced, sort)
            .then((res) => { if (!cancelled) setGroups(res.groups); })
            .catch((err: Error) => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [user, debounced, sort, attempt]);

    const join = async (g: GroupSummary) => {
        setJoining(g._id);
        try {
            await api.joinGroup(g._id);
            setGroups((prev) => prev.map((x) => (x._id === g._id ? { ...x, isMember: true, memberCount: x.memberCount + 1 } : x)));
            refreshGroups();
        } catch (err) {
            toast.error((err as Error).message);
        } finally {
            setJoining(null);
        }
    };

    if (authLoading) return <SkeletonRows count={4} />;

    if (!user) {
        return (
            <EmptyState
                art={<NoGroupsArt />}
                title="Log in to browse groups"
                action={<Button variant="primary" onClick={() => openAuthModal('login')}>Log in</Button>}
            >
                Groups are for signed-in players.
            </EmptyState>
        );
    }

    return (
        <>
            <div className="gd-head">
                <h1 className="page-title">Groups</h1>
                <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>New group</Button>
            </div>

            <div className="gd-toolbar">
                <Input
                    label="Find a group"
                    icon="search"
                    placeholder="Find a group"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onClear={() => setQuery('')}
                    autoComplete="off"
                    spellCheck={false}
                />
                <Segmented<Sort>
                    label="Sort groups"
                    value={sort}
                    onChange={setSort}
                    options={[
                        { value: 'members', label: 'most members' },
                        { value: 'new', label: 'newest' },
                    ]}
                />
            </div>

            <div className="gd-list" aria-busy={loading}>
                {loading && groups.length === 0 ? (
                    <SkeletonRows count={4} />
                ) : error ? (
                    <EmptyState title="Couldn't load groups" action={<Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>}>
                        {error}
                    </EmptyState>
                ) : groups.length === 0 ? (
                    debounced ? (
                        <EmptyState art={<NoResultsArt />} title={`No group starts with "${debounced}"`}>
                            Group names are matched from the start. Try fewer letters, or create it.
                        </EmptyState>
                    ) : (
                        <EmptyState
                            art={<NoGroupsArt />}
                            title="No groups yet"
                            action={<Button variant="primary" onClick={() => setCreating(true)}>Create the first one</Button>}
                        >
                            Start a group for your friends, your team or your keyboard nerds.
                        </EmptyState>
                    )
                ) : (
                    <ul className={cx('gd-rows', loading && 'is-stale')}>
                        {groups.map((g) => (
                            <li key={g._id} className="gd-row">
                                <Link className="gd-row__main" to={`/groups/${g._id}`}>
                                    <Avatar url={g.avatarUrl} name={g.name} size="md" />
                                    <span className="gd-row__text">
                                        <span className="gd-row__name">{g.name}</span>
                                        <span className="gd-row__desc">{g.description || 'No description'}</span>
                                    </span>
                                    <span className="gd-row__count tnum">{g.memberCount} member{g.memberCount === 1 ? '' : 's'}</span>
                                </Link>
                                <div className="gd-row__action">
                                    {g.isMember ? (
                                        <span className="gd-row__joined">Joined</span>
                                    ) : (
                                        <Button size="sm" loading={joining === g._id} onClick={() => join(g)}>Join</Button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <CreateGroupDialog open={creating} onClose={() => setCreating(false)} />
        </>
    );
}

export default GroupsPage;

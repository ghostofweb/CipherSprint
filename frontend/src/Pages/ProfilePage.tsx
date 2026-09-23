import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { PersonalBest, RaceRecord } from '@ciphersprint/shared';
import Avatar from '../Components/Avatar';
import AvatarCropModal from '../Components/AvatarCropModal';
import ActivityCalendar from '../Components/ActivityCalendar';
import FriendAction from '../Components/FriendAction';
import CopyId from '../Components/CopyId';
import Icon from '../Components/ui/Icon';
import Button from '../Components/ui/Button';
import IconButton from '../Components/ui/IconButton';
import Menu from '../Components/ui/Menu';
import DecryptText from '../Components/DecryptText';
import { BlockDialog, ReportDialog } from '../Components/safety/SafetyDialogs';
import EmptyState from '../Components/ui/EmptyState';
import { Skeleton } from '../Components/ui/Skeleton';
import { NoResultsArt, NoTestsArt } from '../Components/assets/illustrations';
import { api, ProfileResult } from '../Utils/api';
import { modeLabel, formatDuration, modeDetailSortKey, formatRelativeTime } from '../Utils/format';
import { cx } from '../Utils/cx';
import { useAuth } from '../Context/AuthContext';
import { useSocial } from '../Context/SocialContext';
import { uploadImage } from '../Utils/upload';

const MODE_ORDER = ['time', 'words', 'quote'];

function groupPersonalBests(personalBests: PersonalBest[]): [string, PersonalBest[]][] {
    const groups = new Map<string, PersonalBest[]>();
    for (const pb of personalBests) {
        if (!groups.has(pb.mode)) groups.set(pb.mode, []);
        groups.get(pb.mode)!.push(pb);
    }
    for (const entries of groups.values()) {
        entries.sort((a, b) => modeDetailSortKey(a.mode, a.modeDetail) - modeDetailSortKey(b.mode, b.modeDetail));
    }
    return [...groups.entries()].sort(([a], [b]) => {
        const ai = MODE_ORDER.indexOf(a);
        const bi = MODE_ORDER.indexOf(b);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
}

function ProfileSkeleton() {
    return (
        <>
            <div className="pf-head">
                <Skeleton width={96} height={96} circle />
                <div className="ui-skel-lines"><Skeleton width="30%" height={20} /><Skeleton width="18%" height={12} /></div>
            </div>
            <div className="pf-stats">
                {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={48} />)}
            </div>
        </>
    );
}

function RaceRecordSection({ username, isOwn }: { username: string; isOwn: boolean }) {
    const [record, setRecord] = useState<RaceRecord | null>(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        let live = true;
        setRecord(null);
        setFailed(false);
        api.raceRecord(username)
            .then((r) => live && setRecord(r))
            .catch(() => live && setFailed(true));
        return () => {
            live = false;
        };
    }, [username]);

    if (failed) return null;
    if (!record) return <Skeleton height={96} />;
    const played = record.wins + record.losses + record.ties;
    const rate = played ? Math.round((record.wins / played) * 100) : 0;

    return (
        <section className="pf-section" aria-labelledby="pf-races">
            <h2 className="pf-h" id="pf-races">Races</h2>
            {played === 0 ? (
                <p className="pf-empty">{isOwn ? 'No races yet. Challenge a friend from the friends panel.' : `${username} hasn't raced yet.`}</p>
            ) : (
                <>
                    <div className="pf-record">
                        <div className="pf-record__big tnum">
                            <span className="is-win">{record.wins}</span>
                            <span className="pf-record__sep">–</span>
                            <span>{record.losses}</span>
                            {record.ties > 0 && (
                                <>
                                    <span className="pf-record__sep">–</span>
                                    <span>{record.ties}</span>
                                </>
                            )}
                        </div>
                        <div className="pf-record__meta">
                            <span>wins – losses{record.ties > 0 ? ' – ties' : ''}</span>
                            <span className="tnum">{rate}% won</span>
                            {record.headToHead && record.headToHead.wins + record.headToHead.losses + record.headToHead.ties > 0 && (
                                <span className="tnum">
                                    against you {record.headToHead.wins}–{record.headToHead.losses}
                                </span>
                            )}
                        </div>
                    </div>
                    <ul className="pf-races">
                        {record.recent.map((r) => (
                            <li key={`${r.code}:${r.endedAt}`} className={cx('pf-race', `is-${r.result}`)}>
                                <span className="pf-race__result">{r.result === 'win' ? 'won' : r.result === 'loss' ? 'lost' : 'tied'}</span>
                                <span className="pf-race__vs">
                                    vs{' '}
                                    {r.opponent ? (
                                        <Link to={`/u/${r.opponent.username}`} className="pf-race__opp">
                                            <Avatar url={r.opponent.avatarUrl} name={r.opponent.username} size="sm" />
                                            {r.opponent.username}
                                        </Link>
                                    ) : (
                                        'someone'
                                    )}
                                </span>
                                <span className="pf-race__mode">{r.format} {r.detail}</span>
                                <span className="pf-race__score tnum">
                                    {r.wpm}
                                    {r.opponentWpm !== null && <span className="pf-race__their"> vs {r.opponentWpm}</span>}
                                </span>
                                <time className="pf-race__when" dateTime={r.endedAt}>{formatRelativeTime(r.endedAt)}</time>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </section>
    );
}

function ProfilePage() {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const { user, updateAvatar } = useAuth();
    const { friends } = useSocial();
    const [data, setData] = useState<ProfileResult | null>(null);
    const [error, setError] = useState<{ status: 'private' | 'missing' | 'other'; message: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [pickedAvatarFile, setPickedAvatarFile] = useState<File | null>(null);
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const [reporting, setReporting] = useState(false);
    const [blocking, setBlocking] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        setData(null);
        api.profile(username as string)
            .then((res) => { if (!cancelled) setData(res); })
            .catch((err: Error) => {
                if (cancelled) return;
                const message = err.message;
                setError({ status: /private/i.test(message) ? 'private' : /not found/i.test(message) ? 'missing' : 'other', message });
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [username]);

    const pbGroups = data ? groupPersonalBests(data.personalBests || []) : [];
    const isOwnProfile = !!user && user.username === username;
    const isFriend = friends.some((f) => f.username === username);

    const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) setPickedAvatarFile(file);
    };

    const handleAvatarCropped = async (blob: Blob) => {
        if (!user) return;
        setAvatarUploading(true);
        try {
            const { url, publicId } = await uploadImage(blob, `users/${user.id}`);
            await updateAvatar(url, publicId);
            setData((d) => (d ? { ...d, avatarUrl: url } : d));
            setPickedAvatarFile(null);
        } catch (err) {
            toast.error((err as Error).message || "Couldn't update your photo");
        } finally {
            setAvatarUploading(false);
        }
    };

    const unblock = async () => {
        await api.unblock(username as string);
        setData((d) => (d ? { ...d, blockedByMe: false } : d));
        toast.success(`Unblocked ${username}`);
    };

    if (loading) return <ProfileSkeleton />;

    if (error || !data) {
        return (
            <EmptyState
                art={<NoResultsArt />}
                title={error?.status === 'private' ? 'This profile is private' : error?.status === 'missing' ? 'No one goes by that name' : "Couldn't load this profile"}
            >
                {error?.status === 'private'
                    ? `${username} has chosen not to share their stats.`
                    : error?.status === 'missing'
                      ? 'Check the spelling, or search by ID from the friends panel.'
                      : error?.message}
            </EmptyState>
        );
    }

    const agg = data.aggregates;
    const noTests = agg.completedTests === 0;

    return (
        <div className="pf">
            <div className="pf-head">
                <div
                    className={isOwnProfile ? 'avatar-editable' : undefined}
                    onClick={isOwnProfile ? () => fileInputRef.current?.click() : undefined}
                    title={isOwnProfile ? 'Change your photo' : undefined}
                >
                    <Avatar url={data.avatarUrl} name={username} size="xl" />
                    {isOwnProfile && <span className="avatar-edit-badge"><Icon name="camera" size={12} /></span>}
                </div>
                {isOwnProfile && (
                    <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarPick} disabled={avatarUploading} />
                )}

                <div className="pf-head__id">
                    <h1 className="page-title">{username}</h1>
                    <div className="pf-head__meta">
                        {data.publicId && <CopyId id={data.publicId} />}
                        <span>Joined {new Date(data.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                </div>

                <div className="pf-head__actions">
                    {data.blockedByMe ? (
                        <Button icon="block" onClick={unblock}>Unblock</Button>
                    ) : (
                        <>
                            <FriendAction username={username as string} />
                            {isFriend && (
                                <Button icon="race" onClick={() => navigate(`/race?with=${encodeURIComponent(username as string)}`)}>Challenge</Button>
                            )}
                        </>
                    )}
                    {user && !isOwnProfile && (
                        <>
                            <IconButton icon="more" label={`More options for ${username}`} onClick={(e) => setMenuAnchor(e.currentTarget)} />
                            <Menu
                                anchorEl={menuAnchor}
                                open={!!menuAnchor}
                                onClose={() => setMenuAnchor(null)}
                                actions={[
                                    { id: 'report', label: 'Report', icon: 'flag', danger: true, onSelect: () => setReporting(true) },
                                    ...(data.blockedByMe ? [] : [{ id: 'block', label: 'Block', icon: 'block' as const, danger: true, onSelect: () => setBlocking(true) }]),
                                ]}
                            />
                        </>
                    )}
                </div>
            </div>

            {data.blockedByMe && <p className="pf-blocked" role="status">You blocked {username}. They can't find, message or race you.</p>}

            <div className="pf-stats">
                <div className="pf-stat pf-stat--hero">
                    <div className="stat-label">best wpm</div>
                    <DecryptText className="pf-hero tnum" text={String(agg.bestWpm)} />
                </div>
                <div className="pf-stat">
                    <div className="stat-label">avg wpm, last 10</div>
                    <div className="pf-stat__value tnum">{agg.avgWpmLast10}</div>
                </div>
                <div className="pf-stat">
                    <div className="stat-label">avg accuracy</div>
                    <div className="pf-stat__value tnum">{agg.avgAccuracyLast10}%</div>
                </div>
                <div className="pf-stat">
                    <div className="stat-label">tests</div>
                    <div className="pf-stat__value tnum">{agg.completedTests}</div>
                </div>
                <div className="pf-stat">
                    <div className="stat-label">time typing</div>
                    <div className="pf-stat__value tnum">{formatDuration(agg.totalTimeTypingSeconds)}</div>
                </div>
                <div className="pf-stat">
                    <div className="stat-label">streak</div>
                    <div className="pf-stat__value tnum">{agg.streak.current}d</div>
                    <div className="stat-sub">best {agg.streak.max}d</div>
                </div>
            </div>

            <div className="pf-cols">
                <section className="pf-section" aria-labelledby="pf-pbs">
                    <h2 className="pf-h" id="pf-pbs">Personal bests</h2>
                    {noTests || pbGroups.length === 0 ? (
                        <EmptyState
                            art={<NoTestsArt />}
                            title="No tests yet"
                            action={isOwnProfile ? <Button variant="primary" onClick={() => navigate('/')}>Take a test</Button> : undefined}
                        >
                            {isOwnProfile ? 'Your best time, words and quote results collect here.' : `${username}'s bests will show up after their first test.`}
                        </EmptyState>
                    ) : (
                        <table className="pf-table">
                            <thead>
                                <tr><th scope="col">test</th><th scope="col" className="num">wpm</th><th scope="col" className="num">acc</th><th scope="col" className="num">consistency</th></tr>
                            </thead>
                            <tbody>
                                {pbGroups.flatMap(([, entries]) => entries).map((pb) => (
                                    <tr key={`${pb.mode}:${pb.modeDetail}`}>
                                        <td>{modeLabel(pb.mode, pb.modeDetail)}</td>
                                        <td className="num pf-table__wpm tnum">{pb.wpm}</td>
                                        <td className="num tnum">{pb.accuracy}%</td>
                                        <td className="num tnum">{pb.consistency}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>

                <RaceRecordSection username={username as string} isOwn={isOwnProfile} />
            </div>

            <section className="pf-section" aria-labelledby="pf-activity">
                <h2 className="pf-h" id="pf-activity">Activity</h2>
                <ActivityCalendar testActivity={agg.testActivity} />
            </section>

            <AvatarCropModal
                file={pickedAvatarFile}
                saving={avatarUploading}
                onCancel={() => setPickedAvatarFile(null)}
                onSave={handleAvatarCropped}
            />
            <ReportDialog target={reporting ? { username: username as string, kind: 'profile' } : null} onClose={() => setReporting(false)} />
            <BlockDialog
                username={blocking ? (username as string) : null}
                onClose={() => setBlocking(false)}
                onBlocked={() => setData((d) => (d ? { ...d, blockedByMe: true } : d))}
            />
        </div>
    );
}

export default ProfilePage;

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { PersonalBest } from '@ciphersprint/shared';
import Avatar from '../Components/Avatar';
import AvatarCropModal from '../Components/AvatarCropModal';
import ActivityCalendar from '../Components/ActivityCalendar';
import FriendAction from '../Components/FriendAction';
import CopyId from '../Components/CopyId';
import Icon from '../Components/ui/Icon';
import EmptyState from '../Components/ui/EmptyState';
import { Skeleton } from '../Components/ui/Skeleton';
import { NoResultsArt } from '../Components/assets/illustrations';
import { api, ProfileResult } from '../Utils/api';
import { modeLabel, formatDuration, modeDetailSortKey } from '../Utils/format';
import { useAuth } from '../Context/AuthContext';
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
            <div className="analytics-tiles">
                {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={48} />)}
            </div>
        </>
    );
}

function ProfilePage() {
    const { username } = useParams<{ username: string }>();
    const { user, updateAvatar } = useAuth();
    const [data, setData] = useState<ProfileResult | null>(null);
    const [error, setError] = useState<{ status: 'private' | 'missing' | 'other'; message: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [pickedAvatarFile, setPickedAvatarFile] = useState<File | null>(null);
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

    return (
        <>
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
                    <FriendAction username={username as string} />
                </div>
            </div>

            <div className="analytics-tiles">
                <div className="stat-block small">
                    <div className="stat-label">tests completed</div>
                    <div className="stat-value tnum">{data.aggregates.completedTests}</div>
                </div>
                <div className="stat-block small">
                    <div className="stat-label">time typing</div>
                    <div className="stat-value tnum">{formatDuration(data.aggregates.totalTimeTypingSeconds)}</div>
                </div>
                <div className="stat-block small">
                    <div className="stat-label">best wpm</div>
                    <div className="stat-value accent tnum">{data.aggregates.bestWpm}</div>
                </div>
                <div className="stat-block small">
                    <div className="stat-label">avg wpm (last 10)</div>
                    <div className="stat-value tnum">{data.aggregates.avgWpmLast10}</div>
                </div>
                <div className="stat-block small">
                    <div className="stat-label">streak</div>
                    <div className="stat-value tnum">{data.aggregates.streak.current}d</div>
                    <div className="stat-sub">best {data.aggregates.streak.max}d</div>
                </div>
            </div>

            <div className="analytics-section">
                <div className="analytics-section-title">personal bests</div>
                {pbGroups.length === 0 ? (
                    <div className="pb-grid">
                        <div className="pb-card">
                            <div className="pb-card-detail">no tests yet</div>
                            <div className="pb-card-wpm">N/A</div>
                            <div className="pb-card-sub">N/A acc &middot; N/A consistency</div>
                        </div>
                    </div>
                ) : (
                    <div className="pb-groups">
                        {pbGroups.map(([mode, entries]) => (
                            <div key={mode}>
                                <div className="pb-group-title">{mode}</div>
                                <div className="pb-grid">
                                    {entries.map((pb) => (
                                        <div className="pb-card" key={`${pb.mode}:${pb.modeDetail}`}>
                                            <div className="pb-card-detail">{modeLabel(pb.mode, pb.modeDetail)}</div>
                                            <div className="pb-card-wpm">{pb.wpm}</div>
                                            <div className="pb-card-sub">{pb.accuracy}% acc &middot; {pb.consistency}% consistency</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="analytics-section">
                <div className="analytics-section-title">activity</div>
                <ActivityCalendar testActivity={data.aggregates.testActivity} />
            </div>

            <AvatarCropModal
                file={pickedAvatarFile}
                saving={avatarUploading}
                onCancel={() => setPickedAvatarFile(null)}
                onSave={handleAvatarCropped}
            />
        </>
    );
}

export default ProfilePage;

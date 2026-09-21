import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { GroupSummary, GroupMemberRow } from '@ciphersprint/shared';
import Avatar from '../Components/Avatar';
import AvatarCropModal from '../Components/AvatarCropModal';
import MemberList from '../Components/MemberList';
import ChatRoom from '../Components/chat/ChatRoom';
import Button from '../Components/ui/Button';
import Dialog from '../Components/ui/Dialog';
import Icon from '../Components/ui/Icon';
import EmptyState from '../Components/ui/EmptyState';
import { Skeleton } from '../Components/ui/Skeleton';
import { NoGroupsArt } from '../Components/assets/illustrations';
import { useChat } from '../Hooks/useChat';
import { useAuth } from '../Context/AuthContext';
import { useSocial } from '../Context/SocialContext';
import { api } from '../Utils/api';
import { uploadImage } from '../Utils/upload';
import { openAuthModal } from '../Utils/authModal';

function GroupChatPage() {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { refreshGroups } = useSocial();
    const [group, setGroup] = useState<GroupSummary | null>(null);
    const [members, setMembers] = useState<GroupMemberRow[]>([]);
    const [isMember, setIsMember] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [pickedAvatarFile, setPickedAvatarFile] = useState<File | null>(null);
    const [membersOpen, setMembersOpen] = useState(false);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [busy, setBusy] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadGroup = useCallback(() => {
        api.getGroup(groupId as string)
            .then((res) => {
                setGroup(res.group);
                setIsMember(res.isMember);
                setMembers(res.members);
                setError(null);
            })
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, [groupId]);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        loadGroup();
    }, [user, loadGroup]);

    const avatarsByUsername = useMemo(
        () => Object.fromEntries(members.map((m) => [m.username, m.avatarUrl])),
        [members]
    );

    const fetchHistory = useCallback((before?: number) => api.groupMessages(groupId as string, before), [groupId]);
    const chat = useChat('group', isMember ? (groupId as string) : null, { fetchHistory });

    const isOwner = !!(group && user && String(group.ownerId) === String(user.id));

    const handleJoin = async () => {
        setBusy(true);
        try {
            await api.joinGroup(groupId as string);
            await refreshGroups();
            loadGroup();
        } catch (err) {
            toast.error((err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    const handleLeave = async () => {
        setBusy(true);
        try {
            await api.leaveGroup(groupId as string);
            await refreshGroups();
            navigate('/groups');
        } catch (err) {
            toast.error((err as Error).message);
            setBusy(false);
        }
    };

    const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) setPickedAvatarFile(file);
    };

    const handleAvatarCropped = async (blob: Blob) => {
        setAvatarUploading(true);
        try {
            const { url, publicId } = await uploadImage(blob, `groups/${groupId}`);
            await api.updateGroupAvatar(groupId as string, url, publicId);
            loadGroup();
            refreshGroups();
            setPickedAvatarFile(null);
        } catch (err) {
            toast.error((err as Error).message || "Couldn't update the group photo");
        } finally {
            setAvatarUploading(false);
        }
    };

    if (authLoading || (user && loading)) {
        return (
            <div className="gp-head">
                <Skeleton width={56} height={56} circle />
                <div className="ui-skel-lines"><Skeleton width="30%" height={16} /><Skeleton width="20%" height={12} /></div>
            </div>
        );
    }

    if (!user) {
        return (
            <EmptyState
                art={<NoGroupsArt />}
                title="Log in to see this group"
                action={<Button variant="primary" onClick={() => openAuthModal('login')}>Log in</Button>}
            >
                Groups are for signed-in players.
            </EmptyState>
        );
    }

    if (error || !group) {
        return (
            <EmptyState
                art={<NoGroupsArt />}
                title="Group not found"
                action={<Button onClick={() => navigate('/groups')}>Browse groups</Button>}
            >
                {error ?? 'It may have been deleted.'}
            </EmptyState>
        );
    }

    return (
        <>
            <div className="gp-crumb">
                <Link to="/groups"><Icon name="arrow-left" size={14} /> Groups</Link>
            </div>

            <div className="gp-head">
                <div
                    className={isOwner ? 'avatar-editable' : undefined}
                    onClick={isOwner ? () => fileInputRef.current?.click() : undefined}
                    title={isOwner ? 'Change group photo' : undefined}
                >
                    <Avatar url={group.avatarUrl} name={group.name} size="lg" />
                    {isOwner && <span className="avatar-edit-badge"><Icon name="camera" size={12} /></span>}
                </div>
                {isOwner && (
                    <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarPick} disabled={avatarUploading} />
                )}

                <div className="gp-head__id">
                    <h1 className="gp-title">{group.name}</h1>
                    {group.description && <p className="gp-desc">{group.description}</p>}
                    <div className="gp-meta">
                        <button type="button" className="gp-meta__members" onClick={() => setMembersOpen(true)}>
                            {members.length} member{members.length === 1 ? '' : 's'}
                        </button>
                    </div>
                </div>

                <div className="gp-head__actions">
                    {isMember ? (
                        confirmLeave ? (
                            <>
                                <span className="gp-confirm">Leave {group.name}?</span>
                                <Button size="sm" variant="ghost" onClick={() => setConfirmLeave(false)}>Cancel</Button>
                                <Button size="sm" variant="danger" loading={busy} onClick={handleLeave}>Leave</Button>
                            </>
                        ) : (
                            <Button variant="ghost" onClick={() => setConfirmLeave(true)}>Leave</Button>
                        )
                    ) : (
                        <Button variant="primary" loading={busy} onClick={handleJoin}>Join</Button>
                    )}
                </div>
            </div>

            <div className="gp-body">
                <div className="gp-chat">
                    {isMember ? (
                        <ChatRoom
                            chat={chat}
                            draftKey={`group:${groupId}`}
                            avatarsByUsername={avatarsByUsername}
                            showNames
                            emptyTitle="No messages yet"
                            emptyBody="Start the conversation."
                            startLabel="This is the start of the conversation."
                            autoFocus
                        />
                    ) : (
                        <EmptyState title="Join to chat" action={<Button variant="primary" loading={busy} onClick={handleJoin}>Join group</Button>}>
                            Only members can read and send messages in {group.name}.
                        </EmptyState>
                    )}
                </div>

                <aside className="gp-roster" aria-label="Members">
                    <h2 className="gp-roster__title">members <span className="ui-count">{members.length}</span></h2>
                    <MemberList members={members} />
                </aside>
            </div>

            <Dialog open={membersOpen} onClose={() => setMembersOpen(false)} title={`Members (${members.length})`} width={360}>
                <MemberList members={members} />
            </Dialog>

            <AvatarCropModal
                file={pickedAvatarFile}
                saving={avatarUploading}
                onCancel={() => setPickedAvatarFile(null)}
                onSave={handleAvatarCropped}
            />
        </>
    );
}

export default GroupChatPage;

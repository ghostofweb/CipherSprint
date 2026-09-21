import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GroupMemberRow, GroupSummary } from '@ciphersprint/shared';
import Avatar from '../Avatar';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import EmptyState from '../ui/EmptyState';
import ChatRoom from '../chat/ChatRoom';
import { useChat } from '../../Hooks/useChat';
import { useSocial, ChatTarget } from '../../Context/SocialContext';
import { useAuth } from '../../Context/AuthContext';
import { api } from '../../Utils/api';

interface HeaderProps {
    avatar: React.ReactNode;
    title: string;
    subtitle?: string;
    onBack: () => void;
    // The one contextual action (view profile / open the full page).
    action?: { icon: 'user' | 'expand'; label: string; onClick: () => void };
}

function Header({ avatar, title, subtitle, onBack, action }: HeaderProps) {
    const { close } = useSocial();
    return (
        <header className="sp-conv__head">
            <IconButton icon="arrow-left" label="Back to list" onClick={onBack} />
            {avatar}
            <div className="sp-conv__id">
                <div className="sp-conv__name">{title}</div>
                {subtitle && <div className="sp-conv__sub">{subtitle}</div>}
            </div>
            {action && <IconButton icon={action.icon} label={action.label} onClick={action.onClick} />}
            <IconButton icon="close" label="Close panel" onClick={close} />
        </header>
    );
}

function DmConversation({ username }: { username: string }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { closeChat, close, friends } = useSocial();
    const [convo, setConvo] = useState<{ id: string; avatarUrl: string | null } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        api.openDm(username)
            .then((res) => { if (!cancelled) setConvo({ id: res.conversation._id, avatarUrl: res.otherUser.avatarUrl }); })
            .catch((err: Error) => { if (!cancelled) setError(err.message); });
        return () => { cancelled = true; };
    }, [username]);

    const fetchHistory = useCallback((before?: number) => api.dmMessages(username, before), [username]);
    const chat = useChat('dm', convo?.id ?? null, { fetchHistory });

    const friend = friends.find((f) => f.username === username);
    const avatars = useMemo(
        () => ({ [user?.username ?? '']: user?.avatarUrl, [username]: convo?.avatarUrl ?? friend?.avatarUrl }),
        [user, username, convo, friend]
    );

    return (
        <div className="sp-conv">
            <Header
                avatar={<Avatar url={convo?.avatarUrl ?? friend?.avatarUrl} name={username} size="md" presence={friend ? (friend.online ? 'online' : 'offline') : undefined} />}
                title={username}
                subtitle={friend ? (friend.online ? 'online' : 'offline') : undefined}
                onBack={closeChat}
                action={{
                    icon: 'user',
                    label: `View ${username}'s profile`,
                    onClick: () => {
                        close();
                        navigate(`/u/${username}`);
                    },
                }}
            />
            {error ? (
                <EmptyState title="Can't open this conversation">{error}</EmptyState>
            ) : (
                <ChatRoom
                    chat={chat}
                    draftKey={`dm:${username}`}
                    avatarsByUsername={avatars}
                    disabled={!convo}
                    emptyTitle="No messages yet"
                    emptyBody={`Say hi to ${username}.`}
                    startLabel={`This is the start of your conversation with ${username}.`}
                    autoFocus
                />
            )}
        </div>
    );
}

function GroupConversation({ id }: { id: string }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { closeChat, close, refreshGroups } = useSocial();
    const [info, setInfo] = useState<{ group: GroupSummary; members: GroupMemberRow[]; isMember: boolean } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(() => {
        api.getGroup(id)
            .then((res) => setInfo({ group: res.group, members: res.members, isMember: res.isMember }))
            .catch((err: Error) => setError(err.message));
    }, [id]);
    useEffect(load, [load]);

    const fetchHistory = useCallback((before?: number) => api.groupMessages(id, before), [id]);
    const chat = useChat('group', info?.isMember ? id : null, { fetchHistory });

    const avatars = useMemo(
        () => Object.fromEntries((info?.members ?? []).map((m) => [m.username, m.avatarUrl])),
        [info]
    );

    const join = async () => {
        await api.joinGroup(id);
        await refreshGroups();
        load();
    };

    const memberCount = info?.members.length ?? info?.group.memberCount;

    return (
        <div className="sp-conv">
            <Header
                avatar={<Avatar url={info?.group.avatarUrl} name={info?.group.name ?? 'group'} size="md" />}
                title={info?.group.name ?? 'Group'}
                subtitle={memberCount !== undefined ? `${memberCount} member${memberCount === 1 ? '' : 's'}` : undefined}
                onBack={closeChat}
                action={{
                    icon: 'expand',
                    label: 'Open group page',
                    onClick: () => {
                        close();
                        navigate(`/groups/${id}`);
                    },
                }}
            />
            {error ? (
                <EmptyState title="Can't open this group">{error}</EmptyState>
            ) : info && !info.isMember ? (
                <EmptyState title="Join to chat" action={<Button variant="primary" onClick={join}>Join group</Button>}>
                    Only members can read and send messages in {info.group.name}.
                </EmptyState>
            ) : (
                <ChatRoom
                    chat={chat}
                    draftKey={`group:${id}`}
                    avatarsByUsername={{ ...avatars, [user?.username ?? '']: user?.avatarUrl }}
                    showNames
                    disabled={!info}
                    emptyTitle="No messages yet"
                    emptyBody="Start the conversation."
                    startLabel="This is the start of the conversation."
                    autoFocus
                />
            )}
        </div>
    );
}

function ConversationView({ target }: { target: ChatTarget }) {
    return target.kind === 'dm' ? <DmConversation key={`dm:${target.username}`} username={target.username} /> : <GroupConversation key={`g:${target.id}`} id={target.id} />;
}

export default ConversationView;

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Button from './ui/Button';
import Icon from './ui/Icon';
import { useAuth } from '../Context/AuthContext';
import { useSocial } from '../Context/SocialContext';
import { useFriendActions } from '../Hooks/useFriendActions';
import { resolveRelationship } from '../Utils/relationship';
import { openAuthModal } from '../Utils/authModal';

// The one place a profile offers "add / requested / accept / message" for
// someone else: the relationship comes from the live lists in SocialContext,
// and the actions are the same ones the panel's search results use.
function FriendAction({ username }: { username: string }) {
    const { user } = useAuth();
    const { friends, requests, loadingFriends, openChat } = useSocial();
    const actions = useFriendActions();
    const [busy, setBusy] = useState(false);

    if (!user) {
        return <Button variant="primary" icon="user-plus" onClick={() => openAuthModal('login')}>Log in to add</Button>;
    }
    if (user.username === username) return null;

    const { relationship, requestId } = resolveRelationship({ username, relationship: 'none' }, friends, requests, !loadingFriends);

    const run = async (fn: () => Promise<unknown>) => {
        setBusy(true);
        try {
            await fn();
        } catch (err) {
            toast.error((err as Error).message || 'Something went wrong');
        } finally {
            setBusy(false);
        }
    };

    if (relationship === 'friends') {
        return (
            <div className="pf-actions">
                <span className="pf-state"><Icon name="check" size={14} /> Friends</span>
                <Button icon="chat" onClick={() => openChat({ kind: 'dm', username })}>Message</Button>
            </div>
        );
    }
    if (relationship === 'outgoing' && requestId) {
        return (
            <div className="pf-actions">
                <span className="pf-state">Request sent</span>
                <Button variant="ghost" loading={busy} onClick={() => run(() => actions.cancel(requestId))}>Cancel</Button>
            </div>
        );
    }
    if (relationship === 'incoming' && requestId) {
        return (
            <div className="pf-actions">
                <Button variant="primary" icon="check" loading={busy} onClick={() => run(() => actions.accept(requestId))}>Accept request</Button>
                <Button variant="ghost" disabled={busy} onClick={() => run(() => actions.decline(requestId))}>Decline</Button>
            </div>
        );
    }
    return <Button variant="primary" icon="user-plus" loading={busy} onClick={() => run(() => actions.send(username))}>Add friend</Button>;
}

export default FriendAction;

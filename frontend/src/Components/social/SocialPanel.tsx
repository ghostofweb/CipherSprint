import React, { useMemo } from 'react';
import { Drawer } from '@mui/material';
import IconButton from '../ui/IconButton';
import Tabs from '../ui/Tabs';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import { NoFriendsArt } from '../assets/illustrations';
import FriendsTab from './FriendsTab';
import GroupsTab from './GroupsTab';
import ConversationView from './ConversationView';
import { useSocial, SocialTab } from '../../Context/SocialContext';
import { useAuth } from '../../Context/AuthContext';
import { openAuthModal } from '../../Utils/authModal';

// A slim strip under the header while the socket is down: messages cannot go
// out and nothing live arrives until it is back.
function ConnectionBanner() {
    return (
        <div className="sp-banner" role="status">
            <Spinner size={12} />
            Reconnecting...
        </div>
    );
}

function SocialPanel() {
    const { user } = useAuth();
    const { isOpen, close, activeTab, setActiveTab, activeChat, connected, friends, groups, requests } = useSocial();

    const friendsBadge = useMemo(
        () => requests.incoming.length + friends.reduce((n, f) => n + (f.unreadCount || 0), 0),
        [friends, requests]
    );
    const groupsBadge = useMemo(() => groups.reduce((n, g) => n + (g.unreadCount ?? 0), 0), [groups]);

    return (
        <Drawer
            anchor="right"
            open={isOpen}
            onClose={close}
            transitionDuration={{ enter: 180, exit: 140 }}
            slotProps={{
                paper: { className: 'sp-paper', role: 'dialog', 'aria-label': 'Friends and groups' } as React.HTMLAttributes<HTMLElement>,
                backdrop: { style: { background: 'rgba(0, 0, 0, 0.45)' } },
            }}
        >
            {!user ? (
                <>
                    <header className="sp-head sp-head--plain">
                        <div className="sp-head__title">Friends and groups</div>
                        <IconButton icon="close" label="Close panel" onClick={close} />
                    </header>
                    <div className="sp-body">
                        <EmptyState
                            art={<NoFriendsArt />}
                            title="Log in to play with friends"
                            action={
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        close();
                                        openAuthModal('login');
                                    }}
                                >
                                    Log in
                                </Button>
                            }
                        >
                            Add friends, join groups and chat while you race.
                        </EmptyState>
                    </div>
                </>
            ) : (
                <>
                    {!activeChat && (
                        <header className="sp-head">
                            <Tabs<SocialTab>
                                label="Friends and groups"
                                value={activeTab}
                                onChange={setActiveTab}
                                tabs={[
                                    { id: 'friends', label: 'friends', count: friendsBadge, accentCount: friendsBadge > 0 },
                                    { id: 'groups', label: 'groups', count: groupsBadge, accentCount: groupsBadge > 0 },
                                ]}
                            />
                            <IconButton icon="close" label="Close panel" onClick={close} />
                        </header>
                    )}
                    {!connected && <ConnectionBanner />}
                    <div className="sp-body">
                        {activeChat ? <ConversationView target={activeChat} /> : activeTab === 'friends' ? <FriendsTab /> : <GroupsTab />}
                    </div>
                </>
            )}
        </Drawer>
    );
}

export default SocialPanel;

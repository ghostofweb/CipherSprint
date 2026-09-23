import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { RaceInvite } from '@ciphersprint/shared';
import { useAuth } from '../../Context/AuthContext';
import { getSocket } from '../../Utils/socket';
import { describeSettings } from '../../Utils/race';

// A friend's challenge, wherever you are in the app: a toast with a Join
// button, the same shape as the friend-request toast.
function RaceInvites() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    useEffect(() => {
        if (!user) return undefined;
        const socket = getSocket();
        if (!socket) return undefined;

        const onInvite = (invite: RaceInvite) => {
            // Already in that room: nothing to announce.
            if (pathname === `/race/${invite.code}`) return;
            toast.info(
                ({ closeToast }) => (
                    <div className="toast-action">
                        <span>
                            {invite.from.username} challenged you to a race
                            <span className="toast-sub">{describeSettings(invite.settings)}</span>
                        </span>
                        <button
                            type="button"
                            className="toast-link"
                            onClick={() => {
                                closeToast?.();
                                navigate(`/race/${invite.code}`);
                            }}
                        >
                            Join
                        </button>
                    </div>
                ),
                { toastId: `race-invite-${invite.code}`, autoClose: 15000 }
            );
        };

        socket.on('race:invited', onInvite);
        return () => {
            socket.off('race:invited', onInvite);
        };
    }, [user, navigate, pathname]);

    return null;
}

export default RaceInvites;

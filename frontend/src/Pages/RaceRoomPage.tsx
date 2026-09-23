import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Footer from '../Components/Footer';
import SiteHeader from '../Components/SiteHeader';
import Button from '../Components/ui/Button';
import Dialog from '../Components/ui/Dialog';
import EmptyState from '../Components/ui/EmptyState';
import Spinner from '../Components/ui/Spinner';
import RaceLobby from '../Components/race/RaceLobby';
import RaceResults from '../Components/race/RaceResults';
import RaceView from '../Components/race/RaceView';
import RaceWatching from '../Components/race/RaceWatching';
import { useAuth } from '../Context/AuthContext';
import { useRace } from '../Hooks/useRace';
import { openAuthModal } from '../Utils/authModal';

const CLOSED_COPY = {
    kicked: 'The host removed you from the race.',
    'host-left': 'The host left, so the race was closed.',
    'opponent-left': 'Your opponent left before the race started.',
    expired: 'That race timed out.',
} as const;

// One race room, whatever stage it is at: lobby, countdown and race, or
// results. Lives outside the app layout (like the typing test) so the nav and
// footer can step aside while you type.
function RaceRoomPage() {
    const { code = '' } = useParams();
    const roomCode = code.toUpperCase();
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const room = useRace(roomCode);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [leaving, setLeaving] = useState(false);

    const { snapshot, status, closed } = room;
    const racing = !!snapshot && room.canType && (snapshot.phase === 'countdown' || snapshot.phase === 'running');
    const hideChrome = racing && snapshot?.phase === 'running';

    useEffect(() => {
        if (!closed) return;
        toast.info(CLOSED_COPY[closed]);
        navigate('/race', { replace: true });
    }, [closed, navigate]);

    // Closing the tab mid-race forfeits it: let the browser ask first.
    useEffect(() => {
        if (!racing) return undefined;
        const warn = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [racing]);

    const leave = async () => {
        setLeaving(true);
        await room.actions.leave();
        navigate('/race');
    };

    const onLogo = () => {
        if (racing) setConfirmLeave(true);
        else navigate('/');
    };

    let body: React.ReactNode;
    if (loading || (user && status === 'joining')) {
        body = <div className="route-loading"><Spinner size={20} /></div>;
    } else if (!user) {
        body = (
            <EmptyState title="Log in to join this race" action={<Button variant="primary" onClick={() => openAuthModal('login')}>Log in</Button>}>
                Racing needs an account so your opponent knows who they're up against.
            </EmptyState>
        );
    } else if (status === 'error') {
        body = (
            <EmptyState
                title="Can't open this race"
                action={
                    room.error?.code ? (
                        <Button variant="primary" onClick={() => navigate(`/race/${room.error?.code}`)}>Go to your race</Button>
                    ) : (
                        <Button variant="primary" onClick={() => navigate('/race')}>Back to races</Button>
                    )
                }
            >
                {room.error?.message}
            </EmptyState>
        );
    } else if (snapshot && room.me) {
        if (snapshot.phase === 'lobby') {
            body = (
                <RaceLobby
                    snapshot={snapshot}
                    me={room.me}
                    isHost={room.isHost}
                    onSettings={(s) => { void room.actions.updateSettings(s); }}
                    onStart={room.actions.start}
                    onKick={room.actions.kick}
                    onInvite={room.actions.invite}
                    onLeave={leave}
                />
            );
        } else if (snapshot.phase === 'finished') {
            body = <RaceResults key={snapshot.round} snapshot={snapshot} me={room.me} onRematch={room.actions.rematch} onLeave={leave} />;
        } else if (room.canType && room.startAt !== null && snapshot.words) {
            body = <RaceView key={snapshot.round} room={room} snapshot={snapshot} startAt={room.startAt} />;
        } else {
            body = <RaceWatching room={room} snapshot={snapshot} />;
        }
    }

    return (
        <div className="canvas">
            <SiteHeader hideChrome={hideChrome} onLogoClick={onLogo} />
            <main className="page race-main">
                {user && !room.connected && <div className="race-banner" role="status">Reconnecting…</div>}
                {body}
            </main>
            <Footer hidden={hideChrome} />
            <Dialog open={confirmLeave} onClose={() => setConfirmLeave(false)} title="Leave this race?" width={360} dismissible={!leaving}>
                <p className="race-confirm">
                    You'll forfeit, and {room.opponent ? room.opponent.username : 'your opponent'} wins.
                </p>
                <div className="ui-dialog__actions">
                    <Button variant="ghost" onClick={() => setConfirmLeave(false)} disabled={leaving}>Stay</Button>
                    <Button variant="danger" onClick={leave} loading={leaving}>Leave and forfeit</Button>
                </div>
            </Dialog>
        </div>
    );
}

export default RaceRoomPage;

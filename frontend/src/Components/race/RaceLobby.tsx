import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import type { RaceAck, RaceSettings, RaceSnapshot } from '@ciphersprint/shared';
import Avatar from '../Avatar';
import Button from '../ui/Button';
import RaceSettingsForm from './RaceSettingsForm';
import { useSocial } from '../../Context/SocialContext';
import { describeModifiers, describeFormat, raceLink } from '../../Utils/race';

interface RaceLobbyProps {
    snapshot: RaceSnapshot;
    me: string;
    isHost: boolean;
    onSettings: (settings: RaceSettings) => void;
    onStart: () => Promise<RaceAck>;
    onKick: () => Promise<RaceAck>;
    onInvite: (username: string) => Promise<RaceAck>;
    onLeave: () => void;
}

const INVITE_COOLDOWN_MS = 10_000;

// Friends the host can pull in, online ones first. An invite is a toast on
// the friend's screen with a Join button; the code works for anyone else.
function InviteFriends({ onInvite }: { onInvite: (username: string) => Promise<RaceAck> }) {
    const { friends } = useSocial();
    const [sent, setSent] = useState<Record<string, number>>({});
    const [busy, setBusy] = useState<string | null>(null);
    const [, tick] = useState(0);

    const ordered = useMemo(
        () => friends.slice().sort((a, b) => Number(b.online) - Number(a.online) || a.username.localeCompare(b.username)),
        [friends]
    );

    // Re-enable "Invite" once the cooldown passes.
    useEffect(() => {
        if (Object.keys(sent).length === 0) return undefined;
        const id = setInterval(() => tick((n) => n + 1), 1000);
        return () => clearInterval(id);
    }, [sent]);

    const invite = async (username: string) => {
        setBusy(username);
        const res = await onInvite(username);
        setBusy(null);
        if (res.ok) setSent((s) => ({ ...s, [username]: Date.now() }));
        else toast.error(res.error);
    };

    if (ordered.length === 0) {
        return <p className="rl-note">No friends to invite yet. Share the code or link instead.</p>;
    }

    return (
        <ul className="rl-friends" aria-label="Invite a friend">
            {ordered.map((f) => {
                const at = sent[f.username];
                const invited = at !== undefined && Date.now() - at < INVITE_COOLDOWN_MS;
                return (
                    <li key={f.userId} className="rl-friend">
                        <Avatar url={f.avatarUrl} name={f.username} size="sm" presence={f.online ? 'online' : 'offline'} />
                        <span className="rl-friend__name">{f.username}</span>
                        <span className="rl-friend__status">{f.online ? 'online' : 'offline'}</span>
                        <Button size="sm" variant="ghost" disabled={!f.online || invited || busy === f.username} loading={busy === f.username} onClick={() => invite(f.username)}>
                            {invited ? 'Invited' : 'Invite'}
                        </Button>
                    </li>
                );
            })}
        </ul>
    );
}

function RaceLobby({ snapshot, me, isHost, onSettings, onStart, onKick, onInvite, onLeave }: RaceLobbyProps) {
    const { code, players, settings, hostId } = snapshot;
    const [copied, setCopied] = useState(false);
    const [starting, setStarting] = useState(false);
    const [startError, setStartError] = useState<string | null>(null);
    const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

    const opponent = players.find((p) => p.userId !== hostId);
    const host = players.find((p) => p.userId === hostId);
    const ready = players.length === 2 && players.every((p) => p.connected);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(raceLink(code));
            setCopied(true);
            if (copyTimer.current) clearTimeout(copyTimer.current);
            copyTimer.current = setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error(`Couldn't copy. The code is ${code}.`);
        }
    };

    const start = async () => {
        setStarting(true);
        setStartError(null);
        const res = await onStart();
        if (!res.ok) setStartError(res.error);
        setStarting(false);
    };

    const kick = async () => {
        const res = await onKick();
        if (!res.ok) toast.error(res.error);
    };

    const modifiers = describeModifiers(settings);

    return (
        <section className="rl" aria-label="Race lobby">
            <h1 className="visually-hidden">Race lobby</h1>
            <header className="rl-head">
                <div>
                    <div className="rl-label">Room code</div>
                    <div className="rl-code tnum" aria-label={`Room code ${code.split('').join(' ')}`}>{code}</div>
                </div>
                <Button size="sm" icon={copied ? 'check' : 'link'} onClick={copyLink}>
                    {copied ? 'Copied' : 'Copy link'}
                </Button>
            </header>
            {(snapshot.quickMatch || snapshot.spectators > 0 || !players.some((p) => p.userId === me)) && (
                <p className="rl-status" role="status">
                    {snapshot.quickMatch && <span><strong>Quick match.</strong> The race starts as soon as you're both here.</span>}
                    {!players.some((p) => p.userId === me) && <span>You're watching. This race is full.</span>}
                    {snapshot.spectators > 0 && <span className="tnum">{snapshot.spectators} watching</span>}
                </p>
            )}

            <div className="rl-cols">
                <div className="rl-col">
                    <h2 className="rl-h">Players</h2>
                    <ul className="rl-seats">
                        {host && (
                            <li className="rl-seat">
                                <Avatar url={host.avatarUrl} name={host.username} size="md" presence={host.connected ? 'online' : 'offline'} />
                                <span className="rl-seat__name">
                                    {host.username}
                                    {host.userId === me && <span className="rl-seat__tag"> (you)</span>}
                                </span>
                                <span className="rl-seat__role">host</span>
                            </li>
                        )}
                        {opponent ? (
                            <li className="rl-seat">
                                <Avatar url={opponent.avatarUrl} name={opponent.username} size="md" presence={opponent.connected ? 'online' : 'offline'} />
                                <span className="rl-seat__name">
                                    {opponent.username}
                                    {opponent.userId === me && <span className="rl-seat__tag"> (you)</span>}
                                </span>
                                <span className="rl-seat__role">{opponent.connected ? 'ready' : 'reconnecting'}</span>
                                {isHost && <Button size="sm" variant="ghost" onClick={kick}>Remove</Button>}
                            </li>
                        ) : (
                            <li className="rl-seat rl-seat--empty">
                                <span className="rl-waiting">Waiting for an opponent<span className="rl-caret" aria-hidden="true" /></span>
                            </li>
                        )}
                    </ul>

                    {isHost && !opponent && (
                        <>
                            <h2 className="rl-h">Invite a friend</h2>
                            <InviteFriends onInvite={onInvite} />
                        </>
                    )}
                </div>

                <div className="rl-col">
                    <h2 className="rl-h">Settings</h2>
                    {isHost ? (
                        <RaceSettingsForm settings={settings} onChange={onSettings} />
                    ) : (
                        <dl className="rl-summary">
                            <dt>Format</dt>
                            <dd>{describeFormat(settings)}</dd>
                            <dt>Text</dt>
                            <dd>{modifiers.length ? modifiers.join(', ') : 'plain words'}</dd>
                        </dl>
                    )}
                </div>
            </div>

            <footer className="rl-foot">
                {isHost ? (
                    <Button variant="primary" onClick={start} disabled={!ready} loading={starting}>
                        {ready ? 'Start race' : opponent ? 'Waiting for reconnect' : 'Waiting for an opponent'}
                    </Button>
                ) : (
                    <span className="rl-wait">Waiting for {host?.username ?? 'the host'} to start<span className="rl-caret" aria-hidden="true" /></span>
                )}
                <Button variant="ghost" onClick={onLeave}>Leave</Button>
                {startError && <div className="ui-hint ui-hint--error" role="alert">{startError}</div>}
            </footer>
        </section>
    );
}

export default RaceLobby;

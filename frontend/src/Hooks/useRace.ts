import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
    RaceAck,
    RaceClosed,
    RaceFinishInput,
    RacePlayer,
    RaceProgress,
    RaceSettings,
    RaceSnapshot,
} from '@ciphersprint/shared';
import { useAuth } from '../Context/AuthContext';
import { getSocket } from '../Utils/socket';
import { ACK_TIMEOUT_MS, raceCall } from '../Utils/raceSocket';

type Status = 'joining' | 'ready' | 'error' | 'closed';

const PROGRESS_INTERVAL_MS = 100;
// Leaving is deferred a moment so a remount of the same room (or a quick
// route change that lands back on it) does not forfeit a race.
const LEAVE_DELAY_MS = 150;
const pendingLeaves = new Map<string, ReturnType<typeof setTimeout>>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// One race room, live: the snapshot, the opponent's caret, the shared clock,
// and every action the room allows. Joining is idempotent, so the same call
// covers first entry, a reload, and a reconnect.
export function useRace(code: string) {
    const { user } = useAuth();
    const [status, setStatus] = useState<Status>('joining');
    const [error, setError] = useState<{ message: string; code?: string } | null>(null);
    const [closed, setClosed] = useState<RaceClosed['reason'] | null>(null);
    const [snapshot, setSnapshot] = useState<RaceSnapshot | null>(null);
    const [progress, setProgress] = useState<Record<string, RaceProgress>>({});
    const [connected, setConnected] = useState(true);
    // The round whose countdown this page saw. Someone who arrives mid-race
    // (a reload) never armed, so they can watch but not type.
    const [armedRound, setArmedRound] = useState<number | null>(null);

    // Server clock minus local clock. Every sample is the true offset minus
    // that message's travel time, so the largest one is the most accurate.
    const offsetRef = useRef<number | null>(null);
    const leftRef = useRef(false);
    const latestProgress = useRef<{ word: number; char: number; wpm: number } | null>(null);
    const lastSent = useRef('');

    const noteClock = useCallback((serverNow: number, at: number = Date.now()) => {
        const sample = serverNow - at;
        offsetRef.current = offsetRef.current === null ? sample : Math.max(offsetRef.current, sample);
    }, []);

    const applySnapshot = useCallback(
        (snap: RaceSnapshot) => {
            if (snap.code !== code) return;
            noteClock(snap.serverNow);
            setSnapshot(snap);
            setStatus('ready');
            setError(null);
            if (snap.phase === 'countdown') {
                setArmedRound(snap.round);
                setProgress({});
                latestProgress.current = null;
                lastSent.current = '';
            } else if (snap.phase === 'lobby') {
                setProgress({});
            }
        },
        [code, noteClock]
    );

    useEffect(() => {
        if (!user) return undefined;
        const socket = getSocket();
        if (!socket) return undefined;

        leftRef.current = false;
        const pending = pendingLeaves.get(code);
        if (pending) {
            clearTimeout(pending);
            pendingLeaves.delete(code);
        }
        setStatus('joining');
        let cancelled = false;

        const join = () => {
            const sentAt = Date.now();
            socket.timeout(ACK_TIMEOUT_MS).emit('race:join', { code }, (err: Error | null, res: RaceAck<{ snapshot: RaceSnapshot }>) => {
                if (cancelled) return;
                if (err) {
                    setError({ message: "The server didn't answer. Try again." });
                    setStatus('error');
                    return;
                }
                if (!res.ok) {
                    setError({ message: res.error, code: res.code });
                    setStatus('error');
                    return;
                }
                // The round trip's midpoint is the best single clock reading.
                noteClock(res.snapshot.serverNow, (sentAt + Date.now()) / 2);
                applySnapshot(res.snapshot);
            });
        };

        const onProgress = (p: RaceProgress) => setProgress((prev) => ({ ...prev, [p.userId]: p }));
        const onClosed = (c: RaceClosed) => {
            if (c.code !== code) return;
            setClosed(c.reason);
            setStatus('closed');
            setSnapshot(null);
        };
        const onConnect = () => {
            setConnected(true);
            join();
        };
        const onDisconnect = () => setConnected(false);

        socket.on('race:state', applySnapshot);
        socket.on('race:countdown', applySnapshot);
        socket.on('race:progress', onProgress);
        socket.on('race:closed', onClosed);
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        setConnected(socket.connected);
        if (socket.connected) join();

        return () => {
            cancelled = true;
            socket.off('race:state', applySnapshot);
            socket.off('race:countdown', applySnapshot);
            socket.off('race:progress', onProgress);
            socket.off('race:closed', onClosed);
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            if (!leftRef.current) {
                pendingLeaves.set(
                    code,
                    setTimeout(() => {
                        pendingLeaves.delete(code);
                        socket.emit('race:leave', { code });
                    }, LEAVE_DELAY_MS)
                );
            }
        };
    }, [user, code, applySnapshot, noteClock]);

    const phase = snapshot?.phase;
    // Someone who opened a full or running race watches instead of racing.
    const isSpectator = !!snapshot && !!user && !snapshot.players.some((p) => p.userId === user.id);
    const canType = !!snapshot && !isSpectator && (phase === 'countdown' || phase === 'running') && armedRound === snapshot.round;

    // Stream the caret position while racing: at most every 100ms, and only
    // when it has changed.
    useEffect(() => {
        if (phase !== 'running' || !canType) return undefined;
        const id = setInterval(() => {
            const p = latestProgress.current;
            if (!p) return;
            const key = `${p.word}:${p.char}:${p.wpm}`;
            if (key === lastSent.current) return;
            lastSent.current = key;
            getSocket()?.volatile.emit('race:progress', { code, ...p });
        }, PROGRESS_INTERVAL_MS);
        return () => clearInterval(id);
    }, [phase, canType, code]);

    const reportProgress = useCallback((word: number, char: number, wpm: number) => {
        latestProgress.current = { word, char, wpm };
    }, []);

    const send = useCallback(<T extends object = Record<string, never>>(event: string, payload: object = {}) => raceCall<T>(event, { code, ...payload }), [code]);

    const actions = useMemo(
        () => ({
            reportProgress,
            start: () => send('race:start'),
            updateSettings: (settings: RaceSettings) => send('race:settings', { settings }),
            kick: () => send('race:kick'),
            invite: (username: string) => send('race:invite', { username }),
            rematch: () => send('race:rematch'),
            leave: () => {
                leftRef.current = true;
                return send('race:leave');
            },
            // A result that lands a beat before the server's clock reaches the
            // end (small clock drift) is retried; anything else is final.
            finish: async (stats: RaceFinishInput['stats']) => {
                for (let attempt = 0; attempt < 5; attempt++) {
                    const res = await send('race:finish', { stats });
                    if (res.ok) return true;
                    if (!/before the time/i.test(res.error)) return false;
                    await sleep(700);
                }
                return false;
            },
        }),
        [reportProgress, send]
    );

    const me = user?.id ?? null;
    const players: RacePlayer[] = snapshot?.players ?? [];
    const opponent = players.find((p) => p.userId !== me) ?? null;
    const startAt = snapshot?.startsAt != null && offsetRef.current !== null ? snapshot.startsAt - offsetRef.current : null;

    return {
        status,
        error,
        closed,
        snapshot,
        me,
        isHost: !!snapshot && snapshot.hostId === me,
        isSpectator,
        opponent,
        progress,
        startAt,
        canType,
        connected,
        actions,
    };
}

export type RaceRoom = ReturnType<typeof useRace>;

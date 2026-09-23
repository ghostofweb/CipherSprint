import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { QUICK_MATCH_PRESETS } from '@ciphersprint/shared';
import type { RaceMatched } from '@ciphersprint/shared';
import Button from '../ui/Button';
import Segmented from '../ui/Segmented';
import { getSocket } from '../../Utils/socket';
import { raceCall } from '../../Utils/raceSocket';

type Preset = (typeof QUICK_MATCH_PRESETS)[number];

const LABELS: Record<Preset, string> = { time30: 'time 30s', words30: 'words 30', quote: 'quote' };

const clock = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// Race whoever else is looking for a race right now: pick a format, wait to
// be paired, and the race starts by itself once you both arrive.
function QuickMatch({ autoStart = false }: { autoStart?: boolean }) {
    const navigate = useNavigate();
    const [preset, setPreset] = useState<Preset>('time30');
    const [since, setSince] = useState<number | null>(null);
    const [now, setNow] = useState(Date.now());
    const [busy, setBusy] = useState(false);
    const searchingRef = useRef(false);

    const goTo = useCallback(
        (m: RaceMatched) => {
            searchingRef.current = false;
            setSince(null);
            toast.success(`Matched with ${m.opponent.username}`);
            navigate(`/race/${m.code}`);
        },
        [navigate]
    );

    const search = useCallback(async () => {
        setBusy(true);
        const res = await raceCall<{ queued?: true; matched?: RaceMatched }>('race:queue', { preset });
        setBusy(false);
        if (!res.ok) {
            toast.error(res.error);
            return;
        }
        if (res.matched) return goTo(res.matched);
        searchingRef.current = true;
        setSince(Date.now());
    }, [preset, goTo]);

    const cancel = useCallback(async () => {
        searchingRef.current = false;
        setSince(null);
        await raceCall('race:queue:cancel', {});
    }, []);

    // Being paired while waiting arrives as an event.
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return undefined;
        const onMatched = (m: RaceMatched) => {
            if (searchingRef.current) goTo(m);
        };
        socket.on('race:matched', onMatched);
        return () => {
            socket.off('race:matched', onMatched);
        };
    }, [goTo]);

    // Leaving the page stops searching.
    useEffect(() => () => {
        if (searchingRef.current) void raceCall('race:queue:cancel', {});
    }, []);

    useEffect(() => {
        if (since === null) return undefined;
        const id = setInterval(() => setNow(Date.now()), 250);
        return () => clearInterval(id);
    }, [since]);

    const started = useRef(false);
    useEffect(() => {
        if (autoStart && !started.current) {
            started.current = true;
            void search();
        }
    }, [autoStart, search]);

    const searching = since !== null;

    return (
        <div className="qm">
            <p className="qm-lede">Race someone who is looking for a race right now.</p>
            <Segmented label="Quick match format" value={preset} onChange={(p) => !searching && setPreset(p)} options={QUICK_MATCH_PRESETS.map((p) => ({ value: p, label: LABELS[p] }))} />
            {searching ? (
                <div className="qm-searching" role="status">
                    <span className="qm-pulse" aria-hidden="true" />
                    <span>
                        Searching for an opponent <span className="tnum">{clock(now - since)}</span>
                    </span>
                    <Button size="sm" variant="ghost" onClick={cancel}>Cancel</Button>
                </div>
            ) : (
                <Button variant="primary" icon="bolt" onClick={search} loading={busy}>Find an opponent</Button>
            )}
        </div>
    );
}

export default QuickMatch;

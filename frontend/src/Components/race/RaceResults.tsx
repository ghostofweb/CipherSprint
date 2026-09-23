import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import type { RaceAck, RaceOutcome, RaceSnapshot } from '@ciphersprint/shared';
import Avatar from '../Avatar';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import Segmented from '../ui/Segmented';
import ReplayPlayer from '../ReplayPlayer';
import RaceGraph from './RaceGraph';
import { timesOf } from '../../Utils/replay';
import { cx } from '../../Utils/cx';

// Both racers' replays on one clock, so you can see where the gap opened.
function RaceReplays({ words, outcomes }: { words: string[]; outcomes: RaceOutcome[] }) {
    const withReplay = outcomes.filter((o) => o.replay && o.replay.length > 0);
    const duration = Math.max(0, ...withReplay.map((o) => {
        const t = timesOf(o.replay ?? []);
        return t[t.length - 1] ?? 0;
    }));
    const [time, setTime] = useState(0);
    const [playing, setPlaying] = useState(true);
    const [speed, setSpeed] = useState<1 | 2 | 4>(1);

    useEffect(() => {
        if (!playing) return undefined;
        let raf = 0;
        let last = performance.now();
        const tick = (now: number) => {
            const dt = (now - last) * speed;
            last = now;
            setTime((t) => {
                const next = t + dt;
                if (next >= duration) {
                    setPlaying(false);
                    return duration;
                }
                return next;
            });
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [playing, speed, duration]);

    return (
        <div className="rr-replays">
            {withReplay.map((o) => (
                <ReplayPlayer key={o.userId} words={words} events={o.replay ?? []} compact label={o.username} externalTime={time} />
            ))}
            <div className="rp-controls">
                <IconButton
                    icon={playing ? 'pause' : 'play'}
                    label={playing ? 'Pause' : 'Play'}
                    onClick={() => {
                        if (time >= duration) setTime(0);
                        setPlaying((p) => !p);
                    }}
                />
                <input className="rp-scrub" type="range" min={0} max={Math.max(1, duration)} step={50} value={time} aria-label="Position in the replays" onChange={(e) => setTime(Number(e.target.value))} />
                <Segmented label="Speed" value={speed} onChange={setSpeed} options={[1, 2, 4].map((s) => ({ value: s as 1 | 2 | 4, label: `${s}×` }))} />
            </div>
        </div>
    );
}

interface RaceResultsProps {
    snapshot: RaceSnapshot;
    me: string;
    onRematch: () => Promise<RaceAck>;
    onLeave: () => void;
}

const dash = '—';

function StatColumn({ outcome, tone, winner, you }: { outcome: RaceOutcome; tone: 'me' | 'rival'; winner: boolean; you: boolean }) {
    const ran = outcome.finished;
    return (
        <div className={cx('rr-col', `rr-col--${tone}`, winner && 'is-winner')}>
            <div className="rr-who">
                <Avatar url={outcome.avatarUrl} name={outcome.username} size="sm" />
                <span className="rr-name">{you ? `${outcome.username} (you)` : outcome.username}</span>
                {winner && <span className="rr-winner">winner</span>}
            </div>
            <div className="rr-wpm tnum">{outcome.wpm}<span className="rr-wpm__unit">wpm</span></div>
            {!ran && <div className="rr-dnf">{outcome.forfeit ? 'Left the race' : 'Did not finish'}</div>}
            <dl className="rr-stats tnum">
                <dt>accuracy</dt>
                <dd>{ran ? `${outcome.accuracy}%` : dash}</dd>
                <dt>raw</dt>
                <dd>{ran ? outcome.rawWpm : dash}</dd>
                <dt>consistency</dt>
                <dd>{ran ? `${outcome.consistency}%` : dash}</dd>
                <dt>time</dt>
                <dd>{ran ? `${(outcome.elapsedMs / 1000).toFixed(1)}s` : dash}</dd>
            </dl>
        </div>
    );
}

function RaceResults({ snapshot, me, onRematch, onLeave }: RaceResultsProps) {
    const results = snapshot.results;
    const [busy, setBusy] = useState(false);
    const [showReplays, setShowReplays] = useState(false);
    if (!results) return null;

    // A spectator sees the race from the first racer's side, with names.
    const spectating = !results.outcomes.some((o) => o.userId === me);
    const pov = spectating ? results.outcomes[0]?.userId ?? me : me;
    const mine = results.outcomes.find((o) => o.userId === pov);
    const theirs = results.outcomes.find((o) => o.userId !== pov);
    const won = results.winnerId === pov;
    const tie = results.winnerId === null;
    const theirName = theirs?.username ?? 'Your opponent';
    const myName = spectating ? mine?.username ?? 'Player 1' : 'You';
    const winnerName = results.outcomes.find((o) => o.userId === results.winnerId)?.username ?? '';

    const title = tie ? "It's a tie" : spectating ? `${winnerName} won` : won ? 'You won' : `${theirName} won`;
    const why =
        results.reason === 'time'
            ? 'Higher wpm when the clock ran out.'
            : results.reason === 'finish'
              ? won ? `${myName} crossed the line first.` : `${theirName} crossed the line first.`
              : results.reason === 'forfeit'
                ? won ? `${theirName} left the race.` : `${myName} left the race.`
                : 'Same wpm and the same accuracy.';
    const replayable = results.words.length > 0 && results.outcomes.some((o) => o.replay && o.replay.length > 0);

    const opponentHere = snapshot.players.some((p) => p.userId !== me);
    const iAsked = snapshot.rematch.includes(me);
    const theyAsked = !!theirs && snapshot.rematch.includes(theirs.userId);
    const myWins = snapshot.series[me] ?? 0;
    const theirWins = theirs ? snapshot.series[theirs.userId] ?? 0 : 0;

    const rematch = async () => {
        setBusy(true);
        const res = await onRematch();
        if (!res.ok) toast.error(res.error);
        setBusy(false);
    };

    return (
        <section className="rr" aria-label="Race results">
            <header className="rr-head">
                <h1 className="rr-title">{title}</h1>
                <p className="rr-why">{why}</p>
                {myWins + theirWins > 0 && theirs && (
                    <p className="rr-series tnum">
                        {mine?.username ?? 'you'} {myWins} – {theirWins} {theirs.username}
                    </p>
                )}
            </header>

            <div className="rr-cols">
                {mine && <StatColumn outcome={mine} tone="me" winner={won} you={!spectating} />}
                {theirs && <StatColumn outcome={theirs} tone="rival" winner={!tie && !won} you={false} />}
            </div>

            {showReplays ? (
                <RaceReplays words={results.words} outcomes={[mine, theirs].filter((o): o is RaceOutcome => !!o)} />
            ) : (
                <div className="rr-graph">
                    <RaceGraph outcomes={results.outcomes} meId={pov} />
                </div>
            )}

            <footer className="rr-actions">
                {!spectating && (
                    <Button variant="primary" onClick={rematch} loading={busy}>
                        {!opponentHere ? 'Back to lobby' : iAsked ? 'Cancel rematch' : theyAsked ? 'Accept rematch' : 'Race again'}
                    </Button>
                )}
                {replayable && (
                    <Button icon={showReplays ? 'analytics' : 'replay'} onClick={() => setShowReplays((v) => !v)}>
                        {showReplays ? 'Show chart' : 'Watch replays'}
                    </Button>
                )}
                <Button variant="ghost" onClick={onLeave}>Leave</Button>
                {!spectating && (
                    <span className="rr-note" role="status">
                        {opponentHere && iAsked && !theyAsked ? `Waiting for ${theirName} to accept.` : ''}
                        {opponentHere && theyAsked && !iAsked ? `${theirName} wants a rematch.` : ''}
                    </span>
                )}
            </footer>
        </section>
    );
}

export default RaceResults;

import React, { useMemo } from 'react';
import type { RaceSnapshot } from '@ciphersprint/shared';
import RaceLanes from './RaceLanes';
import type { Racer } from './RaceLanes';
import TypingSurface from '../TypingSurface';
import type { Ghost } from '../TypingSurface';
import type { RaceRoom } from '../../Hooks/useRace';
import { positionOf, textLength, wordOffsets } from '../../Utils/race';

// Watching a race: every racer's lane, and every racer's caret moving
// through the shared text. Used by spectators, and by a racer who reloaded
// mid-race (their typing state is gone, so they can only watch the round).
function RaceWatching({ room, snapshot }: { room: RaceRoom; snapshot: RaceSnapshot }) {
    const words = useMemo(() => snapshot.words ?? [], [snapshot.words]);
    const offsets = useMemo(() => wordOffsets(words), [words]);
    const total = textLength(words);
    const fixed = snapshot.settings.format !== 'time';
    const spectating = room.isSpectator;

    const shown = snapshot.players.filter((p) => spectating || p.userId !== room.me);
    const racers: Racer[] = shown.map((p, i) => {
        const progress = room.progress[p.userId];
        return {
            id: p.userId,
            name: p.username,
            avatarUrl: p.avatarUrl,
            tone: spectating && i === 0 ? ('me' as const) : ('rival' as const),
            position: p.finished && fixed ? total : progress ? positionOf(offsets, progress.word, progress.char) : 0,
            wpm: progress?.wpm ?? 0,
            done: p.finished,
            connected: p.connected,
        };
    });
    const ghosts: Ghost[] = shown.map((p, i) => {
        const progress = room.progress[p.userId];
        return {
            id: p.userId,
            label: p.username,
            tone: spectating && i === 0 ? 'accent' : 'rival',
            cursor: { word: Math.min(progress?.word ?? 0, Math.max(0, words.length - 1)), char: progress?.char ?? 0 },
        };
    });
    const emptyGrid = useMemo(() => words.map(() => []), [words]);

    // The text scrolls with the leader.
    const lead = ghosts.reduce((best, g) => (positionOf(offsets, g.cursor.word, g.cursor.char) > positionOf(offsets, best.word, best.char) ? g.cursor : best), { word: 0, char: 0 });

    return (
        <div className="race-view">
            <h1 className="visually-hidden">Watching a race</h1>
            <div className="race-watch-head">
                <span className="race-watch-badge">{spectating ? 'Spectating' : "You're watching this round"}</span>
                {snapshot.spectators > 0 && <span className="race-watch-count tnum">{snapshot.spectators} watching</span>}
            </div>
            <RaceLanes racers={racers} settings={snapshot.settings} textChars={total} />
            {words.length > 0 ? (
                <div className="race-stage">
                    <TypingSurface
                        words={words}
                        typedGrid={emptyGrid}
                        cursor={lead}
                        testStart
                        generation={snapshot.round}
                        isFocused
                        focusInput={() => {}}
                        ghosts={ghosts}
                    />
                </div>
            ) : (
                <div className="race-wait" role="status">
                    <div className="race-wait__hint">The text appears when the countdown starts.</div>
                </div>
            )}
            {!spectating && (
                <p className="race-wait__hint">You rejoined after it started, so you can't type in this round. The results appear when it ends.</p>
            )}
        </div>
    );
}

export default RaceWatching;

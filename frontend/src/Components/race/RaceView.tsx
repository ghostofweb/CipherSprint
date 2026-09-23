import React, { useEffect, useMemo, useRef } from 'react';
import type { RaceSnapshot } from '@ciphersprint/shared';
import TypingSurface from '../TypingSurface';
import type { Ghost } from '../TypingSurface';
import RaceLanes from './RaceLanes';
import type { Racer } from './RaceLanes';
import { useTypingEngine } from '../../Hooks/useTypingEngine';
import type { RaceRoom } from '../../Hooks/useRace';
import { positionOf, textLength, wordOffsets } from '../../Utils/race';

interface RaceViewProps {
    room: RaceRoom;
    snapshot: RaceSnapshot;
    // Local wall-clock ms at which typing begins.
    startAt: number;
}

// Mounted once per round (the page keys it by round), so everything frozen
// at mount -- the text and the start time -- is right for the whole round.
function RaceView({ room, snapshot, startAt }: RaceViewProps) {
    const { settings } = snapshot;
    // Snapshots are re-parsed on every server message; the text and the start
    // moment must not change identity under the engine.
    const words = useRef(snapshot.words as string[]).current;
    const goAt = useRef(startAt).current;

    const engine = useTypingEngine({
        words,
        config: { testType: settings.format, testTime: settings.seconds, wordCount: settings.words },
        startAt: goAt,
    });

    const offsets = useMemo(() => wordOffsets(words), [words]);
    const total = useMemo(() => textLength(words), [words]);
    const { actions } = room;

    // My caret goes out to the opponent; theirs comes back through room.progress.
    useEffect(() => {
        actions.reportProgress(engine.cursor.word, engine.cursor.char, engine.liveStats.wpm);
    }, [engine.cursor, engine.liveStats.wpm, actions]);

    // The run is over: hand the server the raw counts; it works out the wpm.
    const finishSent = useRef(false);
    const { finalStats } = engine;
    useEffect(() => {
        if (!finalStats || finishSent.current) return;
        finishSent.current = true;
        void actions.finish({
            wpm: finalStats.wpm,
            rawWpm: finalStats.rawWpm,
            accuracy: finalStats.accuracy,
            consistency: finalStats.consistency,
            correctChars: finalStats.correctChars,
            incorrectChars: finalStats.incorrectChars,
            missedChars: finalStats.missedChars,
            extraChars: finalStats.extraChars,
            elapsedMs: finalStats.elapsedMs,
            graphData: finalStats.graphData.slice(0, 400),
            replay: finalStats.replay,
        });
    }, [finalStats, actions]);

    // 3-2-1 until the engine's own clock takes over at the go.
    const [now, setNow] = React.useState(() => Date.now());
    useEffect(() => {
        if (engine.testStart) return undefined;
        const id = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(id);
    }, [engine.testStart]);
    const left = Math.ceil((goAt - now) / 1000);
    const timerText = engine.testStart ? String(engine.countdownDisplay) : left > 3 ? 'get ready' : String(Math.max(left, 1));

    const opp = room.opponent;
    const oppProgress = opp ? room.progress[opp.userId] : undefined;
    const fixed = settings.format !== 'time';

    const myPos = engine.testEnd && fixed ? total : positionOf(offsets, engine.cursor.word, engine.cursor.char);
    const oppPos = opp?.finished && fixed ? total : oppProgress ? positionOf(offsets, oppProgress.word, oppProgress.char) : 0;
    const me = snapshot.players.find((p) => p.userId === room.me);

    const racers: Racer[] = [];
    if (me) {
        racers.push({ id: me.userId, name: me.username, avatarUrl: me.avatarUrl, tone: 'me', position: myPos, wpm: engine.liveStats.wpm, done: engine.testEnd, connected: true });
    }
    if (opp) {
        racers.push({ id: opp.userId, name: opp.username, avatarUrl: opp.avatarUrl, tone: 'rival', position: oppPos, wpm: oppProgress?.wpm ?? 0, done: opp.finished, connected: opp.connected });
    }

    const ghosts: Ghost[] = opp
        ? [{ id: opp.userId, label: opp.username, cursor: { word: Math.min(oppProgress?.word ?? 0, words.length - 1), char: oppProgress?.char ?? 0 } }]
        : [];

    return (
        <div className="race-view">
            <h1 className="visually-hidden">Race</h1>
            <RaceLanes racers={racers} settings={settings} textChars={total} />
            {snapshot.spectators > 0 && <p className="race-watchers tnum">{snapshot.spectators} watching</p>}
            {engine.testEnd && finalStats ? (
                <div className="race-wait" role="status">
                    <div className="race-wait__title">You finished</div>
                    <div className="race-wait__stats tnum">
                        <strong>{finalStats.wpm}</strong> wpm, {finalStats.accuracy}% accuracy
                    </div>
                    {opp && !opp.finished && <div className="race-wait__hint">Waiting for {opp.username} to finish…</div>}
                </div>
            ) : (
                <div className="race-stage">
                    <div className={`race-timer tnum${engine.testStart ? '' : ' is-countdown'}`} aria-live="off">
                        {timerText}
                    </div>
                    <TypingSurface
                        words={engine.words}
                        typedGrid={engine.typedGrid}
                        cursor={engine.cursor}
                        testStart={engine.testStart}
                        generation={engine.generation}
                        isFocused={engine.isFocused}
                        focusInput={engine.focusInput}
                        ghosts={ghosts}
                    />
                </div>
            )}
            <input
                type="text"
                className="hidden-input"
                ref={engine.inputRef}
                onKeyDown={engine.handleKeyDown}
                onFocus={engine.handleInputFocus}
                onBlur={engine.handleInputBlur}
                aria-label="Typing input"
            />
        </div>
    );
}

export default RaceView;

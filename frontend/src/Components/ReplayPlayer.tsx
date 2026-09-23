import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TypingSurface from './TypingSurface';
import IconButton from './ui/IconButton';
import Segmented from './ui/Segmented';
import { applyKey, frameAt, ReplayEvent, ReplayFrame, timesOf } from '../Utils/replay';
import type { TypedChar } from '../Hooks/useTypingEngine';
import { cx } from '../Utils/cx';

interface ReplayPlayerProps {
    words: string[];
    events: ReplayEvent[];
    zen?: boolean;
    // Starts playing on mount.
    autoPlay?: boolean;
    // Compact controls (side-by-side race replays).
    compact?: boolean;
    label?: string;
    // Shared clock for side-by-side replays: when set, this player follows it.
    externalTime?: number | null;
}

const SPEEDS = [1, 2, 4] as const;
const SKIP_MS = 2000;

const fmt = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// Plays a test back in the real typing surface: the same words, caret and
// colours, key by key at the speed it was typed.
function ReplayPlayer({ words, events, zen = false, autoPlay = false, compact = false, label, externalTime = null }: ReplayPlayerProps) {
    const times = useMemo(() => timesOf(events), [events]);
    const duration = times.length ? times[times.length - 1] : 0;

    const [time, setTime] = useState(0);
    const [playing, setPlaying] = useState(autoPlay);
    const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
    const [seekGen, setSeekGen] = useState(0);

    const frameRef = useRef<ReplayFrame>(frameAt(words, events, 0, zen));
    const appliedRef = useRef(0);
    const [view, setView] = useState(() => ({ words: frameRef.current.words.slice(), typed: frameRef.current.typed.map((a) => a.slice()), cursor: frameRef.current.cursor, correct: 0 }));

    const effectiveTime = externalTime ?? time;

    // Bring the frame to `effectiveTime`: forward by applying keys, backward
    // by rebuilding (and remounting the surface so its scroll resets).
    useEffect(() => {
        let count = 0;
        while (count < times.length && times[count] <= effectiveTime) count++;
        if (count === appliedRef.current) return;
        const f = frameRef.current;
        let lo: number;
        let hi: number;
        if (count < appliedRef.current) {
            frameRef.current = frameAt(words, events, count, zen);
            appliedRef.current = count;
            setSeekGen((g) => g + 1);
            const fresh = frameRef.current;
            setView({ words: fresh.words.slice(), typed: fresh.typed.map((a) => a.slice()), cursor: fresh.cursor, correct: fresh.correct });
            return;
        }
        lo = f.cursor.word;
        hi = f.cursor.word;
        for (let i = appliedRef.current; i < count; i++) {
            applyKey(f, events[i][1], zen);
            lo = Math.min(lo, f.cursor.word);
            hi = Math.max(hi, f.cursor.word);
        }
        appliedRef.current = count;
        // New arrays only for the words that changed, so the rest of the
        // (memoised) words do not re-render.
        setView((prev) => {
            // Zen text grows as it is typed (and is short): copy it all.
            if (zen) return { words: f.words.slice(), typed: f.typed.map((a) => a.slice()), cursor: { ...f.cursor }, correct: f.correct };
            const typed: TypedChar[][] = prev.typed.slice();
            for (let w = Math.max(0, lo - 1); w <= Math.min(f.typed.length - 1, hi + 1); w++) typed[w] = f.typed[w].slice();
            return { words: prev.words, typed, cursor: { ...f.cursor }, correct: f.correct };
        });
    }, [effectiveTime, times, events, words, zen]);

    // The clock.
    useEffect(() => {
        if (!playing || externalTime !== null) return undefined;
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
    }, [playing, speed, duration, externalTime]);

    const toggle = useCallback(() => {
        if (time >= duration) setTime(0);
        setPlaying((p) => !p);
    }, [time, duration]);

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (externalTime !== null) return;
        if (e.key === ' ') {
            e.preventDefault();
            toggle();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            setTime((t) => Math.min(duration, t + SKIP_MS));
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            setTime((t) => Math.max(0, t - SKIP_MS));
        }
    };

    const minutes = Math.max(effectiveTime / 60000, 1 / 600);
    const liveWpm = effectiveTime > 0 ? Math.round(view.correct / 5 / minutes) : 0;

    return (
        <div className={cx('rp', compact && 'rp--compact')} onKeyDown={onKeyDown} tabIndex={-1} aria-label={label ?? 'Test replay'}>
            <div className="rp-status tnum">
                {label && <span className="rp-label">{label}</span>}
                <span className="rp-wpm">{liveWpm}<span className="rp-unit">wpm</span></span>
                <span className="rp-time">{fmt(effectiveTime)} / {fmt(duration)}</span>
            </div>
            <TypingSurface
                key={seekGen}
                words={view.words}
                typedGrid={view.typed}
                cursor={view.cursor}
                testStart
                generation={0}
                isFocused
                focusInput={() => {}}
                zen={zen}
            />
            {externalTime === null && (
                <div className="rp-controls">
                    <IconButton icon={playing ? 'pause' : 'play'} label={playing ? 'Pause' : 'Play'} onClick={toggle} />
                    <input
                        className="rp-scrub"
                        type="range"
                        min={0}
                        max={Math.max(1, duration)}
                        step={50}
                        value={time}
                        aria-label="Position in the replay"
                        aria-valuetext={`${fmt(time)} of ${fmt(duration)}`}
                        onChange={(e) => setTime(Number(e.target.value))}
                    />
                    <Segmented label="Speed" value={speed} onChange={setSpeed} options={SPEEDS.map((s) => ({ value: s, label: `${s}×` }))} />
                </div>
            )}
        </div>
    );
}

export default ReplayPlayer;

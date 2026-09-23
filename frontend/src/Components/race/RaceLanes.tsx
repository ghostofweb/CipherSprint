import React, { useRef } from 'react';
import type { RaceSettings } from '@ciphersprint/shared';
import Avatar from '../Avatar';
import Icon from '../ui/Icon';
import { cx } from '../../Utils/cx';
import { fraction, trackScale } from '../../Utils/race';

export interface Racer {
    id: string;
    name: string;
    avatarUrl: string | null;
    // "me" rides in the accent, the opponent in --rival.
    tone: 'me' | 'rival';
    // Characters into the shared text.
    position: number;
    wpm: number;
    done: boolean;
    connected: boolean;
}

interface RaceLanesProps {
    racers: Racer[];
    settings: RaceSettings;
    textChars: number;
}

// One lane per racer: a hairline from start to finish with that racer's caret
// riding it. The text box only shows three lines that scroll with your own
// progress, so an opponent a line ahead leaves it; the lanes always show who
// is ahead. The caret is the runner (no cars: it is the product's own mark).
function RaceLanes({ racers, settings, textChars }: RaceLanesProps) {
    const fixed = settings.format !== 'time';
    const leader = Math.max(0, ...racers.map((r) => r.position));
    // A timed race's scale stretches as the leader closes in on the end, and
    // never shrinks, so nobody's caret jumps backwards.
    const scaleRef = useRef(1);
    scaleRef.current = Math.max(scaleRef.current, trackScale(settings, textChars, leader));
    const scale = scaleRef.current;

    return (
        <div className="race-lanes" role="group" aria-label="Race progress">
            {fixed && (
                <div className="race-lane race-lane--legend" aria-hidden="true">
                    <span />
                    <span />
                    <span className="race-lane__end">finish</span>
                    <span />
                </div>
            )}
            {racers.map((r) => {
                const pct = Math.round(fraction(r.position, scale) * 1000) / 10;
                return (
                    <div key={r.id} className={cx('race-lane', `race-lane--${r.tone}`, !r.connected && 'is-away')}>
                        <Avatar url={r.avatarUrl} name={r.name} size="sm" />
                        <span className="race-lane__name">
                            {r.name}
                            {r.tone === 'me' && <span className="race-lane__you"> (you)</span>}
                        </span>
                        <div
                            className={cx('race-lane__track', fixed && 'is-fixed')}
                            role="progressbar"
                            aria-label={`${r.name}${r.connected ? '' : ' (reconnecting)'}`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(pct)}
                        >
                            <span className="race-lane__trail" style={{ width: `${pct}%` }} />
                            <span className="race-lane__caret" style={{ left: `calc(${pct}% - ${(pct / 100) * 2}px)` }} />
                        </div>
                        <span className="race-lane__wpm tnum">
                            {r.done ? <Icon name="check" size={16} /> : r.wpm}
                            <span className="race-lane__unit">{r.done ? 'done' : 'wpm'}</span>
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default RaceLanes;

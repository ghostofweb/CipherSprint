import React, { useMemo } from 'react';
import { cx } from '../Utils/cx';

// Mistakes drawn where they happen: a QWERTY board where each key is tinted
// by how often it was missed, from the surface colour up to the error red.

const ROWS: { keys: string; offset: number }[] = [
    { keys: '1234567890-=', offset: 0 },
    { keys: 'qwertyuiop[]', offset: 0.5 },
    { keys: "asdfghjkl;'", offset: 0.75 },
    { keys: 'zxcvbnm,./', offset: 1.25 },
];

// Shifted characters count against the key that makes them.
const BASE: Record<string, string> = {
    '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
    _: '-', '+': '=', '{': '[', '}': ']', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/',
};

interface KeyboardHeatmapProps {
    mistakes: Record<string, number>;
    // A smaller board (results screen).
    compact?: boolean;
    caption?: string;
}

function KeyboardHeatmap({ mistakes, compact = false, caption }: KeyboardHeatmapProps) {
    const counts = useMemo(() => {
        const out: Record<string, number> = {};
        for (const [ch, n] of Object.entries(mistakes ?? {})) {
            const k = ch === ' ' ? 'space' : BASE[ch] ?? ch.toLowerCase();
            out[k] = (out[k] ?? 0) + n;
        }
        return out;
    }, [mistakes]);

    const max = Math.max(1, ...Object.values(counts));
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const key = (k: string, label = k, wide = false) => {
        const n = counts[k] ?? 0;
        // A square-root curve so one very bad key does not wash out the rest.
        const heat = n ? Math.round(18 + Math.sqrt(n / max) * 82) : 0;
        return (
            <span
                key={k}
                className={cx('kh-key', wide && 'kh-key--space', n > 0 && 'has-miss', heat > 70 && 'is-hot')}
                style={n ? { background: `color-mix(in srgb, var(--danger) ${heat}%, var(--surface-2))` } : undefined}
                title={n ? `${label}: ${n} miss${n === 1 ? '' : 'es'}` : label}
            >
                <span className="kh-char">{label}</span>
                {n > 0 && !compact && <span className="kh-count tnum">{n}</span>}
            </span>
        );
    };

    const summary = total === 0 ? 'No mistakes recorded.' : `Most missed: ${top.map(([k, n]) => `${k} ${n} times`).join(', ')}.`;

    return (
        <figure className={cx('kh', compact && 'kh--compact')}>
            <div className="kh-board" role="img" aria-label={`Keyboard heatmap of mistakes. ${summary}`}>
                {ROWS.map((row) => (
                    <div key={row.keys} className="kh-row" style={{ paddingLeft: `calc(var(--kh-unit) * ${row.offset})` }}>
                        {row.keys.split('').map((k) => key(k))}
                    </div>
                ))}
                <div className="kh-row kh-row--space">{key('space', 'space', true)}</div>
            </div>
            {caption && <figcaption className="kh-caption">{caption}</figcaption>}
            {!compact && total > 0 && (
                <div className="kh-legend" aria-hidden="true">
                    <span>fewer</span>
                    <span className="kh-scale" />
                    <span>more misses</span>
                </div>
            )}
        </figure>
    );
}

export default KeyboardHeatmap;

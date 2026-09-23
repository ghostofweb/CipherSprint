import React from 'react';
import type { Theme } from '../../Utils/themeOptions';
import { deriveUiTokens } from '../../Utils/themeTokens';

/*
 * The image people share: a 1200x630 card of the result, drawn off-screen
 * and captured by html2canvas. Everything here is plain inline styles with
 * hex/rgb colors taken straight from the theme object (no CSS variables,
 * no color-mix) because html2canvas re-parses computed styles and does not
 * understand modern color functions.
 */

export interface ShareCardProps {
    theme: Theme;
    username: string | null;
    wpm: number;
    accuracy: number;
    rawWpm: number;
    consistency: number;
    modeLabel: string;
    durationSeconds: number;
    dateLabel: string;
    graphData: [number, number][];
    personalBest?: boolean;
}

export const SHARE_CARD_SIZE = { width: 1200, height: 630 } as const;

const CHART = { width: 560, height: 220, pad: 8 };

function sparkline(data: [number, number][]): { points: string; last: [number, number] } {
    const { width, height, pad } = CHART;
    const values = data.length ? data.map(([, v]) => v) : [0, 0];
    const series = values.length === 1 ? [values[0], values[0]] : values;
    // Zero-based scale (like the results graph) so a small wobble does not
    // read as a dramatic swing.
    const max = Math.max(...series, 1) * 1.08;
    const coords = series.map((v, i): [number, number] => [
        pad + (i / (series.length - 1)) * (width - pad * 2),
        pad + (1 - v / max) * (height - pad * 2),
    ]);
    return { points: coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '), last: coords[coords.length - 1] };
}

const ShareCard = React.forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(props, ref) {
    const { theme: t, username, wpm, accuracy, rawWpm, consistency, modeLabel, durationSeconds, dateLabel, graphData, personalBest } = props;
    const muted = deriveUiTokens(t)['--muted'];
    const { points, last } = sparkline(graphData);

    const stat = (label: string, value: string) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 18, color: muted }}>{label}</div>
            <div style={{ fontSize: 32, fontWeight: 600, color: t.textColor }}>{value}</div>
        </div>
    );

    return (
        <div
            ref={ref}
            aria-hidden="true"
            style={{
                position: 'fixed',
                left: -100000,
                top: 0,
                width: SHARE_CARD_SIZE.width,
                height: SHARE_CARD_SIZE.height,
                boxSizing: 'border-box',
                padding: 64,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: t.background,
                color: t.textColor,
                fontFamily: '"IBM Plex Mono", monospace',
            }}
        >
            {/* Brand row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* The wordmark: cipher, the caret, sprint. */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 30, fontWeight: 600, letterSpacing: '-0.01em' }}>
                    <span>cipher</span>
                    <span style={{ display: 'inline-block', width: 4, height: 32, margin: '0 5px', borderRadius: 2, background: t.cursorColor }} />
                    <span>sprint</span>
                </div>
                <div style={{ fontSize: 22, color: muted }}>{username ? `@${username}` : ''}</div>
            </div>

            {/* Headline numbers + curve */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 24, color: muted }}>
                            wpm
                            {personalBest && (
                                <span style={{ padding: '2px 0 2px 12px', borderLeft: `4px solid ${t.cursorColor}`, color: t.textColor, fontWeight: 600 }}>
                                    new personal best
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: 176, fontWeight: 700, lineHeight: 1, color: t.cursorColor }}>{wpm}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                        <div style={{ fontSize: 24, color: muted }}>acc</div>
                        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1 }}>{accuracy}%</div>
                    </div>
                </div>
                <svg width={CHART.width} height={CHART.height} viewBox={`0 0 ${CHART.width} ${CHART.height}`}>
                    <line x1="0" y1={CHART.height - 1} x2={CHART.width} y2={CHART.height - 1} stroke={muted} strokeWidth="1" opacity="0.5" />
                    <polyline points={points} fill="none" stroke={t.cursorColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x={last[0] - 2} y={last[1] - 14} width="4" height="28" rx="2" fill={t.cursorColor} />
                </svg>
            </div>

            {/* Detail row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 56 }}>
                    {stat('test', modeLabel)}
                    {stat('raw', String(rawWpm))}
                    {stat('consistency', `${consistency}%`)}
                    {stat('time', `${durationSeconds}s`)}
                </div>
                <div style={{ fontSize: 20, color: muted }}>{dateLabel}</div>
            </div>
        </div>
    );
});

export default ShareCard;

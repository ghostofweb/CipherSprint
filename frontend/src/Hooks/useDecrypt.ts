import { useEffect, useState } from 'react';

// CipherSprint's one signature motion: text arrives encrypted and decodes
// left to right. Glyphs are the same width as letters in a monospace face,
// so nothing reflows and the caret never moves while it plays.

const GLYPHS = '#%&@$*+=<>/\\|{}[]0123456789xX';

export const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// A stable pseudo-random value in [0, 1) per position, so each character
// has its own reveal moment without re-randomising every frame.
export const jitter = (p: number) => {
    const x = Math.sin(p * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
};

// The cipher glyph shown at position p on a given frame.
export const glyphAt = (p: number, frame: number) => GLYPHS[Math.floor(jitter(p + frame * 31) * GLYPHS.length)];

// Is position p (out of span) readable yet at this progress (0..1)?
export const isRevealed = (p: number, span: number, progress: number) =>
    progress >= 1 || progress >= (Math.min(p, span) / span) * 0.75 + jitter(p) * 0.25;

// 0 -> 1 over `duration` ms, restarting whenever `runKey` changes. Stays at 1
// when disabled or when the user prefers reduced motion.
export function useDecodeProgress(runKey: unknown, enabled: boolean, duration = 420): number {
    const [progress, setProgress] = useState(enabled && !prefersReducedMotion() ? 0 : 1);

    useEffect(() => {
        if (!enabled || prefersReducedMotion()) {
            setProgress(1);
            return undefined;
        }
        let raf = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            setProgress(p);
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        setProgress(0);
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [runKey, enabled, duration]);

    return progress;
}

// The frame counter glyphs rotate on (about 50 changes a second at most).
export const frameOf = (progress: number) => Math.floor(progress * 20);

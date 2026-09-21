import React from 'react';

/*
 * Fallback avatar for anyone without a photo: a 5x5 mirrored "cipher glyph"
 * derived from a hash of the name, tinted with a hue from the same hash.
 * Deterministic (same name, same glyph, everywhere), nothing stored, and
 * it reads as part of the product instead of a flat initial circle.
 */

// FNV-1a, 32-bit.
function fnv1a(input: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
}

export interface Glyph {
    hue: number;
    // 5 rows x 5 columns; the right half mirrors the left.
    cells: boolean[][];
}

const cache = new Map<string, Glyph>();

export function glyphFor(name: string): Glyph {
    const key = name.trim().toLowerCase() || '?';
    const hit = cache.get(key);
    if (hit) return hit;

    const h1 = fnv1a(key);
    const h2 = Math.imul(h1 ^ (h1 >>> 15), 0x2c1b3c6d) >>> 0;

    // 15 bits: 5 rows x 3 columns (left, middle-left, centre).
    let bits: boolean[][] = Array.from({ length: 5 }, (_, r) =>
        Array.from({ length: 3 }, (_, c) => ((h1 >>> (r * 3 + c)) & 1) === 1)
    );
    const filled = bits.reduce((sum, row) => sum + (row[0] ? 2 : 0) + (row[1] ? 2 : 0) + (row[2] ? 1 : 0), 0);
    // Avoid near-empty glyphs (they read as a broken image).
    if (filled < 9) bits = bits.map((row) => row.map((b) => !b));

    const cells = bits.map(([a, b, c]) => [a, b, c, b, a]);
    const glyph = { hue: h2 % 360, cells };
    cache.set(key, glyph);
    return glyph;
}

interface GeneratedAvatarProps {
    name?: string | null;
    className?: string;
}

function GeneratedAvatar({ name, className }: GeneratedAvatarProps) {
    const { hue, cells } = glyphFor(name || '?');
    return (
        <div
            className={`avatar-glyph${className ? ` ${className}` : ''}`}
            style={{ '--h': hue } as React.CSSProperties}
            role="img"
            aria-label={name || 'avatar'}
        >
            <svg viewBox="0 0 5 5" aria-hidden="true">
                {cells.flatMap((row, r) =>
                    row.map((on, c) => (on ? <rect key={`${r}-${c}`} x={c} y={r} width="0.92" height="0.92" rx="0.14" /> : null))
                )}
            </svg>
        </div>
    );
}

export default GeneratedAvatar;

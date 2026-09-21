import type { Theme } from './themeOptions';

/*
 * UI color tokens with a contrast guarantee.
 *
 * The theme's `subTextColor` is tuned for the typing test (untyped words are
 * meant to recede), so it is far too dim for 11-13px UI text in most themes.
 * Rather than hand-tune 49 themes, derive readable variants per theme: pull
 * the color toward the theme's own text color just far enough to reach the
 * WCAG AA ratio against the background.
 */

const parse = (hex: string): [number, number, number] => {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
};

const toHex = ([r, g, b]: [number, number, number]) =>
    `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export const luminance = (hex: string): number => {
    const [r, g, b] = parse(hex);
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export const contrast = (a: string, b: string): number => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
};

const mix = (a: string, b: string, t: number): string => {
    const [ar, ag, ab] = parse(a);
    const [br, bg, bb] = parse(b);
    return toHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
};

// Smallest ratio of fg against any of the backgrounds it may sit on.
const worstContrast = (fg: string, bgs: string[]) => Math.min(...bgs.map((bg) => contrast(fg, bg)));

export function ensureContrast(fg: string, bg: string | string[], min: number, towards: string): string {
    const bgs = Array.isArray(bg) ? bg : [bg];
    if (worstContrast(fg, bgs) >= min) return fg;
    for (let step = 1; step <= 20; step++) {
        const candidate = mix(fg, towards, step / 20);
        if (worstContrast(candidate, bgs) >= min) return candidate;
    }
    return towards;
}

const AA = 4.5;

export function deriveUiTokens(theme: Theme): Record<string, string> {
    const { background: bg, textColor: text, subTextColor: sub, cursorColor: accent, incorrectWordColor: danger } = theme;

    // Pull toward the theme's own text color; a few themes' text is itself
    // under AA on their background, so fall back to black/white there.
    const extreme = luminance(bg) > 0.5 ? '#000000' : '#ffffff';
    const towards = contrast(text, bg) >= AA ? text : extreme;

    // Text that sits on an accent fill: keep the page background (it keeps
    // the theme's character) when it is legible, otherwise the best of the
    // usual candidates.
    const onAccentCandidates = [bg, text, '#000000', '#ffffff'];
    const onAccent =
        contrast(bg, accent) >= AA
            ? bg
            : onAccentCandidates.reduce((best, c) => (contrast(c, accent) > contrast(best, accent) ? c : best));

    // UI text also sits on raised surfaces (message bubbles, hovered rows),
    // which are the background pulled slightly toward the text color. Guarantee
    // AA on those as well as on the page itself.
    const raised = mix(bg, towards, 0.14);
    const surfaces = [bg, raised];

    return {
        '--muted': ensureContrast(sub, surfaces, AA, towards),
        '--accent-text': ensureContrast(accent, surfaces, AA, towards),
        '--danger-text': ensureContrast(danger, surfaces, AA, towards),
        '--on-accent': onAccent,
    };
}

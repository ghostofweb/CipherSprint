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

const rgbToHsl = ([r, g, b]: [number, number, number]): [number, number, number] => {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h: number;
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    return [h * 60, s, l];
};

const hslToRgb = ([h, s, l]: [number, number, number]): [number, number, number] => {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = (((h % 360) + 360) % 360) / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    const [r1, g1, b1] =
        hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
    const m = l - c / 2;
    return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255];
};

export const hueDistance = (a: number, b: number): number => {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
};

export const hueOf = (hex: string): number => rgbToHsl(parse(hex))[0];

// The second racer's colour. The accent turned around the wheel so the two
// are told apart at a glance, kept vivid and mid-light so it reads on dark
// and light themes alike, and pushed away from the danger red so "opponent"
// is never mistaken for "mistake".
export function deriveRival(accent: string, danger: string, bg: string, towards: string): string {
    const [accentHue, accentSat] = rgbToHsl(parse(accent));
    const dangerHue = rgbToHsl(parse(danger))[0];
    // A grey accent has no hue to turn; give the rival a definite one.
    let hue = accentSat < 0.15 ? 205 : (accentHue + 150) % 360;
    if (hueDistance(hue, dangerHue) < 35) hue = (hue + 70) % 360;
    const sat = Math.min(0.8, Math.max(0.55, accentSat));
    const light = luminance(bg) > 0.5 ? 0.38 : 0.62;
    return ensureContrast(toHex(hslToRgb([hue, sat, light])), bg, 3, towards);
}

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

    const rival = deriveRival(accent, danger, bg, towards);

    return {
        '--muted': ensureContrast(sub, surfaces, AA, towards),
        '--accent-text': ensureContrast(accent, surfaces, AA, towards),
        '--danger-text': ensureContrast(danger, surfaces, AA, towards),
        '--on-accent': onAccent,
        // Race opponent: the caret/lane fill, and a text-safe variant for tags.
        '--rival': rival,
        '--rival-text': ensureContrast(rival, surfaces, AA, towards),
    };
}

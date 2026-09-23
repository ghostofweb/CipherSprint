import type { RaceSettings } from '@ciphersprint/shared';

// Pure helpers for the race UI (no React, no sockets).

// offsets[i] = characters before word i, spaces included, so a caret at
// (word, char) becomes one comparable number along the whole text.
export function wordOffsets(words: string[]): number[] {
    const offsets: number[] = [];
    let running = 0;
    for (const word of words) {
        offsets.push(running);
        running += word.length + 1;
    }
    return offsets;
}

export const textLength = (words: string[]): number =>
    words.length === 0 ? 0 : wordOffsets(words)[words.length - 1] + words[words.length - 1].length;

export function positionOf(offsets: number[], word: number, char: number): number {
    if (offsets.length === 0) return 0;
    return offsets[Math.min(word, offsets.length - 1)] + char;
}

// A timed race has no finish line, so the lane needs a scale to draw against:
// 60 wpm worth of characters for the whole clock to start with, stretching
// (never shrinking) once the leader gets within reach of the end.
const BASELINE_CHARS_PER_SECOND = 5;

export function trackScale(settings: RaceSettings, textChars: number, leaderPosition: number): number {
    if (settings.format !== 'time') return Math.max(1, textChars);
    return Math.max(1, settings.seconds * BASELINE_CHARS_PER_SECOND, leaderPosition / 0.85);
}

export const fraction = (position: number, scale: number): number => Math.min(1, Math.max(0, position / scale));

const lengthOf = (s: RaceSettings): string =>
    s.format === 'time' ? `${s.seconds}s` : s.format === 'words' ? String(s.words) : s.quoteLength;

// "time 30s", "words 50", "quote short"
export const describeFormat = (s: RaceSettings): string => `${s.format} ${lengthOf(s)}`;

// The extras that change what you type; empty for a plain race.
export function describeModifiers(s: RaceSettings): string[] {
    if (s.format === 'quote') return [];
    const out: string[] = [];
    if (s.language && s.language !== 'english') out.push(s.language);
    if (s.punctuation) out.push('punctuation');
    if (s.numbers) out.push('numbers');
    if (s.wordLength !== 'any') out.push(`${s.wordLength} words`);
    return out;
}

export const describeSettings = (s: RaceSettings): string => [describeFormat(s), ...describeModifiers(s)].join(' · ');

export const raceLink = (code: string): string => `${window.location.origin}/race/${code}`;

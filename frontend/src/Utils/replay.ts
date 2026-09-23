import type { Cursor, TypedChar } from '../Hooks/useTypingEngine';

// Rebuilds what the screen showed at any moment of a test from its
// keystroke timeline, using the same rules as the typing engine (see
// useTypingEngine.handleKeyDown): characters are marked against the text,
// space commits a word, backspace can step back into the previous word.

export type ReplayEvent = [number, string];

export interface ReplayFrame {
    words: string[];
    typed: TypedChar[][];
    cursor: Cursor;
    correct: number;
    incorrect: number;
    extra: number;
}

// Absolute times (ms from the first key) for a timeline of [delta, key].
export function timesOf(events: ReplayEvent[]): number[] {
    const out: number[] = [];
    let t = 0;
    for (const [dt] of events) {
        t += dt;
        out.push(t);
    }
    return out;
}

export function emptyFrame(words: string[], zen = false): ReplayFrame {
    const base = zen ? [''] : words.slice();
    return { words: base, typed: base.map(() => []), cursor: { word: 0, char: 0 }, correct: 0, incorrect: 0, extra: 0 };
}

// Applies one key. Mutates and returns the frame (callers clone when needed).
export function applyKey(f: ReplayFrame, key: string, zen = false): ReplayFrame {
    const { word: w, char: c } = f.cursor;
    const target = f.words[w];
    if (target === undefined) return f;

    if (key === ' ') {
        if (f.typed[w].length === 0) return f;
        if (zen) {
            f.words.push('');
            f.typed.push([]);
        }
        if (w + 1 < f.words.length) f.cursor = { word: w + 1, char: 0 };
        return f;
    }

    if (key === '\b') {
        if (c === 0) {
            if (w === 0) return f;
            const prev = w - 1;
            const prevTyped = f.typed[prev];
            if (prevTyped.length === 0) {
                f.cursor = { word: prev, char: 0 };
                return f;
            }
            prevTyped.pop();
            if (zen) f.words[prev] = f.words[prev].slice(0, -1);
            f.cursor = { word: prev, char: prevTyped.length };
            return f;
        }
        f.typed[w].pop();
        if (zen) f.words[w] = f.words[w].slice(0, -1);
        f.cursor = { word: w, char: c - 1 };
        return f;
    }

    if (zen) {
        f.words[w] += key;
        f.typed[w].push({ status: 'correct', char: key });
        f.correct += 1;
        f.cursor = { word: w, char: c + 1 };
        return f;
    }

    const status = c >= target.length ? 'extra' : key === target[c] ? 'correct' : 'incorrect';
    f.typed[w].push({ status, char: key });
    f[status] += 1;
    f.cursor = { word: w, char: c + 1 };
    return f;
}

// The frame after the first `count` keys.
export function frameAt(words: string[], events: ReplayEvent[], count: number, zen = false): ReplayFrame {
    const f = emptyFrame(words, zen);
    for (let i = 0; i < count && i < events.length; i++) applyKey(f, events[i][1], zen);
    return f;
}

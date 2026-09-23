// Punctuation/number injection, ported from MonkeyType's actual English-only
// branch (frontend/src/ts/test/words-generator.ts: punctuateWord + the
// Config.numbers block). Operates on a plain array of lowercase words.

const shouldCapitalize = (lastChar: string): boolean => /[.!?]/.test(lastChar);

const capitalizeFirst = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);

// Applies MonkeyType's cascading punctuation probabilities to one word,
// given the previous word (for capitalization/adjacency rules), its index,
// and the total word count (the last word always gets terminal punctuation).
function punctuateWord(previousWord: string | undefined, word: string, index: number, total: number): string {
    const lastChar = previousWord ? previousWord.slice(-1) : undefined;

    if (index === 0 || (lastChar !== undefined && shouldCapitalize(lastChar))) {
        return capitalizeFirst(word);
    }

    const isSecondToLast = index === total - 2;
    const isLast = index === total - 1;
    const r = Math.random();

    if ((r < 0.1 && lastChar !== "." && lastChar !== "," && !isSecondToLast) || isLast) {
        const endR = Math.random();
        if (endR <= 0.8) return `${word}.`;
        if (endR <= 0.9) return `${word}?`;
        return `${word}!`;
    }
    if (Math.random() < 0.01 && lastChar !== "," && lastChar !== ".") {
        return `"${word}"`;
    }
    if (Math.random() < 0.011 && lastChar !== "," && lastChar !== ".") {
        return `'${word}'`;
    }
    if (Math.random() < 0.012 && lastChar !== "," && lastChar !== ".") {
        return `(${word})`;
    }
    if (Math.random() < 0.013 && !",.;:".includes(lastChar ?? "")) {
        return `${word}:`;
    }
    if (Math.random() < 0.014 && lastChar !== "," && lastChar !== "." && previousWord !== "-") {
        return "-";
    }
    if (Math.random() < 0.015 && !",.;:".includes(lastChar ?? "")) {
        return `${word};`;
    }
    if (Math.random() < 0.2 && lastChar !== ",") {
        return `${word},`;
    }
    return word;
}

// previousWord lets punctuation stay consistent across a refill boundary
// (time mode appends more words mid-test) — pass the last word already on
// screen so the new batch's first word knows whether to capitalize.
export function applyPunctuation(words: string[], previousWord?: string): string[] {
    const result: string[] = [];
    let prev = previousWord;
    for (let i = 0; i < words.length; i++) {
        const punctuated = punctuateWord(prev, words[i], i, words.length);
        result.push(punctuated);
        prev = punctuated;
    }
    return result;
}

// ~10% of words become a standalone random number instead, matching
// MonkeyType's Config.numbers behavior. Runs after punctuation so a
// number token never also carries punctuation decoration.
export function applyNumbers(words: string[]): string[] {
    return words.map((word) => {
        if (Math.random() < 0.1) {
            const digits = 1 + Math.floor(Math.random() * 4);
            return String(Math.floor(Math.random() * 10 ** digits));
        }
        return word;
    });
}

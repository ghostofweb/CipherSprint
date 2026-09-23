import { wordList } from 'random-words';

// "Practise weak keys": a text made of real words that are dense in the
// letters you miss most.

export const PRACTICE_WORDS = 40;

// The letters (a-z) you get wrong most, worst first.
export function topMistakeKeys(charMistakes: Record<string, number> | null | undefined, n = 5): string[] {
    return Object.entries(charMistakes ?? {})
        .filter(([ch, count]) => /^[a-z]$/i.test(ch) && count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([ch]) => ch.toLowerCase());
}

// Words weighted by how many weak letters they contain; no word twice in a row.
export function buildPracticeText(keys: string[], count = PRACTICE_WORDS, random: () => number = Math.random): string {
    if (keys.length === 0) return '';
    const scored = wordList
        .filter((w) => w.length >= 3 && w.length <= 9)
        .map((w) => ({ w, score: w.split('').filter((c) => keys.includes(c)).length }))
        .filter((x) => x.score > 0);
    if (scored.length === 0) return '';
    const total = scored.reduce((n, x) => n + x.score ** 2, 0);
    const out: string[] = [];
    while (out.length < count) {
        let r = random() * total;
        let pick = scored[0].w;
        for (const x of scored) {
            r -= x.score ** 2;
            if (r <= 0) {
                pick = x.w;
                break;
            }
        }
        if (pick !== out[out.length - 1]) out.push(pick);
    }
    return out.join(' ');
}

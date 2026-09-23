import { generate } from "random-words";
import { applyNumbers, applyPunctuation, getRandomQuote } from "@ciphersprint/shared";
import type { RaceSettings } from "@ciphersprint/shared";
import { wordsFor } from "@ciphersprint/shared/src/languages";

// A timed race has to hold more text than anyone can finish: 6 words a
// second is 360 wpm, past any human, so the text never runs out.
const WORDS_PER_SECOND = 6;
const MIN_TIMED_WORDS = 120;
const MAX_TIMED_WORDS = 720;

// Built once on the server and sent to both players. Generating it in each
// browser would give two different texts (Math.random on both ends).
export function buildRaceText(settings: RaceSettings): string[] {
  if (settings.format === "quote") {
    return getRandomQuote(settings.quoteLength).text.split(" ");
  }

  const count =
    settings.format === "time"
      ? Math.min(MAX_TIMED_WORDS, Math.max(MIN_TIMED_WORDS, settings.seconds * WORDS_PER_SECOND))
      : settings.words;

  const length =
    settings.wordLength === "short" ? { maxLength: 5 } : settings.wordLength === "long" ? { minLength: 7 } : {};

  let words: string[];
  if (settings.language && settings.language !== "english") {
    const all = wordsFor(settings.language);
    const fits = all.filter((w) => (settings.wordLength === "short" ? w.length <= 5 : settings.wordLength === "long" ? w.length >= 7 : true));
    // A small list may have too few long words; fall back to the whole list.
    const pool = fits.length >= 20 ? fits : all;
    words = [];
    while (words.length < count) {
      const w = pool[Math.floor(Math.random() * pool.length)];
      if (w !== words[words.length - 1]) words.push(w);
    }
  } else {
    words = generate({ exactly: count, ...length }) as string[];
  }
  if (settings.punctuation) words = applyPunctuation(words);
  if (settings.numbers) words = applyNumbers(words);
  return words;
}

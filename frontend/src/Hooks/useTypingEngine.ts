import { generate } from "random-words";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTestMode, TestType } from "../Context/TestModeContext";
import { applyNumbers, applyPunctuation } from "../Utils/wordModifiers";
import { getRandomQuote } from "../Utils/quotes";

const WORD_BUFFER = 250; // words generated up-front for time mode
const REFILL_THRESHOLD = 20; // append more words once this close to the end

const genWords = (n: number): string[] => generate(n);

// Modes whose word list is a fixed array, typed start to finish, no refill
// (as opposed to "time" which continuously refills, and "zen" which grows
// dynamically as you type with no predefined content).
const isFixedLengthMode = (testType: TestType) =>
    testType === "words" || testType === "quote" || testType === "custom";

const applyModifiers = (words: string[], punctuation: boolean, numbers: boolean, previousWord?: string): string[] => {
    let result = words;
    if (punctuation) result = applyPunctuation(result, previousWord);
    if (numbers) result = applyNumbers(result);
    return result;
};

interface BuildWordsArgs {
    testType: TestType;
    wordCount: number;
    quoteLength: "short" | "medium" | "long";
    customText: string;
    punctuation: boolean;
    numbers: boolean;
}

const buildWords = ({ testType, wordCount, quoteLength, customText, punctuation, numbers }: BuildWordsArgs): string[] => {
    if (testType === "time") {
        return applyModifiers(genWords(WORD_BUFFER), punctuation, numbers);
    }
    if (testType === "words") {
        return applyModifiers(genWords(wordCount), punctuation, numbers);
    }
    if (testType === "quote") {
        return getRandomQuote(quoteLength).text.split(" ");
    }
    if (testType === "custom") {
        const trimmed = customText.trim();
        if (!trimmed) return applyModifiers(genWords(wordCount), punctuation, numbers);
        return trimmed.split(/\s+/);
    }
    // zen: no predefined content, grows as the user types
    return [""];
};

// MonkeyType's exact consistency formula (packages/util/src/numbers.ts,
// `kogasa`): maps the coefficient of variation (stddev/mean of per-second
// raw wpm) from [0, +inf) to (0, 100] via a Taylor-series tanh approximation,
// rather than a naive linear "100 - cov*100" clamp.
const kogasa = (cov: number): number => 100 * (1 - Math.tanh(cov + cov ** 3 / 3 + cov ** 5 / 5));

const calcConsistency = (samples: number[]): number => {
    if (samples.length < 2) return 100;
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    if (mean === 0) return 0;
    const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
    const stddev = Math.sqrt(variance);
    const result = kogasa(stddev / mean);
    return isNaN(result) ? 0 : Math.round(Math.max(0, Math.min(100, result)));
};

export type CharStatus = "correct" | "incorrect" | "extra";
export interface TypedChar {
    status: CharStatus;
    char: string;
}
export interface Cursor {
    word: number;
    char: number;
}
interface WordCommit {
    missed: number;
    correct: boolean;
}
interface HistorySample {
    t: number;
    correct: number;
    incorrect: number;
    extra: number;
    missed: number;
}

export interface FinalStats {
    mode: TestType;
    modeDetail: number | string | null;
    wpm: number;
    rawWpm: number;
    accuracy: number;
    consistency: number;
    correctChars: number;
    incorrectChars: number;
    missedChars: number;
    extraChars: number;
    correctWords: number;
    charMistakes: Record<string, number>;
    durationSeconds: number;
    timestamp: number;
    graphData: [number, number][];
    rawGraphData: [number, number][];
    errorGraphData: [number, number][];
}

export function useTypingEngine() {
    const { testTime, testType, wordCount, quoteLength, customText, punctuation, numbers } = useTestMode();

    const [words, setWords] = useState<string[]>(() =>
        buildWords({ testType, wordCount, quoteLength, customText, punctuation, numbers })
    );
    const [typedGrid, setTypedGrid] = useState<TypedChar[][]>(() => words.map(() => []));
    const [cursor, setCursor] = useState<Cursor>({ word: 0, char: 0 });
    const [testStart, setTestStart] = useState(false);
    const [testEnd, setTestEnd] = useState(false);
    const [elapsedMs, setElapsedMs] = useState(0);
    const [liveStats, setLiveStats] = useState({ wpm: 0, accuracy: 100 });
    const [finalStats, setFinalStats] = useState<FinalStats | null>(null);
    const [generation, setGeneration] = useState(0);
    const [fading, setFading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const startTimeRef = useRef<number | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countsRef = useRef({ correct: 0, incorrect: 0, extra: 0, missed: 0, correctWords: 0 });
    const historyRef = useRef<HistorySample[]>([]);
    const mistakesRef = useRef<Record<string, number>>({}); // { [expectedChar]: count } -- for a "problem keys" breakdown
    const wordCommitRef = useRef<Record<number, WordCommit>>({}); // undone when backspacing back into a word
    const wordsRef = useRef(words);
    const cursorRef = useRef(cursor);
    const typedGridRef = useRef(typedGrid);

    wordsRef.current = words;
    cursorRef.current = cursor;
    typedGridRef.current = typedGrid;

    const focusInput = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    // Mirrors the hidden input's real DOM focus state -- MonkeyType blurs
    // the test (dims it, shows "click to focus") whenever the input loses
    // focus, whether that's clicking elsewhere on the page or switching
    // windows/tabs, and un-blurs the instant it's focused again.
    const handleInputFocus = useCallback(() => setIsFocused(true), []);
    const handleInputBlur = useCallback(() => setIsFocused(false), []);

    const pushHistory = () => {
        const t = performance.now() - (startTimeRef.current as number);
        const c = countsRef.current;
        historyRef.current.push({ t, correct: c.correct, incorrect: c.incorrect, extra: c.extra, missed: c.missed });
    };

    const finishTest = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTestEnd(true);

        const endMs = performance.now() - (startTimeRef.current as number);
        const minutes = Math.max(endMs / 60000, 1 / 600); // guard against div-by-~0
        const { correct, incorrect, extra, missed } = countsRef.current;
        const totalTyped = correct + incorrect + extra;

        const modeDetail = testType === "time" ? testTime
            : testType === "words" ? wordCount
            : testType === "quote" ? quoteLength
            : null;

        const wpm = Math.round((correct / 5) / minutes);
        const rawWpm = Math.round((totalTyped / 5) / minutes);
        const accuracy = totalTyped > 0 ? Math.round((correct / totalTyped) * 100) : 0;

        // Bucket history into 1s windows — matches MonkeyType's timer-boundary
        // approach (events/stats.ts getTimerBoundaries: i*1000 for i=1..N).
        // Three series come out of this, same as their getWpmHistory (cumulative
        // overall wpm up to each boundary) / getBurstHistory (instantaneous
        // per-second raw wpm) / getErrorCountHistory (per-second error count).
        const totalSeconds = Math.max(1, Math.round(endMs / 1000));
        const graphData: [number, number][] = [];
        const rawGraphData: [number, number][] = [];
        const errorGraphData: [number, number][] = [];
        const rawSamples: number[] = [];
        let prevRawTotal = 0;
        let prevErrorTotal = 0;
        let hi = 0;
        for (let s = 1; s <= totalSeconds; s++) {
            const bound = s * 1000;
            while (hi < historyRef.current.length && historyRef.current[hi].t <= bound) hi++;
            const snap = historyRef.current[hi - 1] || { correct: 0, incorrect: 0, extra: 0 };
            const rawTotal = snap.correct + snap.incorrect + snap.extra;
            const errorTotal = snap.incorrect + snap.extra;
            const overallWpm = (snap.correct / 5) / (bound / 60000);
            const instantRaw = Math.max(0, (rawTotal - prevRawTotal) / 5 * 60);
            graphData.push([s, Math.round(overallWpm)]);
            rawGraphData.push([s, Math.round(instantRaw)]);
            errorGraphData.push([s, Math.max(0, errorTotal - prevErrorTotal)]);
            rawSamples.push(instantRaw);
            prevRawTotal = rawTotal;
            prevErrorTotal = errorTotal;
        }
        const consistency = calcConsistency(rawSamples);

        setFinalStats({
            mode: testType,
            modeDetail,
            wpm: isFinite(wpm) ? wpm : 0,
            rawWpm: isFinite(rawWpm) ? rawWpm : 0,
            accuracy,
            consistency,
            correctChars: correct,
            incorrectChars: incorrect,
            missedChars: missed,
            extraChars: extra,
            correctWords: countsRef.current.correctWords,
            charMistakes: { ...mistakesRef.current },
            durationSeconds: Math.round(endMs / 1000),
            timestamp: Date.now(),
            graphData,
            rawGraphData,
            errorGraphData,
        });
    }, [testType, testTime, wordCount, quoteLength]);

    const startTimer = useCallback(() => {
        startTimeRef.current = performance.now();
        intervalRef.current = setInterval(() => {
            const elapsed = performance.now() - (startTimeRef.current as number);
            setElapsedMs(elapsed);

            const minutes = Math.max(elapsed / 60000, 1 / 600);
            const { correct, incorrect, extra } = countsRef.current;
            const totalTyped = correct + incorrect + extra;
            setLiveStats({
                wpm: Math.round((correct / 5) / minutes) || 0,
                accuracy: totalTyped > 0 ? Math.round((correct / totalTyped) * 100) : 100,
            });

            if (testType === "time" && elapsed >= testTime * 1000) {
                finishTest();
            }
        }, 250);
    }, [testType, testTime, finishTest]);

    const ensureWordSupply = useCallback((nextWordIndex: number) => {
        if (testType !== "time") return;
        if (wordsRef.current.length - nextWordIndex < REFILL_THRESHOLD) {
            const previousWord = wordsRef.current[wordsRef.current.length - 1];
            const more = applyModifiers(genWords(WORD_BUFFER), punctuation, numbers, previousWord);
            setWords((prev) => [...prev, ...more]);
            setTypedGrid((prev) => [...prev, ...more.map(() => [])]);
        }
    }, [testType, punctuation, numbers]);

    // Instant reset (no fade) — swaps words/state right away.
    const performReset = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const fresh = buildWords({ testType, wordCount, quoteLength, customText, punctuation, numbers });
        setWords(fresh);
        setTypedGrid(fresh.map(() => []));
        setCursor({ word: 0, char: 0 });
        setTestStart(false);
        setTestEnd(false);
        setElapsedMs(0);
        setLiveStats({ wpm: 0, accuracy: 100 });
        setFinalStats(null);
        countsRef.current = { correct: 0, incorrect: 0, extra: 0, missed: 0, correctWords: 0 };
        historyRef.current = [];
        mistakesRef.current = {};
        wordCommitRef.current = {};
        startTimeRef.current = null;
        setGeneration((g) => g + 1);
        focusInput();
    }, [testType, wordCount, quoteLength, customText, punctuation, numbers, focusInput]);

    // Fade-out -> swap -> fade-in, matching MonkeyType's fadeOutForRestart /
    // fadeInAfterRestart sequencing. FADE_MS must match the .typing-test
    // CSS transition duration so the JS wait and the visual fade line up.
    const FADE_MS = 125;
    const resetTest = useCallback(() => {
        if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
        setFading(true);
        fadeTimeoutRef.current = setTimeout(() => {
            performReset();
            setFading(false);
            fadeTimeoutRef.current = null;
        }, FADE_MS);
    }, [performReset]);

    useEffect(() => {
        resetTest();
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [testTime, testType, wordCount, quoteLength, customText, punctuation, numbers]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        // Never intercept browser/OS shortcuts (Ctrl+R, Cmd+R, Ctrl+T, ...) --
        // e.key for Ctrl+R is still just "r", so without this the reload
        // keystroke was being treated as typed input and preventDefault'd
        // right out from under the browser.
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (testEnd || fading) return;

        // Zen mode has no fixed end condition — Enter finishes the test manually.
        if (e.key === "Enter" && testType === "zen" && testStart) {
            e.preventDefault();
            finishTest();
            return;
        }

        const { word: wIdx, char: cIdx } = cursorRef.current;
        const target = wordsRef.current[wIdx];
        if (target === undefined) return;

        const isSpace = e.key === " ";
        const isBackspace = e.key === "Backspace";
        // Any single printable character is typeable now (letters, digits,
        // punctuation) — not just A-Za-z — so punctuation/numbers/quote/custom
        // content can actually be typed and compared.
        const isChar = !isSpace && !isBackspace && e.key.length === 1;

        if (!isChar && !isSpace && !isBackspace) return;
        e.preventDefault();

        if (!testStart) {
            setTestStart(true);
            startTimer();
        }

        const isZen = testType === "zen";

        if (isSpace) {
            const typedForWord = typedGridRef.current[wIdx];
            if (typedForWord.length === 0) return; // ignore leading space

            if (isZen) {
                countsRef.current.correctWords += 1;
                wordCommitRef.current[wIdx] = { missed: 0, correct: true };
                pushHistory();
                setWords((prev) => [...prev, ""]);
                setTypedGrid((prev) => [...prev, []]);
                setCursor({ word: wIdx + 1, char: 0 });
                return;
            }

            const missed = Math.max(0, target.length - typedForWord.length);
            if (missed > 0) countsRef.current.missed += missed;
            const allCorrect = typedForWord.length === target.length && typedForWord.every((s) => s.status === "correct");
            if (allCorrect) countsRef.current.correctWords += 1;
            wordCommitRef.current[wIdx] = { missed, correct: allCorrect };
            pushHistory();

            const nextWordIndex = wIdx + 1;
            if (isFixedLengthMode(testType) && nextWordIndex >= wordsRef.current.length) {
                finishTest();
                return;
            }
            ensureWordSupply(nextWordIndex);
            setCursor({ word: nextWordIndex, char: 0 });
            return;
        }

        if (isBackspace) {
            if (cIdx === 0) {
                if (wIdx === 0) return; // nothing before the first word
                const prevIdx = wIdx - 1;
                const meta = wordCommitRef.current[prevIdx];
                if (meta) {
                    countsRef.current.missed -= meta.missed;
                    if (meta.correct) countsRef.current.correctWords -= 1;
                    delete wordCommitRef.current[prevIdx];
                }

                // A single backspace always removes exactly one previously
                // typed character, whether that's within the current word
                // or across the boundary into the previous one -- so
                // crossing back "skips" the space for free and the cursor
                // lands right on the previous word's last typed letter
                // (right or wrong) instead of past it in empty space.
                const prevTyped = typedGridRef.current[prevIdx] || [];
                if (prevTyped.length === 0) {
                    setCursor({ word: prevIdx, char: 0 });
                    return;
                }
                setTypedGrid((prev) => {
                    const next = prev.slice();
                    next[prevIdx] = next[prevIdx].slice(0, -1);
                    return next;
                });
                if (isZen) {
                    setWords((prev) => {
                        const next = prev.slice();
                        next[prevIdx] = next[prevIdx].slice(0, -1);
                        return next;
                    });
                }
                setCursor({ word: prevIdx, char: prevTyped.length - 1 });
                return;
            }
            setTypedGrid((prev) => {
                const next = prev.slice();
                next[wIdx] = next[wIdx].slice(0, -1);
                return next;
            });
            if (isZen) {
                setWords((prev) => {
                    const next = prev.slice();
                    next[wIdx] = next[wIdx].slice(0, -1);
                    return next;
                });
            }
            setCursor({ word: wIdx, char: cIdx - 1 });
            return;
        }

        // typed character
        if (isZen) {
            countsRef.current.correct += 1;
            pushHistory();
            setWords((prev) => {
                const next = prev.slice();
                next[wIdx] = next[wIdx] + e.key;
                return next;
            });
            setTypedGrid((prev) => {
                const next = prev.slice();
                next[wIdx] = [...next[wIdx], { status: "correct", char: e.key }];
                return next;
            });
            setCursor({ word: wIdx, char: cIdx + 1 });
            return;
        }

        const status: CharStatus = cIdx >= target.length ? "extra" : (e.key === target[cIdx] ? "correct" : "incorrect");
        if (status === "correct") countsRef.current.correct += 1;
        else if (status === "incorrect") {
            countsRef.current.incorrect += 1;
            const expected = target[cIdx];
            mistakesRef.current[expected] = (mistakesRef.current[expected] || 0) + 1;
        }
        else countsRef.current.extra += 1;
        pushHistory();

        setTypedGrid((prev) => {
            const next = prev.slice();
            next[wIdx] = [...next[wIdx], { status, char: e.key }];
            return next;
        });
        const nextChar = cIdx + 1;
        setCursor({ word: wIdx, char: nextChar });

        const isLastWord = isFixedLengthMode(testType) && wIdx === wordsRef.current.length - 1;
        if (isLastWord && nextChar >= target.length) {
            finishTest();
        }
    }, [testStart, testEnd, fading, testType, startTimer, finishTest, ensureWordSupply]);

    const countdownDisplay = useMemo(() => {
        if (testType === "time") return Math.max(0, Math.ceil(testTime - elapsedMs / 1000));
        return Math.floor(elapsedMs / 1000);
    }, [testType, testTime, elapsedMs]);

    return {
        words,
        typedGrid,
        cursor,
        testStart,
        testEnd,
        countdownDisplay,
        liveStats,
        finalStats,
        inputRef,
        focusInput,
        resetTest,
        handleKeyDown,
        generation,
        fading,
        isFocused,
        handleInputFocus,
        handleInputBlur,
    };
}

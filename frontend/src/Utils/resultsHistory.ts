// A localStorage-backed results history + aggregates, modeled on
// MonkeyType's real per-account analytics shape (packages/schemas/src/
// {results,users,shared}.ts): personal bests grouped by mode+duration,
// completed-test/time-typing totals, a day-streak, and a test-activity
// calendar. No backend/login required -- this is the logged-out/offline
// fallback; logged-in users additionally sync to the real backend (see
// src/Utils/api.js) which mirrors this same aggregate shape server-side.

import type { PersonalBest } from "@ciphersprint/shared";

export interface HistoryEntry {
    mode: string;
    modeDetail: string | number | null;
    wpm: number;
    rawWpm?: number;
    accuracy: number;
    consistency?: number;
    correctChars?: number;
    incorrectChars?: number;
    missedChars?: number;
    extraChars?: number;
    correctWords?: number;
    charMistakes?: Record<string, number>;
    durationSeconds?: number;
    timestamp: number;
    graphData?: [number, number][];
    rawGraphData?: [number, number][];
    errorGraphData?: [number, number][];
}

export interface Streak {
    current: number;
    max: number;
}

export interface Aggregates {
    completedTests: number;
    totalTimeTypingSeconds: number;
    bestWpm: number;
    bestAccuracy: number;
    bestConsistency: number;
    avgWpmLast10: number;
    avgAccuracyLast10: number;
    avgConsistencyLast10: number;
    personalBests: Record<string, PersonalBest>;
    streak: Streak;
    testActivity: Record<string, number>;
    charMistakes: Record<string, number>;
    recent: HistoryEntry[];
}

const STORAGE_KEY = "resultsHistory";
const MAX_ENTRIES = 500;
const GRAPH_DATA_KEPT_FOR = 50; // only the most recent N entries keep their per-second graph arrays

const dayKey = (timestamp: number): string => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function getHistory(): HistoryEntry[] {
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
        return Array.isArray(raw) ? raw : [];
    } catch {
        return [];
    }
}

export function saveResult(finalStats: HistoryEntry | null | undefined): void {
    if (!finalStats) return;
    const history = getHistory();

    const entry: HistoryEntry = {
        mode: finalStats.mode,
        modeDetail: finalStats.modeDetail,
        wpm: finalStats.wpm,
        rawWpm: finalStats.rawWpm,
        accuracy: finalStats.accuracy,
        consistency: finalStats.consistency,
        correctChars: finalStats.correctChars,
        incorrectChars: finalStats.incorrectChars,
        missedChars: finalStats.missedChars,
        extraChars: finalStats.extraChars,
        correctWords: finalStats.correctWords,
        charMistakes: finalStats.charMistakes,
        durationSeconds: finalStats.durationSeconds,
        timestamp: finalStats.timestamp,
    };

    history.push(entry);
    if (history.length > MAX_ENTRIES) {
        history.splice(0, history.length - MAX_ENTRIES);
    }

    // Keep per-second graph arrays only on the most recent N entries, to
    // keep localStorage usage bounded as history grows.
    const cutoff = Math.max(0, history.length - GRAPH_DATA_KEPT_FOR);
    for (let i = 0; i < cutoff; i++) {
        delete history[i].graphData;
        delete history[i].rawGraphData;
        delete history[i].errorGraphData;
    }
    if (cutoff <= history.length - 1) {
        history[history.length - 1].graphData = finalStats.graphData;
        history[history.length - 1].rawGraphData = finalStats.rawGraphData;
        history[history.length - 1].errorGraphData = finalStats.errorGraphData;
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
        // storage full/unavailable -- drop silently, this is best-effort
    }
}

export function getAggregates(): Aggregates {
    const history = getHistory();

    if (history.length === 0) {
        return {
            completedTests: 0,
            totalTimeTypingSeconds: 0,
            bestWpm: 0,
            bestAccuracy: 0,
            bestConsistency: 0,
            avgWpmLast10: 0,
            avgAccuracyLast10: 0,
            avgConsistencyLast10: 0,
            personalBests: {},
            streak: { current: 0, max: 0 },
            testActivity: {},
            charMistakes: {},
            recent: [],
        };
    }

    const completedTests = history.length;
    const totalTimeTypingSeconds = history.reduce((sum, r) => sum + (r.durationSeconds || 0), 0);
    const bestWpm = Math.max(...history.map((r) => r.wpm || 0));
    const bestAccuracy = Math.max(...history.map((r) => r.accuracy || 0));
    const bestConsistency = Math.max(...history.map((r) => r.consistency || 0));

    const last10 = history.slice(-10);
    const avg = (arr: HistoryEntry[], key: "wpm" | "accuracy" | "consistency") =>
        arr.length ? Math.round(arr.reduce((s, r) => s + (r[key] || 0), 0) / arr.length) : 0;
    const avgWpmLast10 = avg(last10, "wpm");
    const avgAccuracyLast10 = avg(last10, "accuracy");
    const avgConsistencyLast10 = avg(last10, "consistency");

    // Personal bests grouped by mode+duration (mirrors MonkeyType's
    // PersonalBests: one best-wpm entry per mode/duration combination).
    const personalBests: Record<string, PersonalBest> = {};
    for (const r of history) {
        const key = `${r.mode}:${r.modeDetail ?? "-"}`;
        if (!personalBests[key] || r.wpm > personalBests[key].wpm) {
            personalBests[key] = {
                mode: r.mode,
                modeDetail: String(r.modeDetail ?? "-"),
                wpm: r.wpm,
                accuracy: r.accuracy,
                consistency: r.consistency ?? 0,
                timestamp: r.timestamp,
            };
        }
    }

    // Test activity calendar: count of tests per calendar day (local time).
    const testActivity: Record<string, number> = {};
    for (const r of history) {
        const key = dayKey(r.timestamp);
        testActivity[key] = (testActivity[key] || 0) + 1;
    }

    // Streak: consecutive calendar days (local time) with >=1 completed test,
    // ending today or yesterday (so a streak isn't broken until a full day
    // is missed).
    const activeDays = [...new Set(history.map((r) => dayKey(r.timestamp)))].sort();
    let maxStreak = 0;
    let running = 0;
    let prevDate: Date | null = null;
    for (const day of activeDays) {
        const d = new Date(day);
        if (prevDate !== null) {
            const diffDays = Math.round((d.getTime() - prevDate.getTime()) / 86400000);
            running = diffDays === 1 ? running + 1 : 1;
        } else {
            running = 1;
        }
        maxStreak = Math.max(maxStreak, running);
        prevDate = d;
    }
    let currentStreak = 0;
    if (activeDays.length > 0) {
        const today = dayKey(Date.now());
        const yesterday = dayKey(Date.now() - 86400000);
        const lastActive = activeDays[activeDays.length - 1];
        if (lastActive === today || lastActive === yesterday) {
            currentStreak = running;
        }
    }

    // Char mistakes summed across all of history.
    const charMistakes: Record<string, number> = {};
    for (const r of history) {
        if (!r.charMistakes) continue;
        for (const [char, count] of Object.entries(r.charMistakes)) {
            charMistakes[char] = (charMistakes[char] || 0) + count;
        }
    }

    return {
        completedTests,
        totalTimeTypingSeconds,
        bestWpm,
        bestAccuracy,
        bestConsistency,
        avgWpmLast10,
        avgAccuracyLast10,
        avgConsistencyLast10,
        personalBests,
        streak: { current: currentStreak, max: maxStreak },
        testActivity,
        charMistakes,
        recent: history.slice(-20).reverse(),
    };
}

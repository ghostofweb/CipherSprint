import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode, Dispatch, SetStateAction } from "react";

export type TestType = "time" | "words" | "quote" | "zen" | "custom";
export type QuoteLength = "short" | "medium" | "long";

interface TestModeContextValue {
    testTime: number;
    setTestTime: Dispatch<SetStateAction<number>>;
    testType: TestType;
    setTestType: Dispatch<SetStateAction<TestType>>;
    wordCount: number;
    setWordCount: Dispatch<SetStateAction<number>>;
    quoteLength: QuoteLength;
    setQuoteLength: Dispatch<SetStateAction<QuoteLength>>;
    customText: string;
    setCustomText: Dispatch<SetStateAction<string>>;
    punctuation: boolean;
    setPunctuation: Dispatch<SetStateAction<boolean>>;
    numbers: boolean;
    setNumbers: Dispatch<SetStateAction<boolean>>;
    // Set while the custom text is a weak-keys practice run.
    practiceKeys: string[] | null;
    startPractice: (keys: string[], text: string) => void;
    stopPractice: () => void;
}

const TestModeContext = createContext<TestModeContextValue | undefined>(undefined);

const STORAGE_KEY = "testMode";

interface Stored {
    testTime: number;
    testType: TestType;
    wordCount: number;
    quoteLength: QuoteLength;
    punctuation: boolean;
    numbers: boolean;
}

// The mode you used last is the one you get next visit (not custom/practice:
// their text is not worth resurrecting).
function readStored(): Partial<Stored> {
    try {
        const v = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
        if (!v || typeof v !== "object") return {};
        const out: Partial<Stored> = {};
        if ([15, 30, 60, 120].includes(v.testTime)) out.testTime = v.testTime;
        if (["time", "words", "quote", "zen"].includes(v.testType)) out.testType = v.testType;
        if ([15, 30, 50, 100].includes(v.wordCount)) out.wordCount = v.wordCount;
        if (["short", "medium", "long"].includes(v.quoteLength)) out.quoteLength = v.quoteLength;
        if (typeof v.punctuation === "boolean") out.punctuation = v.punctuation;
        if (typeof v.numbers === "boolean") out.numbers = v.numbers;
        return out;
    } catch {
        return {};
    }
}

export const TestModeContextProvider = ({ children }: { children: ReactNode }) => {
    const [stored] = useState(readStored);
    const [testTime, setTestTime] = useState(stored.testTime ?? 30);
    const [testType, setTestType] = useState<TestType>(stored.testType ?? "time");
    const [wordCount, setWordCount] = useState(stored.wordCount ?? 30);
    const [quoteLength, setQuoteLength] = useState<QuoteLength>(stored.quoteLength ?? "medium");
    const [customText, setCustomText] = useState("");
    const [punctuation, setPunctuation] = useState(stored.punctuation ?? false);
    const [numbers, setNumbers] = useState(stored.numbers ?? false);
    const [practiceKeys, setPracticeKeys] = useState<string[] | null>(null);

    useEffect(() => {
        const keep = testType === "custom" ? readStored().testType ?? "time" : testType;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ testTime, testType: keep, wordCount, quoteLength, punctuation, numbers }));
        } catch {
            // Not remembering the mode is harmless.
        }
    }, [testTime, testType, wordCount, quoteLength, punctuation, numbers]);

    // Leaving custom mode ends a practice run.
    useEffect(() => {
        if (testType !== "custom") setPracticeKeys(null);
    }, [testType]);

    const startPractice = useCallback((keys: string[], text: string) => {
        setCustomText(text);
        setPracticeKeys(keys);
        setTestType("custom");
    }, []);

    const stopPractice = useCallback(() => {
        setPracticeKeys(null);
        setTestType("time");
    }, []);

    const values: TestModeContextValue = {
        testTime,
        setTestTime,
        testType,
        setTestType,
        wordCount,
        setWordCount,
        quoteLength,
        setQuoteLength,
        customText,
        setCustomText,
        punctuation,
        setPunctuation,
        numbers,
        setNumbers,
        practiceKeys,
        startPractice,
        stopPractice,
    };

    return <TestModeContext.Provider value={values}>{children}</TestModeContext.Provider>;
};

export const useTestMode = (): TestModeContextValue => {
    const ctx = useContext(TestModeContext);
    if (!ctx) throw new Error("useTestMode must be used within a TestModeContextProvider");
    return ctx;
};

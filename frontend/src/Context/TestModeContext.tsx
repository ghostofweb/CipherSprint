import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from "react";

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
}

const TestModeContext = createContext<TestModeContextValue | undefined>(undefined);

export const TestModeContextProvider = ({ children }: { children: ReactNode }) => {
    const [testTime, setTestTime] = useState(15);
    const [testType, setTestType] = useState<TestType>("time");
    const [wordCount, setWordCount] = useState(15); // For word mode, default 15
    const [quoteLength, setQuoteLength] = useState<QuoteLength>("medium");
    const [customText, setCustomText] = useState("");
    const [punctuation, setPunctuation] = useState(false);
    const [numbers, setNumbers] = useState(false);

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
    };

    return (
        <TestModeContext.Provider value={values}>
            {children}
        </TestModeContext.Provider>
    );
};

export const useTestMode = (): TestModeContextValue => {
    const ctx = useContext(TestModeContext);
    if (!ctx) throw new Error("useTestMode must be used within a TestModeContextProvider");
    return ctx;
};

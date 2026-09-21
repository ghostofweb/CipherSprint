// UpperMenu.tsx
import React, { useState } from 'react';
import { useTestMode, TestType } from '../Context/TestModeContext';
import CustomTextModal from './CustomTextModal';

const TIME_OPTIONS = [15, 30, 60];
const WORD_OPTIONS = [15, 30, 50];
const QUOTE_LENGTH_OPTIONS: ("short" | "medium" | "long")[] = ["short", "medium", "long"];
const MODE_TABS: { value: TestType; label: string }[] = [
    { value: "time", label: "time" },
    { value: "words", label: "words" },
    { value: "quote", label: "quote" },
    { value: "zen", label: "zen" },
    { value: "custom", label: "custom" },
];

const UpperMenu = () => {
    const {
        testTime, setTestTime,
        testType, setTestType,
        wordCount, setWordCount,
        quoteLength, setQuoteLength,
        customText, setCustomText,
        punctuation, setPunctuation,
        numbers, setNumbers,
    } = useTestMode();

    const [modalOpen, setModalOpen] = useState(false);

    const showModifiers = testType === "time" || testType === "words";

    const handleModeClick = (mode: TestType) => {
        setTestType(mode);
        if (mode === "custom" && !customText.trim()) {
            setModalOpen(true);
        }
    };

    return (
        <div className="upper-menu">
            <div className="upper-menu-left">
                {showModifiers && (
                    <>
                        <div
                            className={`modifier-toggle ${punctuation ? "active" : ""}`}
                            onClick={() => setPunctuation((p) => !p)}
                        >
                            @ punctuation
                        </div>
                        <div
                            className={`modifier-toggle ${numbers ? "active" : ""}`}
                            onClick={() => setNumbers((n) => !n)}
                        >
                            # numbers
                        </div>
                    </>
                )}
            </div>

            <div className="upper-menu-center">
                {MODE_TABS.map(({ value, label }) => (
                    <div
                        key={value}
                        className={`mode-tab ${testType === value ? "active" : ""}`}
                        onClick={() => handleModeClick(value)}
                    >
                        {label}
                    </div>
                ))}
                {testType === "custom" && (
                    <div className="mode-tab-edit" onClick={() => setModalOpen(true)}>edit</div>
                )}
            </div>

            <div className="upper-menu-right">
                {testType === "time" && (
                    <div className="time-options">
                        {TIME_OPTIONS.map((value) => (
                            <div
                                key={value}
                                className={`time-option ${testTime === value ? "active" : ""}`}
                                onClick={() => setTestTime(value)}
                            >
                                {value}s
                            </div>
                        ))}
                    </div>
                )}
                {testType === "words" && (
                    <div className="word-options">
                        {WORD_OPTIONS.map((value) => (
                            <div
                                key={value}
                                className={`word-option ${wordCount === value ? "active" : ""}`}
                                onClick={() => setWordCount(value)}
                            >
                                {value} words
                            </div>
                        ))}
                    </div>
                )}
                {testType === "quote" && (
                    <div className="quote-options">
                        {QUOTE_LENGTH_OPTIONS.map((value) => (
                            <div
                                key={value}
                                className={`quote-option ${quoteLength === value ? "active" : ""}`}
                                onClick={() => setQuoteLength(value)}
                            >
                                {value}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CustomTextModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                value={customText}
                onSave={setCustomText}
            />
        </div>
    );
};

export default UpperMenu;

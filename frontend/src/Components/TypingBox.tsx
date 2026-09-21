import React, { createRef, forwardRef, memo, useEffect, useLayoutEffect, useMemo, useRef, useState, RefObject } from 'react';
import IconButton from './ui/IconButton';
import UpperMenu from './UpperMenu';
import Stats from "./Stats";
import { useTestMode } from '../Context/TestModeContext';
import type { TypedChar, Cursor, FinalStats } from '../Hooks/useTypingEngine';

interface WordProps {
    word: string;
    typed: TypedChar[];
    isCommitted: boolean;
}

// Memoized so a keystroke only re-renders the word(s) whose props actually
// changed (the active word, and the one just committed) instead of every
// word in the test re-diffing on every character typed.
const Word = memo(forwardRef<HTMLSpanElement, WordProps>(function Word({ word, typed, isCommitted }, ref) {
    return (
        <span className="word" ref={ref}>
            {word.split('').map((ch, cIdx) => {
                const entry = typed[cIdx];
                const cls = entry ? entry.status : (isCommitted ? "missed" : "");
                return <span key={cIdx} className={cls}>{ch}</span>;
            })}
            {typed.slice(word.length).map((entry, i) => (
                <span key={`extra-${i}`} className="incorrect extra">{entry.char}</span>
            ))}
        </span>
    );
}));

interface TypingBoxProps {
    words: string[];
    typedGrid: TypedChar[][];
    cursor: Cursor;
    testStart: boolean;
    testEnd: boolean;
    countdownDisplay: number;
    finalStats: FinalStats | null;
    inputRef: RefObject<HTMLInputElement>;
    focusInput: () => void;
    resetTest: () => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    generation: number;
    fading: boolean;
    isFocused: boolean;
    handleInputFocus: () => void;
    handleInputBlur: () => void;
}

function TypingBox({
    words,
    typedGrid,
    cursor,
    testStart,
    testEnd,
    countdownDisplay,
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
}: TypingBoxProps) {
    const { testType } = useTestMode();
    const replayButtonRef = useRef<HTMLButtonElement>(null);
    const wordsContainerRef = useRef<HTMLDivElement>(null);
    const caretRef = useRef<HTMLDivElement>(null);

    // Line-scroll bookkeeping (mirrors MonkeyType's currentTestLine/lineJump).
    const prevWordTopRef = useRef<number | null>(null);
    const shiftYRef = useRef(0);
    const wrapCountRef = useRef(0);

    const [boxHeight, setBoxHeight] = useState<number | null>(null);

    const wordRefs = useMemo(
        () => Array(words.length).fill(0).map(() => createRef<HTMLSpanElement>()),
        [words.length]
    );

    // Reset line-scroll state whenever a new test starts.
    useEffect(() => {
        prevWordTopRef.current = null;
        shiftYRef.current = 0;
        wrapCountRef.current = 0;
        if (wordsContainerRef.current) {
            wordsContainerRef.current.style.transform = 'translateY(0px)';
        }
    }, [generation]);

    // Measure the real pixel height of 3 lines of words and lock the box to
    // it, so exactly 3 lines are ever visible (MonkeyType's
    // updateWordsWrapperHeight, done by walking rendered word offsets
    // instead of guessing a viewport-relative height).
    useLayoutEffect(() => {
        const measure = () => {
            const wordEls = wordRefs.map((r) => r.current).filter((el): el is HTMLSpanElement => Boolean(el));
            if (wordEls.length === 0) return;

            // Collect the offsetTop of each distinct row, up to 3 rows.
            const lineTops: number[] = [];
            for (const el of wordEls) {
                const top = el.offsetTop;
                if (lineTops.length === 0 || top !== lineTops[lineTops.length - 1]) {
                    lineTops.push(top);
                    if (lineTops.length === 3) break;
                }
            }
            if (lineTops.length === 0) return;

            // Row pitch = real distance between consecutive rows (already
            // includes margin + flex gap, however the layout produces it).
            // Fall back to offsetHeight + vertical margin when only one row
            // is rendered (e.g. a short word-mode test).
            let rowPitch: number;
            if (lineTops.length >= 2) {
                rowPitch = lineTops[1] - lineTops[0];
            } else {
                const style = window.getComputedStyle(wordEls[0]);
                const vMargin = parseFloat(style.marginTop || "0") + parseFloat(style.marginBottom || "0");
                rowPitch = wordEls[0].offsetHeight + vMargin;
            }

            if (rowPitch > 0) setBoxHeight(rowPitch * 3);
        };

        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [wordRefs, generation]);

    // Reposition the caret on every keystroke using plain layout offsets
    // (offsetLeft/offsetTop), matching MonkeyType's caret positioning —
    // cheap enough to run per-character, unlike the line-scroll check below.
    useLayoutEffect(() => {
        const wordEl = wordRefs[cursor.word]?.current;
        const caret = caretRef.current;
        if (!wordEl || !caret) return;

        const charEl = wordEl.children[cursor.char] as HTMLElement | undefined;
        let left: number, top: number, height: number;
        if (charEl) {
            left = wordEl.offsetLeft + charEl.offsetLeft;
            top = wordEl.offsetTop + charEl.offsetTop;
            height = charEl.offsetHeight;
        } else {
            const lastChild = wordEl.lastElementChild as HTMLElement | null;
            left = wordEl.offsetLeft + (lastChild ? lastChild.offsetLeft + lastChild.offsetWidth : 0);
            top = wordEl.offsetTop + (lastChild ? lastChild.offsetTop : 0);
            height = lastChild ? lastChild.offsetHeight : wordEl.offsetHeight;
        }

        caret.style.left = `${left}px`;
        caret.style.top = `${top}px`;
        caret.style.height = `${height}px`;
    }, [cursor, wordRefs]);

    // Shift the words container up by exactly one line's worth of pixels
    // whenever the active word wraps to a new row. Only runs on word
    // advance (not per keystroke), and skips the very first wrap so the
    // current line naturally settles as the 2nd of the 3 visible lines —
    // this is MonkeyType's updateActiveElement + lineJump behavior.
    useLayoutEffect(() => {
        const wordEl = wordRefs[cursor.word]?.current;
        const container = wordsContainerRef.current;
        if (!wordEl || !container) return;

        const top = wordEl.offsetTop;
        if (prevWordTopRef.current !== null && top > prevWordTopRef.current) {
            if (wrapCountRef.current > 0) {
                shiftYRef.current += top - prevWordTopRef.current;
                container.style.transform = `translateY(-${shiftYRef.current}px)`;
            }
            wrapCountRef.current += 1;
        }
        prevWordTopRef.current = top;
    }, [cursor.word, wordRefs]);

    const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Tab") {
            e.preventDefault();
            replayButtonRef.current?.focus();
        }
        if (e.key === "Escape") {
            resetTest();
        }
        if (e.key === "Enter" && testEnd) {
            resetTest();
        }
    };

    const hideChrome = testStart && !testEnd;

    return (
        <div className="typing-test-shell" onKeyDown={handleContainerKeyDown}>
            <div className={`mode-bar${hideChrome ? ' chrome-hidden' : ''}`}>
                <UpperMenu />
            </div>
            <div className={`typing-test${fading ? ' fading' : ''}`}>
                {testEnd && finalStats ? (
                    <Stats {...finalStats} resetTest={resetTest} />
                ) : (
                    <>
                        <div className="test-timer">{countdownDisplay}</div>
                        <div
                            className="type-box"
                            onClick={focusInput}
                            style={boxHeight ? { height: `${boxHeight}px` } : undefined}
                        >
                            <div className={`words${testType === 'zen' ? ' zen-words' : ''}${isFocused ? '' : ' blurred'}`} ref={wordsContainerRef}>
                                <div className={`caret${testStart ? '' : ' idle'}`} ref={caretRef} />
                                {words.map((word, wIdx) => (
                                    <Word
                                        key={wIdx}
                                        ref={wordRefs[wIdx]}
                                        word={word}
                                        typed={typedGrid[wIdx] || []}
                                        isCommitted={wIdx < cursor.word}
                                    />
                                ))}
                            </div>
                            {!isFocused && (
                                <div className="focus-overlay">click here to focus</div>
                            )}
                        </div>
                    </>
                )}
                {!(testEnd && finalStats) && (
                    <div className={`replay-container${hideChrome ? ' chrome-hidden' : ''}`}>
                        <IconButton
                            ref={replayButtonRef}
                            icon="restart"
                            iconSize={24}
                            label="Restart test"
                            onClick={resetTest}
                        />
                    </div>
                )}
            </div>
            <input
                type="text"
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className="hidden-input"
                ref={inputRef}
                aria-label="Typing input"
            />
        </div>
    );
}

export default TypingBox;

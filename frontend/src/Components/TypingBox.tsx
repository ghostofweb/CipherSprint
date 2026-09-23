import React, { useEffect, useRef, useState, RefObject } from 'react';
import IconButton from './ui/IconButton';
import Icon from './ui/Icon';
import UpperMenu from './UpperMenu';
import Stats from "./Stats";
import TypingSurface from './TypingSurface';
import { useTestMode } from '../Context/TestModeContext';
import { useSettings } from '../Context/SettingsContext';
import { LANGUAGE_NAMES } from '../Utils/words';
import type { TypedChar, Cursor, FinalStats } from '../Hooks/useTypingEngine';

interface TypingBoxProps {
    words: string[];
    typedGrid: TypedChar[][];
    cursor: Cursor;
    testStart: boolean;
    testEnd: boolean;
    countdownDisplay: number;
    liveStats: { wpm: number; accuracy: number };
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
}: TypingBoxProps) {
    const { testType, practiceKeys, stopPractice } = useTestMode();
    const { settings } = useSettings();
    const replayButtonRef = useRef<HTMLButtonElement>(null);
    const [capsLock, setCapsLock] = useState(false);

    // The palette's "Restart test" (and anything else) can ask for a restart.
    useEffect(() => {
        const onRestart = () => resetTest();
        window.addEventListener('cipher:restart', onRestart);
        return () => window.removeEventListener('cipher:restart', onRestart);
    }, [resetTest]);

    const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Tab") {
            e.preventDefault();
            if (settings.tabRestart) resetTest();
            else replayButtonRef.current?.focus();
        }
        if (e.key === "Escape") {
            resetTest();
        }
        if (e.key === "Enter" && testEnd) {
            resetTest();
        }
    };

    // Caps lock silently ruins a test; say so before the first wrong capital.
    const readCaps = (e: React.KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.('CapsLock') ?? false);

    const hideChrome = testStart && !testEnd;
    const running = testStart && !testEnd;
    const showWpm = settings.liveStats !== 'off' && running;
    const showAcc = settings.liveStats === 'both' && running;

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
                        <div className="test-status">
                            <div className="test-timer tnum" aria-label={testType === 'time' ? 'Seconds left' : 'Seconds elapsed'}>{countdownDisplay}</div>
                            {showWpm && (
                                <div className="test-live tnum" aria-live="off">
                                    <span className="test-live__value">{liveStats.wpm}</span>
                                    <span className="test-live__unit">wpm</span>
                                    {showAcc && (
                                        <>
                                            <span className="test-live__value">{liveStats.accuracy}%</span>
                                            <span className="test-live__unit">acc</span>
                                        </>
                                    )}
                                </div>
                            )}
                            <div className={`test-context${hideChrome ? ' chrome-hidden' : ''}`}>
                                {practiceKeys ? (
                                    <span className="test-chip">
                                        <Icon name="target" size={14} />
                                        practising {practiceKeys.join(' ')}
                                        <button type="button" className="test-chip__x" onClick={stopPractice} aria-label="Stop practising">
                                            <Icon name="close" size={12} />
                                        </button>
                                    </span>
                                ) : settings.language !== 'english' && testType !== 'quote' && testType !== 'custom' ? (
                                    <span className="test-chip"><Icon name="globe" size={14} />{LANGUAGE_NAMES[settings.language].toLowerCase()}</span>
                                ) : null}
                            </div>
                        </div>
                        {capsLock && (
                            <div className="caps-warning" role="alert">
                                <Icon name="alert-circle" size={16} /> Caps Lock is on
                            </div>
                        )}
                        <TypingSurface
                            words={words}
                            typedGrid={typedGrid}
                            cursor={cursor}
                            testStart={testStart}
                            generation={generation}
                            isFocused={isFocused}
                            focusInput={focusInput}
                            zen={testType === 'zen'}
                        />
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
                onKeyDown={(e) => {
                    readCaps(e);
                    handleKeyDown(e);
                }}
                onKeyUp={readCaps}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className="hidden-input"
                ref={inputRef}
                aria-label="Typing input"
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
            />
        </div>
    );
}

export default TypingBox;

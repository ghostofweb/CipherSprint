import React, { useState } from 'react';
import { LANGUAGES } from '@ciphersprint/shared';
import { useTestMode, TestType } from '../Context/TestModeContext';
import { useSettings } from '../Context/SettingsContext';
import CustomTextModal from './CustomTextModal';
import Icon from './ui/Icon';
import Menu from './ui/Menu';
import { LANGUAGE_NAMES } from '../Utils/words';
import { cx } from '../Utils/cx';

const TIME_OPTIONS = [15, 30, 60, 120];
const WORD_OPTIONS = [15, 30, 50, 100];
const QUOTE_LENGTH_OPTIONS: ("short" | "medium" | "long")[] = ["short", "medium", "long"];
const MODE_TABS: TestType[] = ["time", "words", "quote", "zen", "custom"];

function Opt({ active, onClick, children, label }: { active: boolean; onClick: () => void; children: React.ReactNode; label?: string }) {
    return (
        <button type="button" className={cx('mode-opt', active && 'is-active')} aria-pressed={active} aria-label={label} onClick={onClick}>
            {children}
        </button>
    );
}

// One strip, read left to right: what is in the text, how the test ends,
// how long it lasts, and the language.
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
    const { settings, update } = useSettings();
    const [modalOpen, setModalOpen] = useState(false);
    const [langAnchor, setLangAnchor] = useState<HTMLElement | null>(null);

    const showModifiers = testType === "time" || testType === "words";
    const showLanguage = testType === "time" || testType === "words";

    const handleModeClick = (mode: TestType) => {
        setTestType(mode);
        if (mode === "custom" && !customText.trim()) setModalOpen(true);
    };

    return (
        <div className="mode-strip" role="toolbar" aria-label="Test settings">
            {showModifiers && (
                <div className="mode-group">
                    <Opt active={punctuation} onClick={() => setPunctuation((p) => !p)} label="Punctuation">
                        <span className="mode-opt__sym" aria-hidden="true">@</span> punctuation
                    </Opt>
                    <Opt active={numbers} onClick={() => setNumbers((n) => !n)} label="Numbers">
                        <span className="mode-opt__sym" aria-hidden="true">#</span> numbers
                    </Opt>
                </div>
            )}

            <div className="mode-group">
                {MODE_TABS.map((value) => (
                    <Opt key={value} active={testType === value} onClick={() => handleModeClick(value)}>
                        {value}
                    </Opt>
                ))}
            </div>

            {testType === "time" && (
                <div className="mode-group">
                    {TIME_OPTIONS.map((value) => (
                        <Opt key={value} active={testTime === value} onClick={() => setTestTime(value)} label={`${value} seconds`}>
                            {value}
                        </Opt>
                    ))}
                </div>
            )}
            {testType === "words" && (
                <div className="mode-group">
                    {WORD_OPTIONS.map((value) => (
                        <Opt key={value} active={wordCount === value} onClick={() => setWordCount(value)} label={`${value} words`}>
                            {value}
                        </Opt>
                    ))}
                </div>
            )}
            {testType === "quote" && (
                <div className="mode-group">
                    {QUOTE_LENGTH_OPTIONS.map((value) => (
                        <Opt key={value} active={quoteLength === value} onClick={() => setQuoteLength(value)}>
                            {value}
                        </Opt>
                    ))}
                </div>
            )}
            {testType === "custom" && (
                <div className="mode-group">
                    <Opt active={false} onClick={() => setModalOpen(true)}>edit text</Opt>
                </div>
            )}

            {showLanguage && (
                <div className="mode-group">
                    <button
                        type="button"
                        className="mode-opt"
                        aria-haspopup="menu"
                        aria-label={`Language: ${LANGUAGE_NAMES[settings.language]}`}
                        onClick={(e) => setLangAnchor(e.currentTarget)}
                    >
                        <Icon name="globe" size={14} /> {LANGUAGE_NAMES[settings.language].toLowerCase()}
                    </button>
                    <Menu
                        anchorEl={langAnchor}
                        open={!!langAnchor}
                        onClose={() => setLangAnchor(null)}
                        actions={LANGUAGES.map((lang) => ({
                            id: lang,
                            label: `${LANGUAGE_NAMES[lang]}${settings.language === lang ? ' ✓' : ''}`,
                            onSelect: () => update({ language: lang }),
                        }))}
                    />
                </div>
            )}

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

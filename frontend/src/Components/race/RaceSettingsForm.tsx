import React from 'react';
import { LANGUAGE_NAMES } from '../../Utils/words';
import {
    LANGUAGES,
    RACE_FORMATS,
    RACE_QUOTE_LENGTHS,
    RACE_SECONDS,
    RACE_WORD_COUNTS,
    RACE_WORD_LENGTHS,
} from '@ciphersprint/shared';
import type { RaceSettings } from '@ciphersprint/shared';
import Segmented from '../ui/Segmented';
import Switch from '../ui/Switch';

interface RaceSettingsFormProps {
    settings: RaceSettings;
    onChange: (settings: RaceSettings) => void;
    disabled?: boolean;
}

const RULES: Record<RaceSettings['format'], string> = {
    time: 'Highest wpm when the clock runs out wins.',
    words: 'First to type all the words wins.',
    quote: 'First to type the whole quote wins.',
};

// What the host picks: how the race is decided, how long it is, and what the
// text is made of. Fields for the other formats keep their values, so
// switching back does not lose a choice.
function RaceSettingsForm({ settings, onChange, disabled }: RaceSettingsFormProps) {
    const set = <K extends keyof RaceSettings>(key: K, value: RaceSettings[K]) => onChange({ ...settings, [key]: value });
    const { format } = settings;

    return (
        <fieldset className="rs-form" disabled={disabled}>
            <div className="rs-row">
                <span className="rs-label">Format</span>
                <Segmented
                    label="Race format"
                    value={format}
                    onChange={(v) => set('format', v)}
                    options={RACE_FORMATS.map((f) => ({ value: f, label: f }))}
                />
            </div>
            <p className="rs-rule">{RULES[format]}</p>

            <div className="rs-row">
                <span className="rs-label">{format === 'time' ? 'Time' : format === 'words' ? 'Words' : 'Quote'}</span>
                {format === 'time' && (
                    <Segmented
                        label="Time limit"
                        value={settings.seconds}
                        onChange={(v) => set('seconds', v)}
                        options={RACE_SECONDS.map((s) => ({ value: s, label: `${s}s` }))}
                    />
                )}
                {format === 'words' && (
                    <Segmented
                        label="Number of words"
                        value={settings.words}
                        onChange={(v) => set('words', v)}
                        options={RACE_WORD_COUNTS.map((n) => ({ value: n, label: String(n) }))}
                    />
                )}
                {format === 'quote' && (
                    <Segmented
                        label="Quote length"
                        value={settings.quoteLength}
                        onChange={(v) => set('quoteLength', v)}
                        options={RACE_QUOTE_LENGTHS.map((q) => ({ value: q, label: q }))}
                    />
                )}
            </div>

            {format !== 'quote' && (
                <>
                    <div className="rs-row">
                        <span className="rs-label">Word length</span>
                        <Segmented
                            label="Word length"
                            value={settings.wordLength}
                            onChange={(v) => set('wordLength', v)}
                            options={RACE_WORD_LENGTHS.map((w) => ({ value: w, label: w }))}
                        />
                    </div>
                    <div className="rs-row">
                        <span className="rs-label">Language</span>
                        <select
                            className="rs-select"
                            aria-label="Language"
                            value={settings.language}
                            onChange={(e) => set('language', e.target.value as RaceSettings['language'])}
                        >
                            {LANGUAGES.map((l) => (
                                <option key={l} value={l}>{LANGUAGE_NAMES[l]}</option>
                            ))}
                        </select>
                    </div>
                    <div className="rs-row rs-row--switch">
                        <span className="rs-label">Punctuation</span>
                        <Switch label="Punctuation" checked={settings.punctuation} onChange={(v) => set('punctuation', v)} disabled={disabled} />
                    </div>
                    <div className="rs-row rs-row--switch">
                        <span className="rs-label">Numbers</span>
                        <Switch label="Numbers" checked={settings.numbers} onChange={(v) => set('numbers', v)} disabled={disabled} />
                    </div>
                </>
            )}
        </fieldset>
    );
}

export default RaceSettingsForm;

import React from 'react';
import { frameOf, glyphAt, isRevealed, useDecodeProgress } from '../Hooks/useDecrypt';
import { useSettings } from '../Context/SettingsContext';

interface DecryptTextProps {
    text: string;
    // Plays again whenever this changes (defaults to the text itself).
    runKey?: unknown;
    duration?: number;
    className?: string;
}

// A short string (a result number, "404") that decodes once into place.
// Screen readers get the real text straight away.
function DecryptText({ text, runKey, duration = 520, className }: DecryptTextProps) {
    const { settings } = useSettings();
    const progress = useDecodeProgress(runKey ?? text, settings.decrypt, duration);
    const frame = frameOf(progress);
    const shown = progress >= 1
        ? text
        : text
              .split('')
              .map((ch, i) => (ch === ' ' || isRevealed(i, text.length, progress) ? ch : glyphAt(i, frame)))
              .join('');

    return (
        <span className={className}>
            <span aria-hidden="true">{shown}</span>
            <span className="visually-hidden">{text}</span>
        </span>
    );
}

export default DecryptText;

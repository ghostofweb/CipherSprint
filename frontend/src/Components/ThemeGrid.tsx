import React, { useMemo, useState } from 'react';
import Input from './ui/Input';
import { themeOptions, isOriginalTheme, Theme } from '../Utils/themeOptions';
import { luminance } from '../Utils/themeTokens';
import { useTheme } from '../Context/ThemeContext';
import { cx } from '../Utils/cx';

interface Section {
    title: string;
    note?: string;
    themes: Theme[];
}

// Every theme as a small live sample of the test. Pointing at one previews
// it on the whole page; clicking chooses it.
function ThemeGrid() {
    const { chosen, setTheme, previewTheme } = useTheme();
    const [query, setQuery] = useState('');

    const sections = useMemo<Section[]>(() => {
        const q = query.trim().toLowerCase();
        const all = themeOptions.map((t) => t.value).filter((t) => !q || t.label.toLowerCase().includes(q));
        const originals = all.filter((t) => isOriginalTheme(t.label));
        const rest = all.filter((t) => !isOriginalTheme(t.label));
        return [
            { title: 'CipherSprint originals', note: 'Amber on graphite, and its paper twin.', themes: originals },
            { title: 'Dark', themes: rest.filter((t) => luminance(t.background) <= 0.5) },
            { title: 'Light', themes: rest.filter((t) => luminance(t.background) > 0.5) },
        ].filter((s) => s.themes.length > 0);
    }, [query]);

    return (
        <div className="tg" onMouseLeave={() => previewTheme(null)}>
            <Input
                label="Filter themes"
                icon="search"
                placeholder="Filter themes"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClear={() => setQuery('')}
            />
            {sections.length === 0 && <p className="tg-empty">No theme is called “{query}”.</p>}
            {sections.map((s) => (
                <section key={s.title} className="tg-section" aria-label={s.title}>
                    <h3 className="tg-title">
                        {s.title} <span className="tg-count tnum">{s.themes.length}</span>
                    </h3>
                    {s.note && <p className="tg-note">{s.note}</p>}
                    <div className={cx('tg-grid', s.title === 'CipherSprint originals' && 'tg-grid--hero')}>
                        {s.themes.map((t) => {
                            const selected = t.label === chosen.label;
                            return (
                                <button
                                    type="button"
                                    key={t.label}
                                    className={cx('tg-card', selected && 'is-selected')}
                                    aria-pressed={selected}
                                    onMouseEnter={() => previewTheme(t)}
                                    onFocus={() => previewTheme(t)}
                                    onBlur={() => previewTheme(null)}
                                    onClick={() => setTheme(t)}
                                >
                                    <span className="tg-sample" style={{ background: t.background }} aria-hidden="true">
                                        <span style={{ color: t.correctWordColor }}>type</span>
                                        <span className="tg-caret" style={{ background: t.cursorColor }} />
                                        <span style={{ color: t.wordColor }}>fast</span>
                                        <span style={{ color: t.incorrectWordColor }}> x</span>
                                    </span>
                                    <span className="tg-label">{t.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>
            ))}
        </div>
    );
}

export default ThemeGrid;

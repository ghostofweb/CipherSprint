import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Modal } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CARET_STYLES, FONT_SIZES, LANGUAGES, LIVE_STATS, SOUNDS } from '@ciphersprint/shared';
import Icon, { IconName } from './ui/Icon';
import { useTheme } from '../Context/ThemeContext';
import { useSettings } from '../Context/SettingsContext';
import { useTestMode } from '../Context/TestModeContext';
import { useAuth } from '../Context/AuthContext';
import { useSocial } from '../Context/SocialContext';
import { useUi } from '../Context/UiContext';
import { usePractice } from '../Hooks/usePractice';
import { themeOptions, isOriginalTheme } from '../Utils/themeOptions';
import { openAuthModal } from '../Utils/authModal';
import { luminance } from '../Utils/themeTokens';
import { LANGUAGE_NAMES } from '../Utils/words';
import { cx } from '../Utils/cx';

interface Command {
    id: string;
    group: string;
    label: string;
    // Extra words the search matches (not shown).
    keywords?: string;
    hint?: string;
    icon?: IconName;
    // Swatch colours for theme rows.
    swatch?: [string, string, string];
    run: () => void;
    // Called while the row is highlighted (theme preview).
    preview?: () => void;
    // Selecting keeps the palette open (opens a sub-list).
    stay?: boolean;
}

type Mode = 'root' | 'theme' | 'language';

// Subsequence match: every query letter appears in order. Earlier and
// tighter matches score higher. Returns the matched indices for bolding.
function fuzzy(text: string, query: string): { score: number; hits: number[] } | null {
    if (!query) return { score: 0, hits: [] };
    const t = text.toLowerCase();
    const q = query.toLowerCase();
    const hits: number[] = [];
    let from = 0;
    for (const ch of q) {
        if (ch === ' ') continue;
        const i = t.indexOf(ch, from);
        if (i === -1) return null;
        hits.push(i);
        from = i + 1;
    }
    const spread = hits.length ? hits[hits.length - 1] - hits[0] : 0;
    const wordStart = t.startsWith(q) ? 30 : 0;
    return { score: 100 - spread - hits[0] + wordStart, hits };
}

function Label({ text, hits }: { text: string; hits: number[] }) {
    if (hits.length === 0) return <>{text}</>;
    const set = new Set(hits);
    return (
        <>
            {text.split('').map((ch, i) => (set.has(i) ? <b key={i}>{ch}</b> : <React.Fragment key={i}>{ch}</React.Fragment>))}
        </>
    );
}

const cycle = <T,>(list: readonly T[], current: T): T => list[(list.indexOf(current) + 1) % list.length];

interface CommandPaletteProps {
    open: boolean;
    onClose: () => void;
}

// Ctrl/Cmd+K: every action in the app from the keyboard. Themes preview live
// while highlighted and revert if you back out.
function CommandPalette({ open, onClose }: CommandPaletteProps) {
    const navigate = useNavigate();
    const { chosen, setTheme, previewTheme } = useTheme();
    const { settings, update } = useSettings();
    const mode = useTestMode();
    const { user, logout } = useAuth();
    const social = useSocial();
    const { openShortcuts, openThemePicker } = useUi();
    const practise = usePractice();

    const [view, setView] = useState<Mode>('root');
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const listId = useId();

    useEffect(() => {
        if (open) {
            const id = requestAnimationFrame(() => inputRef.current?.focus());
            return () => cancelAnimationFrame(id);
        }
        // Reset on close, so keys typed the instant it reopens are kept.
        setView('root');
        setQuery('');
        setActive(0);
        previewTheme(null);
        return undefined;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const done = () => {
        previewTheme(null);
        onClose();
    };
    const go = (path: string) => () => {
        navigate(path);
    };
    const restart = () => window.dispatchEvent(new Event('cipher:restart'));
    const setTest = (fn: () => void) => () => {
        fn();
        navigate('/');
    };

    const commands = useMemo<Command[]>(() => {
        if (view === 'theme') {
            const sorted = themeOptions.slice().sort((a, b) => Number(isOriginalTheme(b.label)) - Number(isOriginalTheme(a.label)));
            return sorted.map(({ label, value }) => ({
                id: `theme:${label}`,
                group: isOriginalTheme(label) ? 'CipherSprint originals' : luminance(value.background) > 0.5 ? 'Light' : 'Dark',
                label,
                hint: label === chosen.label ? 'current' : undefined,
                swatch: [value.background, value.cursorColor, value.textColor],
                preview: () => previewTheme(value),
                run: () => setTheme(value),
            }));
        }
        if (view === 'language') {
            return LANGUAGES.map((lang) => ({
                id: `lang:${lang}`,
                group: 'Language',
                label: LANGUAGE_NAMES[lang],
                hint: settings.language === lang ? 'current' : undefined,
                run: setTest(() => update({ language: lang })),
            }));
        }
        const list: Command[] = [
            { id: 'restart', group: 'Test', label: 'Restart test', icon: 'restart', keywords: 'new again reset', hint: 'esc', run: setTest(restart) },
            ...[15, 30, 60, 120].map((s) => ({
                id: `time:${s}`, group: 'Test', label: `Time ${s}s`, keywords: 'mode seconds', icon: 'clock' as IconName,
                run: setTest(() => { mode.setTestType('time'); mode.setTestTime(s); }),
            })),
            ...[15, 30, 50, 100].map((n) => ({
                id: `words:${n}`, group: 'Test', label: `Words ${n}`, keywords: 'mode count', icon: 'text' as IconName,
                run: setTest(() => { mode.setTestType('words'); mode.setWordCount(n); }),
            })),
            ...(['short', 'medium', 'long'] as const).map((q) => ({
                id: `quote:${q}`, group: 'Test', label: `Quote ${q}`, keywords: 'mode', icon: 'quote' as IconName,
                run: setTest(() => { mode.setTestType('quote'); mode.setQuoteLength(q); }),
            })),
            { id: 'zen', group: 'Test', label: 'Zen mode', keywords: 'free type no words', icon: 'text', run: setTest(() => mode.setTestType('zen')) },
            { id: 'punct', group: 'Test', label: `${mode.punctuation ? 'Turn off' : 'Turn on'} punctuation`, icon: 'text', run: setTest(() => mode.setPunctuation((p) => !p)) },
            { id: 'nums', group: 'Test', label: `${mode.numbers ? 'Turn off' : 'Turn on'} numbers`, icon: 'text', run: setTest(() => mode.setNumbers((n) => !n)) },
            { id: 'practice', group: 'Test', label: 'Practise weak keys', keywords: 'mistakes train problem', icon: 'target', run: () => { practise(); } },
            { id: 'language', group: 'Test', label: 'Change language…', keywords: 'spanish french german words', hint: LANGUAGE_NAMES[settings.language], icon: 'globe', stay: true, run: () => { setView('language'); setQuery(''); setActive(0); } },

            { id: 'theme', group: 'Appearance', label: 'Change theme…', keywords: 'colors palette dark light', hint: chosen.label, icon: 'contrast', stay: true, run: () => { setView('theme'); setQuery(''); setActive(0); } },
            { id: 'themes-grid', group: 'Appearance', label: 'Browse themes', keywords: 'grid picker', icon: 'contrast', run: openThemePicker },
            { id: 'caret', group: 'Appearance', label: `Caret style: ${settings.caretStyle}`, keywords: 'cursor block underline line', icon: 'caret', run: () => update({ caretStyle: cycle(CARET_STYLES, settings.caretStyle) }), stay: true },
            { id: 'size', group: 'Appearance', label: `Font size: ${settings.fontSize.toUpperCase()}`, keywords: 'bigger smaller text', icon: 'text', run: () => update({ fontSize: cycle(FONT_SIZES, settings.fontSize) }), stay: true },
            { id: 'decrypt', group: 'Appearance', label: `${settings.decrypt ? 'Turn off' : 'Turn on'} decrypt animation`, keywords: 'motion scramble', icon: 'caret', run: () => update({ decrypt: !settings.decrypt }), stay: true },
            { id: 'live', group: 'Behaviour', label: `Live stats: ${settings.liveStats === 'both' ? 'wpm + acc' : settings.liveStats}`, keywords: 'speed show hide', icon: 'analytics', run: () => update({ liveStats: cycle(LIVE_STATS, settings.liveStats) }), stay: true },
            { id: 'sound', group: 'Behaviour', label: `Typing sound: ${settings.sound}`, keywords: 'audio click typewriter', icon: 'sound', run: () => update({ sound: cycle(SOUNDS, settings.sound) }), stay: true },
            { id: 'confidence', group: 'Behaviour', label: `${settings.confidence ? 'Turn off' : 'Turn on'} confidence mode`, keywords: 'no backspace', icon: 'target', run: () => update({ confidence: !settings.confidence }), stay: true },

            { id: 'go:home', group: 'Go to', label: 'Typing test', keywords: 'home', icon: 'keycap', run: go('/') },
            { id: 'go:race', group: 'Go to', label: 'Race a friend', keywords: 'versus 1v1 multiplayer', icon: 'race', run: go('/race') },
            { id: 'go:quick', group: 'Go to', label: 'Quick match', keywords: 'matchmaking random opponent race', icon: 'race', run: go('/race?quick=1') },
            { id: 'go:lb', group: 'Go to', label: 'Leaderboard', icon: 'leaderboard', run: go('/leaderboard') },
            { id: 'go:analytics', group: 'Go to', label: 'Analytics', keywords: 'stats heatmap history', icon: 'analytics', run: go('/user') },
            { id: 'go:groups', group: 'Go to', label: 'Groups', icon: 'users', run: go('/groups') },
            { id: 'go:settings', group: 'Go to', label: 'Settings', keywords: 'preferences account', icon: 'settings', run: go('/settings') },
            { id: 'friends', group: 'Go to', label: 'Friends and messages', keywords: 'chat dm social', icon: 'chat', run: () => social.open('friends') },
            { id: 'shortcuts', group: 'Help', label: 'Keyboard shortcuts', keywords: 'keys help', icon: 'keycap', hint: '?', run: openShortcuts },
        ];
        if (user) {
            list.push(
                { id: 'go:profile', group: 'Go to', label: 'My profile', icon: 'user', run: go(`/u/${user.username}`) },
                { id: 'logout', group: 'Account', label: 'Log out', icon: 'logout', run: logout }
            );
        } else {
            list.push({ id: 'login', group: 'Account', label: 'Log in or sign up', icon: 'user', run: () => openAuthModal('login') });
        }
        return list;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, chosen.label, settings, mode.punctuation, mode.numbers, user]);

    const results = useMemo(() => {
        const scored = commands
            .map((c) => {
                const onLabel = fuzzy(c.label, query);
                const onKeys = !onLabel && c.keywords ? fuzzy(c.keywords, query) : null;
                const m = onLabel ?? (onKeys ? { score: onKeys.score - 40, hits: [] } : null);
                return m ? { c, ...m } : null;
            })
            .filter((x): x is { c: Command; score: number; hits: number[] } => x !== null);
        return query ? scored.sort((a, b) => b.score - a.score) : scored;
    }, [commands, query]);

    // Keep the highlighted row valid, visible and (for themes) previewed.
    useEffect(() => {
        if (active >= results.length) setActive(Math.max(0, results.length - 1));
    }, [results.length, active]);
    const current = results[active]?.c;
    useEffect(() => {
        if (!open) return;
        if (current?.preview) current.preview();
        else if (view !== 'theme') previewTheme(null);
        listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current?.id, open]);

    const runAt = (i: number) => {
        const c = results[i]?.c;
        if (!c) return;
        c.run();
        if (!c.stay) done();
    };

    const back = () => {
        previewTheme(null);
        setView('root');
        setQuery('');
        setActive(0);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => (results.length ? (a + 1) % results.length : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            runAt(active);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            if (view !== 'root') back();
            else done();
        } else if (e.key === 'Backspace' && !query && view !== 'root') {
            e.preventDefault();
            back();
        }
    };

    let lastGroup = '';
    const placeholder = view === 'theme' ? 'Search themes' : view === 'language' ? 'Search languages' : 'Type a command or search';

    return (
        <Modal
            open={open}
            onClose={done}
            className="cp-root"
            // The search field focuses itself; the trap must not steal it back
            // (it would eat the first keys typed after Ctrl+K).
            disableAutoFocus
            slotProps={{ backdrop: { style: { background: 'rgba(0, 0, 0, 0.45)' } } }}
        >
            <div className="cp" role="dialog" aria-modal="true" aria-label="Command palette" onKeyDown={onKeyDown}>
                <div className="cp-search">
                    {view !== 'root' ? (
                        <button type="button" className="cp-crumb" onClick={back}>
                            {view === 'theme' ? 'Theme' : 'Language'}
                        </button>
                    ) : (
                        <Icon name="search" size={16} />
                    )}
                    <input
                        ref={inputRef}
                        autoFocus
                        value={query}
                        placeholder={placeholder}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActive(0);
                        }}
                        role="combobox"
                        aria-expanded="true"
                        aria-controls={listId}
                        aria-activedescendant={current ? `${listId}-${active}` : undefined}
                        aria-label={placeholder}
                        spellCheck={false}
                        autoComplete="off"
                    />
                    <kbd className="cp-esc">esc</kbd>
                </div>
                <ul className="cp-list" id={listId} role="listbox" ref={listRef} aria-label="Commands">
                    {results.length === 0 && <li className="cp-empty">Nothing matches “{query}”.</li>}
                    {results.map(({ c, hits }, i) => {
                        const header = !query && c.group !== lastGroup ? c.group : null;
                        lastGroup = c.group;
                        return (
                            <React.Fragment key={c.id}>
                                {header && <li className="cp-group" role="presentation">{header}</li>}
                                <li
                                    id={`${listId}-${i}`}
                                    data-index={i}
                                    role="option"
                                    aria-selected={i === active}
                                    className={cx('cp-item', i === active && 'is-active')}
                                    onMouseMove={() => i !== active && setActive(i)}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => runAt(i)}
                                >
                                    {c.swatch ? (
                                        <span className="cp-swatch" aria-hidden="true" style={{ background: c.swatch[0] }}>
                                            <span style={{ background: c.swatch[1] }} />
                                            <span style={{ background: c.swatch[2] }} />
                                        </span>
                                    ) : (
                                        <span className="cp-icon" aria-hidden="true">{c.icon && <Icon name={c.icon} size={16} />}</span>
                                    )}
                                    <span className="cp-label"><Label text={c.label} hits={hits} /></span>
                                    {c.hint && <span className="cp-hint">{c.hint}</span>}
                                    {c.stay && !c.hint && <Icon name="arrow-right" size={14} />}
                                </li>
                            </React.Fragment>
                        );
                    })}
                </ul>
                <div className="cp-foot" aria-hidden="true">
                    <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
                    <span><kbd>enter</kbd> run</span>
                    <span><kbd>esc</kbd> {view === 'root' ? 'close' : 'back'}</span>
                </div>
            </div>
        </Modal>
    );
}

export default CommandPalette;

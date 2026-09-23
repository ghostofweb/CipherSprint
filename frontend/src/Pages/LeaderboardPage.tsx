import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LANGUAGES } from '@ciphersprint/shared';
import type { Language, LeaderboardRow, MyLeaderboardEntry } from '@ciphersprint/shared';
import { LANGUAGE_NAMES } from '../Utils/words';
import Avatar from '../Components/Avatar';
import Button from '../Components/ui/Button';
import EmptyState from '../Components/ui/EmptyState';
import Segmented from '../Components/ui/Segmented';
import { SkeletonRows } from '../Components/ui/Skeleton';
import { NoTestsArt } from '../Components/assets/illustrations';
import { api } from '../Utils/api';
import { modeLabel } from '../Utils/format';
import { cx } from '../Utils/cx';
import { useAuth } from '../Context/AuthContext';

type ModeValue = 'time' | 'words' | 'quote';

interface ModeTab {
    value: ModeValue;
    label: string;
    details: (number | string)[];
    suffix: string;
}

// Only fixed-target modes are ranked -- zen has no target to compare speeds
// against, and custom text varies per user, so neither is meaningfully
// comparable across accounts (matches MonkeyType's own leaderboard scope).
const MODE_TABS: ModeTab[] = [
    { value: 'time', label: 'time', details: [15, 30, 60, 120], suffix: 's' },
    { value: 'words', label: 'words', details: [15, 30, 50, 100], suffix: '' },
    { value: 'quote', label: 'quote', details: ['short', 'medium', 'long'], suffix: '' },
];

const LIMIT = 50;

interface RowProps {
    rank: number;
    row: LeaderboardRow;
    isSelf: boolean;
    pinned?: boolean;
}

function Row({ rank, row, isSelf, pinned }: RowProps) {
    return (
        <tr className={cx('lb-row', isSelf && 'is-self', pinned && 'is-pinned')}>
            <td className={cx('lb-rank tnum', rank <= 3 && !pinned && 'is-top')}>{rank}</td>
            <td>
                <Link className="lb-player" to={`/u/${row.username}`}>
                    <Avatar url={row.avatarUrl} name={row.username} size="sm" />
                    <span className="lb-player__name">{row.username}</span>
                    {isSelf && <span className="lb-player__you">you</span>}
                </Link>
            </td>
            <td className="lb-num tnum lb-wpm">{row.wpm}</td>
            <td className="lb-num tnum lb-secondary">{row.accuracy}%</td>
            <td className="lb-num tnum lb-secondary">{row.consistency}%</td>
        </tr>
    );
}

function LeaderboardPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [mode, setMode] = useState<ModeValue>('time');
    const [modeDetail, setModeDetail] = useState<number | string>(15);
    const [rows, setRows] = useState<LeaderboardRow[]>([]);
    const [mine, setMine] = useState<MyLeaderboardEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const [scope, setScope] = useState<'all' | 'friends'>('all');
    const [language, setLanguage] = useState<Language>('english');

    const activeTab = MODE_TABS.find((t) => t.value === mode) as ModeTab;
    const lang = mode === 'quote' ? 'english' : language;

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        Promise.all([
            api.leaderboard(mode, modeDetail, LIMIT, { language: lang, scope }),
            user ? api.myLeaderboardEntry(mode, modeDetail, lang).catch(() => ({ entry: null })) : Promise.resolve({ entry: null }),
        ])
            .then(([board, me]) => {
                if (cancelled) return;
                setRows(board.leaderboard);
                setMine(me.entry);
            })
            .catch((err: Error) => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [mode, modeDetail, user, attempt, scope, lang]);

    // "You" is pinned under the list only when you are ranked but not in it
    // (the friends board always contains you if you have a result).
    const pinned = useMemo(
        () => (scope === 'all' && mine && !rows.some((r) => r.username === mine.username) ? mine : null),
        [mine, rows, scope]
    );

    const changeMode = (value: ModeValue) => {
        const tab = MODE_TABS.find((t) => t.value === value) as ModeTab;
        setMode(value);
        setModeDetail(tab.details[0]);
    };

    return (
        <>
            <h1 className="page-title">Leaderboard</h1>

            <div className="lb-filters">
                <Segmented<ModeValue>
                    label="Mode"
                    value={mode}
                    onChange={changeMode}
                    options={MODE_TABS.map((t) => ({ value: t.value, label: t.label }))}
                />
                <Segmented<number | string>
                    label={`${activeTab.label} length`}
                    value={modeDetail}
                    onChange={setModeDetail}
                    options={activeTab.details.map((d) => ({ value: d, label: `${d}${activeTab.suffix}` }))}
                />
                {user && (
                    <Segmented<'all' | 'friends'>
                        label="Who"
                        value={scope}
                        onChange={setScope}
                        options={[{ value: 'all', label: 'everyone' }, { value: 'friends', label: 'friends' }]}
                    />
                )}
                {mode !== 'quote' && (
                    <select className="rs-select lb-lang" aria-label="Language" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
                        {LANGUAGES.map((l) => (
                            <option key={l} value={l}>{LANGUAGE_NAMES[l]}</option>
                        ))}
                    </select>
                )}
            </div>

            <div className="lb-wrap" aria-busy={loading}>
                {loading && rows.length === 0 ? (
                    <SkeletonRows count={6} />
                ) : error ? (
                    <EmptyState title="Couldn't load the leaderboard" action={<Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>}>
                        {error}
                    </EmptyState>
                ) : rows.length === 0 ? (
                    <EmptyState
                        art={<NoTestsArt />}
                        title="No results yet"
                        action={<Button variant="primary" onClick={() => navigate('/')}>Take a test</Button>}
                    >
                        Finish a {modeLabel(mode, modeDetail)} test to take the first spot.
                    </EmptyState>
                ) : (
                    <table className={cx('lb-table', loading && 'is-stale')}>
                        <thead>
                            <tr>
                                <th scope="col" className="lb-rank">#</th>
                                <th scope="col">player</th>
                                <th scope="col" className="lb-num">wpm</th>
                                <th scope="col" className="lb-num lb-secondary">acc</th>
                                <th scope="col" className="lb-num lb-secondary">consistency</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <Row key={row.username} rank={i + 1} row={row} isSelf={user?.username === row.username} />
                            ))}
                            {pinned && (
                                <>
                                    <tr className="lb-gap" aria-hidden="true"><td colSpan={5}>&hellip;</td></tr>
                                    <Row rank={pinned.rank} row={pinned} isSelf pinned />
                                </>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}

export default LeaderboardPage;

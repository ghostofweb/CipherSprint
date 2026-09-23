import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { PersonalBest } from '@ciphersprint/shared';
import HistoryGraph from '../Components/HistoryGraph';
import KeyboardHeatmap from '../Components/KeyboardHeatmap';
import DecryptText from '../Components/DecryptText';
import Button from '../Components/ui/Button';
import Icon from '../Components/ui/Icon';
import EmptyState from '../Components/ui/EmptyState';
import { Skeleton } from '../Components/ui/Skeleton';
import { NoTestsArt } from '../Components/assets/illustrations';
import ActivityCalendar from '../Components/ActivityCalendar';
import { getAggregates, Aggregates, HistoryEntry } from '../Utils/resultsHistory';
import { useAuth } from '../Context/AuthContext';
import { usePractice } from '../Hooks/usePractice';
import { topMistakeKeys } from '../Utils/practice';
import { api } from '../Utils/api';
import { modeLabel, formatDuration } from '../Utils/format';

type RecentEntry = HistoryEntry & { _id?: string; hasReplay?: boolean };
type RemoteStats = Aggregates & { personalBests: PersonalBest[]; recent: RecentEntry[] };

function AnalyticsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const practise = usePractice();
    const [remoteStats, setRemoteStats] = useState<RemoteStats | null>(null);
    const [loadingRemote, setLoadingRemote] = useState(!!user);

    // Signed in: the account's history. Otherwise this browser's.
    useEffect(() => {
        if (!user) {
            setRemoteStats(null);
            setLoadingRemote(false);
            return;
        }
        setLoadingRemote(true);
        Promise.all([api.me(), api.myResults(50)])
            .then(([meRes, resultsRes]) => {
                setRemoteStats({ ...meRes.aggregates, personalBests: meRes.personalBests, recent: resultsRes.results } as RemoteStats);
            })
            .catch(() => setRemoteStats(null))
            .finally(() => setLoadingRemote(false));
    }, [user]);

    if (user && loadingRemote) {
        return (
            <>
                <h1 className="page-title">Analytics</h1>
                <div className="an-tiles">
                    {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={64} />)}
                </div>
                <Skeleton height={260} />
            </>
        );
    }

    const stats: RemoteStats | Aggregates = user ? (remoteStats || getAggregates()) : getAggregates();
    const recent = stats.recent as RecentEntry[];

    const personalBests = (Array.isArray(stats.personalBests) ? stats.personalBests : Object.values(stats.personalBests))
        .slice()
        .sort((a, b) => b.wpm - a.wpm);
    const weakKeys = topMistakeKeys(stats.charMistakes);

    if (stats.completedTests === 0) {
        return (
            <>
                <h1 className="page-title">Analytics</h1>
                <EmptyState
                    art={<NoTestsArt />}
                    title="No tests yet"
                    action={<Button variant="primary" onClick={() => navigate('/')}>Take a test</Button>}
                >
                    Finish one and your speed, accuracy and weak keys will show up here.
                </EmptyState>
            </>
        );
    }

    return (
        <div className="an">
            <header className="an-head">
                <h1 className="page-title">Analytics</h1>
                <p className="an-sub">{user ? 'Every test on your account.' : 'Tests in this browser. Log in to keep them everywhere.'}</p>
            </header>

            <div className="an-tiles">
                <div className="an-tile an-tile--hero">
                    <div className="stat-label">best wpm</div>
                    <DecryptText className="an-hero tnum" text={String(stats.bestWpm)} />
                </div>
                <div className="an-tile">
                    <div className="stat-label">avg wpm, last 10</div>
                    <div className="an-value tnum">{stats.avgWpmLast10}</div>
                </div>
                <div className="an-tile">
                    <div className="stat-label">avg accuracy, last 10</div>
                    <div className="an-value tnum">{stats.avgAccuracyLast10}%</div>
                </div>
                <div className="an-tile">
                    <div className="stat-label">tests</div>
                    <div className="an-value tnum">{stats.completedTests}</div>
                </div>
                <div className="an-tile">
                    <div className="stat-label">time typing</div>
                    <div className="an-value tnum">{formatDuration(stats.totalTimeTypingSeconds)}</div>
                </div>
                <div className="an-tile">
                    <div className="stat-label">streak</div>
                    <div className="an-value tnum">{stats.streak.current}d</div>
                    <div className="stat-sub">best {stats.streak.max}d</div>
                </div>
            </div>

            <section className="an-section" aria-labelledby="an-trend">
                <h2 className="pf-h" id="an-trend">Speed over time</h2>
                <div className="an-graph">
                    <HistoryGraph entries={recent.slice().reverse()} />
                </div>
            </section>

            <div className="an-cols">
                <section className="an-section" aria-labelledby="an-keys">
                    <h2 className="pf-h" id="an-keys">Weak keys</h2>
                    {weakKeys.length === 0 ? (
                        <p className="pf-empty">No mistakes recorded yet.</p>
                    ) : (
                        <>
                            <KeyboardHeatmap mistakes={stats.charMistakes} />
                            <div className="an-practice">
                                <p>
                                    You miss <strong>{weakKeys.join(' ')}</strong> most. A practice test packs real words with those letters.
                                </p>
                                <Button variant="primary" icon="target" onClick={() => practise()}>Practise weak keys</Button>
                            </div>
                        </>
                    )}
                </section>

                <section className="an-section" aria-labelledby="an-pbs">
                    <h2 className="pf-h" id="an-pbs">Personal bests</h2>
                    <table className="pf-table">
                        <thead>
                            <tr><th scope="col">test</th><th scope="col" className="num">wpm</th><th scope="col" className="num">acc</th><th scope="col" className="num">consistency</th></tr>
                        </thead>
                        <tbody>
                            {personalBests.map((pb) => (
                                <tr key={`${pb.mode}:${pb.modeDetail}`}>
                                    <td>{modeLabel(pb.mode, pb.modeDetail)}</td>
                                    <td className="num pf-table__wpm tnum">{pb.wpm}</td>
                                    <td className="num tnum">{pb.accuracy}%</td>
                                    <td className="num tnum">{pb.consistency}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </div>

            <section className="an-section" aria-labelledby="an-activity">
                <h2 className="pf-h" id="an-activity">Activity</h2>
                <ActivityCalendar testActivity={stats.testActivity} />
            </section>

            <section className="an-section" aria-labelledby="an-recent">
                <h2 className="pf-h" id="an-recent">Recent tests</h2>
                <table className="pf-table an-recent">
                    <thead>
                        <tr>
                            <th scope="col">when</th>
                            <th scope="col">test</th>
                            <th scope="col" className="num">wpm</th>
                            <th scope="col" className="num">acc</th>
                            <th scope="col" className="num">consistency</th>
                            <th scope="col"><span className="visually-hidden">Replay</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {recent.slice(0, 20).map((r, i) => (
                            <tr key={r._id ?? i}>
                                <td className="tnum">{new Date(r.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                <td>{modeLabel(r.mode, r.modeDetail)}</td>
                                <td className="num pf-table__wpm tnum">{r.wpm}</td>
                                <td className="num tnum">{r.accuracy}%</td>
                                <td className="num tnum">{r.consistency}%</td>
                                <td className="num">
                                    {r._id && r.hasReplay && (
                                        <Link to={`/replay/${r._id}`} className="an-replay" aria-label={`Watch the replay of this ${modeLabel(r.mode, r.modeDetail)} test`}>
                                            <Icon name="replay" size={16} />
                                        </Link>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
}

export default AnalyticsPage;

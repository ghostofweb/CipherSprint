import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PersonalBest } from '@ciphersprint/shared';
import HistoryGraph from '../Components/HistoryGraph';
import Button from '../Components/ui/Button';
import EmptyState from '../Components/ui/EmptyState';
import { Skeleton } from '../Components/ui/Skeleton';
import { NoTestsArt } from '../Components/assets/illustrations';
import ActivityCalendar from '../Components/ActivityCalendar';
import { getAggregates, Aggregates, HistoryEntry } from '../Utils/resultsHistory';
import { useAuth } from '../Context/AuthContext';
import { api } from '../Utils/api';
import { modeLabel, formatDuration } from '../Utils/format';

const charLabel = (char: string) => (char === ' ' ? 'space' : char);

type RemoteStats = Aggregates & { personalBests: PersonalBest[]; recent: HistoryEntry[] };

function AnalyticsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [remoteStats, setRemoteStats] = useState<RemoteStats | null>(null);
    const [loadingRemote, setLoadingRemote] = useState(!!user);

    // Logged in: source from the synced backend history. Logged out:
    // fall back to the localStorage aggregates, which always works and is
    // recomputed on every mount (cheap -- localStorage read + linear scan).
    useEffect(() => {
        if (!user) {
            setRemoteStats(null);
            setLoadingRemote(false);
            return;
        }
        setLoadingRemote(true);
        Promise.all([api.me(), api.myResults(20)])
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
                <div className="analytics-tiles">
                    {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={48} />)}
                </div>
                <Skeleton height={260} />
            </>
        );
    }

    const stats: RemoteStats | Aggregates = user ? (remoteStats || getAggregates()) : getAggregates();

    const personalBests = (Array.isArray(stats.personalBests) ? stats.personalBests : Object.values(stats.personalBests))
        .slice()
        .sort((a, b) => b.wpm - a.wpm);
    const topMistakes = Object.entries(stats.charMistakes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    const maxMistakeCount = topMistakes.length ? topMistakes[0][1] : 1;

    if (stats.completedTests === 0) {
        return (
            <>
                <h1 className="page-title">Analytics</h1>
                <EmptyState
                    art={<NoTestsArt />}
                    title="No tests yet"
                    action={<Button variant="primary" onClick={() => navigate('/')}>Take a test</Button>}
                >
                    Finish one and your speed, accuracy and problem keys will show up here.
                </EmptyState>
            </>
        );
    }

    return (
        <>
            <h1 className="page-title">Analytics</h1>

            <div className="analytics-tiles">
                <div className="stat-block small">
                    <div className="stat-label">tests completed</div>
                    <div className="stat-value">{stats.completedTests}</div>
                </div>
                <div className="stat-block small">
                    <div className="stat-label">time typing</div>
                    <div className="stat-value">{formatDuration(stats.totalTimeTypingSeconds)}</div>
                </div>
                <div className="stat-block small">
                    <div className="stat-label">best wpm</div>
                    <div className="stat-value">{stats.bestWpm}</div>
                </div>
                <div className="stat-block small">
                    <div className="stat-label">avg wpm (last 10)</div>
                    <div className="stat-value">{stats.avgWpmLast10}</div>
                </div>
                <div className="stat-block small">
                    <div className="stat-label">avg accuracy (last 10)</div>
                    <div className="stat-value">{stats.avgAccuracyLast10}%</div>
                </div>
                <div className="stat-block small">
                    <div className="stat-label">streak</div>
                    <div className="stat-value">{stats.streak.current}d</div>
                    <div className="stat-sub">best {stats.streak.max}d</div>
                </div>
            </div>

            <div className="analytics-section">
                <div className="analytics-section-title">wpm over time</div>
                <div className="analytics-graph">
                    <HistoryGraph entries={stats.recent.slice().reverse()} />
                </div>
            </div>

            <div className="analytics-section">
                <div className="analytics-section-title">activity</div>
                <ActivityCalendar testActivity={stats.testActivity} />
            </div>

            <div className="analytics-columns">
                <div className="analytics-section">
                    <div className="analytics-section-title">personal bests</div>
                    <table className="analytics-table">
                        <thead>
                            <tr><th>mode</th><th>wpm</th><th>acc</th><th>consistency</th></tr>
                        </thead>
                        <tbody>
                            {personalBests.map((pb) => (
                                <tr key={`${pb.mode}:${pb.modeDetail}`}>
                                    <td>{modeLabel(pb.mode, pb.modeDetail)}</td>
                                    <td>{pb.wpm}</td>
                                    <td>{pb.accuracy}%</td>
                                    <td>{pb.consistency}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="analytics-section">
                    <div className="analytics-section-title">problem keys</div>
                    {topMistakes.length === 0 ? (
                        <div className="analytics-empty small">No mistakes recorded yet.</div>
                    ) : (
                        <div className="problem-keys">
                            {topMistakes.map(([char, count]) => (
                                <div className="problem-key-row" key={char}>
                                    <div className="problem-key-label">{charLabel(char)}</div>
                                    <div className="problem-key-bar-track">
                                        <div
                                            className="problem-key-bar"
                                            style={{ width: `${(count / maxMistakeCount) * 100}%` }}
                                        />
                                    </div>
                                    <div className="problem-key-count">{count}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="analytics-section">
                <div className="analytics-section-title">recent tests</div>
                <table className="analytics-table">
                    <thead>
                        <tr><th>date</th><th>mode</th><th>wpm</th><th>acc</th><th>consistency</th></tr>
                    </thead>
                    <tbody>
                        {stats.recent.map((r, i) => (
                            <tr key={i}>
                                <td>{new Date(r.timestamp).toLocaleString()}</td>
                                <td>{modeLabel(r.mode, r.modeDetail)}</td>
                                <td>{r.wpm}</td>
                                <td>{r.accuracy}%</td>
                                <td>{r.consistency}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default AnalyticsPage;

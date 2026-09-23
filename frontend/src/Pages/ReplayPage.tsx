import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReplayPlayer from '../Components/ReplayPlayer';
import EmptyState from '../Components/ui/EmptyState';
import Spinner from '../Components/ui/Spinner';
import { api } from '../Utils/api';
import { getLastReplay, StoredReplay } from '../Utils/resultsHistory';
import { modeLabel } from '../Utils/format';

// /replay/last plays this browser's most recent test; /replay/<id> one of
// your saved results.
function ReplayPage() {
    const { id = 'last' } = useParams();
    const [data, setData] = useState<StoredReplay | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setData(null);
        setError(null);
        if (id === 'last') {
            const local = getLastReplay();
            if (local) setData(local);
            else setError('Finish a test and its replay appears here.');
            return;
        }
        api.resultReplay(id)
            .then(({ result }) => setData({ ...result, modeDetail: result.modeDetail }))
            .catch((err: Error) => setError(err.message));
    }, [id]);

    if (error) {
        return (
            <EmptyState title="No replay to show" action={<Link to="/" className="ui-btn ui-btn--primary">Take a test</Link>}>
                {error}
            </EmptyState>
        );
    }
    if (!data) return <div className="route-loading"><Spinner size={20} /></div>;

    return (
        <div className="rpp">
            <header className="rpp-head">
                <h1 className="page-title">Replay</h1>
                <p className="rpp-meta tnum">
                    {modeLabel(data.mode, data.modeDetail)} · {data.wpm} wpm · {data.accuracy}% · {new Date(data.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
            </header>
            <ReplayPlayer words={data.words} events={data.replay} zen={data.mode === 'zen'} autoPlay />
            <p className="rpp-hint"><kbd>space</kbd> play or pause · <kbd>←</kbd><kbd>→</kbd> skip 2 seconds</p>
        </div>
    );
}

export default ReplayPage;

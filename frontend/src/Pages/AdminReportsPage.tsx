import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ReportRow } from '@ciphersprint/shared';
import Segmented from '../Components/ui/Segmented';
import Button from '../Components/ui/Button';
import EmptyState from '../Components/ui/EmptyState';
import { SkeletonRows } from '../Components/ui/Skeleton';
import { useAuth } from '../Context/AuthContext';
import { api } from '../Utils/api';
import { formatRelativeTime } from '../Utils/format';

const REASON_LABEL: Record<string, string> = {
    spam: 'Spam',
    harassment: 'Harassment',
    cheating: 'Cheating',
    'inappropriate-name': 'Inappropriate name',
    other: 'Other',
};

// The moderation queue: what was reported, by whom, with the reported text.
function AdminReportsPage() {
    const { user } = useAuth();
    const [status, setStatus] = useState<'open' | 'resolved'>('open');
    const [reports, setReports] = useState<ReportRow[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(() => {
        setReports(null);
        api.adminReports(status)
            .then((r) => setReports(r.reports))
            .catch((err: Error) => setError(err.message));
    }, [status]);
    useEffect(() => {
        if (user?.isAdmin) load();
    }, [user, load]);

    if (!user?.isAdmin) {
        return <EmptyState title="Admins only">This page reviews reports. Ask the server owner to add you to ADMIN_USERNAMES.</EmptyState>;
    }

    const toggle = async (r: ReportRow) => {
        await api.setReportStatus(r.id, r.status === 'open' ? 'resolved' : 'open');
        setReports((list) => (list ?? []).filter((x) => x.id !== r.id));
    };

    return (
        <div className="ar">
            <header className="ar-head">
                <h1 className="page-title">Reports</h1>
                <Segmented label="Status" value={status} onChange={setStatus} options={[{ value: 'open', label: 'open' }, { value: 'resolved', label: 'resolved' }]} />
            </header>
            {error && <div className="ui-hint ui-hint--error" role="alert">{error}</div>}
            {reports === null ? (
                <SkeletonRows count={4} />
            ) : reports.length === 0 ? (
                <EmptyState title={status === 'open' ? 'Nothing to review' : 'Nothing resolved yet'}>
                    {status === 'open' ? 'New reports show up here.' : 'Reports you resolve move here.'}
                </EmptyState>
            ) : (
                <ul className="ar-list">
                    {reports.map((r) => (
                        <li key={r.id} className="ar-item">
                            <div className="ar-item__head">
                                <span className="ar-reason">{REASON_LABEL[r.reason] ?? r.reason}</span>
                                <span>
                                    <Link to={`/u/${r.target}`}>{r.target}</Link>, reported by <Link to={`/u/${r.reporter}`}>{r.reporter}</Link>
                                </span>
                                <time className="ar-when" dateTime={r.createdAt}>{formatRelativeTime(r.createdAt)}</time>
                            </div>
                            {r.context.excerpt && <blockquote className="ar-quote">{r.context.excerpt}</blockquote>}
                            {r.note && <p className="ar-note">“{r.note}”</p>}
                            <div className="ar-meta">
                                <span>from a {r.context.kind}</span>
                                <Button size="sm" variant="ghost" onClick={() => toggle(r)}>
                                    {r.status === 'open' ? 'Mark resolved' : 'Reopen'}
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default AdminReportsPage;

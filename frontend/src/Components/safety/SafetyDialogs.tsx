import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { REPORT_REASONS } from '@ciphersprint/shared';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';
import { api } from '../../Utils/api';
import { cx } from '../../Utils/cx';

const REASON_COPY: Record<(typeof REPORT_REASONS)[number], { label: string; hint: string }> = {
    spam: { label: 'Spam', hint: 'Ads, links or the same message over and over.' },
    harassment: { label: 'Harassment', hint: 'Insults, threats or targeting someone.' },
    cheating: { label: 'Cheating', hint: 'Scores or race results that are not real typing.' },
    'inappropriate-name': { label: 'Inappropriate name or photo', hint: 'Offensive username or avatar.' },
    other: { label: 'Something else', hint: 'Tell us in the note.' },
};

export interface ReportTarget {
    username: string;
    kind: 'profile' | 'message' | 'race';
    ref?: string | null;
    excerpt?: string | null;
}

export function ReportDialog({ target, onClose }: { target: ReportTarget | null; onClose: () => void }) {
    const [reason, setReason] = useState<(typeof REPORT_REASONS)[number] | null>(null);
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (target) {
            setReason(null);
            setNote('');
            setError(null);
        }
    }, [target]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!target || !reason) return;
        setBusy(true);
        setError(null);
        try {
            await api.report({ username: target.username, reason, note, context: { kind: target.kind, ref: target.ref ?? null, excerpt: target.excerpt ?? null } });
            toast.success(`Thanks. Your report about ${target.username} was sent.`);
            onClose();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={!!target} onClose={onClose} title={target ? `Report ${target.username}` : 'Report'} width={440} dismissible={!busy}>
            <form className="sf" onSubmit={submit}>
                {target?.excerpt && <blockquote className="sf-quote">{target.excerpt}</blockquote>}
                <fieldset className="sf-reasons">
                    <legend className="sf-legend">What's wrong?</legend>
                    {REPORT_REASONS.map((r) => (
                        <label key={r} className={cx('sf-reason', reason === r && 'is-active')}>
                            <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
                            <span>
                                <span className="sf-reason__label">{REASON_COPY[r].label}</span>
                                <span className="sf-reason__hint">{REASON_COPY[r].hint}</span>
                            </span>
                        </label>
                    ))}
                </fieldset>
                <textarea className="ui-textarea sf-note" rows={3} maxLength={500} placeholder="Anything we should know (optional)" aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
                {error && <div className="ui-hint ui-hint--error" role="alert">{error}</div>}
                <div className="ui-dialog__actions">
                    <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
                    <Button type="submit" variant="primary" icon="flag" loading={busy} disabled={!reason}>Send report</Button>
                </div>
            </form>
        </Dialog>
    );
}

export function BlockDialog({ username, onClose, onBlocked }: { username: string | null; onClose: () => void; onBlocked?: () => void }) {
    const [busy, setBusy] = useState(false);
    const block = async () => {
        if (!username) return;
        setBusy(true);
        try {
            await api.block(username);
            toast.success(`Blocked ${username}. Undo it in Settings → Privacy.`);
            onBlocked?.();
            onClose();
        } catch (err) {
            toast.error((err as Error).message);
        } finally {
            setBusy(false);
        }
    };
    return (
        <Dialog open={!!username} onClose={onClose} title={username ? `Block ${username}?` : 'Block'} width={420} dismissible={!busy}>
            <ul className="sf-effects">
                <li>You won't find each other in search.</li>
                <li>They can't message you, add you or invite you to a race.</li>
                <li>You stop being friends. They are not told.</li>
            </ul>
            <div className="ui-dialog__actions">
                <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
                <Button variant="danger" icon="block" onClick={block} loading={busy}>Block</Button>
            </div>
        </Dialog>
    );
}

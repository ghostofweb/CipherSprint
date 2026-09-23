import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../Components/ui/Input';
import Button from '../Components/ui/Button';
import Icon from '../Components/ui/Icon';
import { api } from '../Utils/api';

function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState<{ devMode: boolean } | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setBusy(true);
        try {
            const res = await api.forgotPassword(email.trim());
            setSent({ devMode: res.devMode });
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="auth-page">
            <Icon name="lock" size={28} className="auth-page__icon" />
            <h1 className="page-title">Forgot your password?</h1>
            {sent ? (
                <div className="auth-page__done" role="status">
                    <p>
                        If <strong>{email}</strong> has an account, a link to choose a new password is on its way. It works once and
                        expires in 30 minutes.
                    </p>
                    {sent.devMode && (
                        <p className="auth-page__dev">
                            No email service is set up on this server yet, so the link was printed to the server console instead.
                        </p>
                    )}
                    <p className="auth-page__meta">
                        Nothing arrived? Check spam, or <button type="button" className="link-btn" onClick={() => setSent(null)}>try again</button>.
                    </p>
                </div>
            ) : (
                <form className="auth-page__form" onSubmit={submit} noValidate>
                    <p className="auth-page__lede">Enter the email you signed up with and we'll send you a reset link.</p>
                    <Input label="Email" type="email" icon="mail" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} autoFocus />
                    <Button type="submit" variant="primary" className="ui-btn--block" loading={busy} disabled={!email.includes('@')}>
                        Send reset link
                    </Button>
                </form>
            )}
            <Link to="/" className="auth-page__back">Back to the typing test</Link>
        </div>
    );
}

export default ForgotPasswordPage;

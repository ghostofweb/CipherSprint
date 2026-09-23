import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { passwordSchema } from '@ciphersprint/shared';
import Button from '../Components/ui/Button';
import Icon from '../Components/ui/Icon';
import PasswordField from '../Components/PasswordField';
import { useAuth } from '../Context/AuthContext';

function ResetPasswordPage() {
    const [params] = useSearchParams();
    const token = params.get('token') ?? '';
    const navigate = useNavigate();
    const { resetPassword } = useAuth();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const valid = passwordSchema.safeParse(password).success && password === confirm;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setBusy(true);
        try {
            await resetPassword(token, password);
            toast.success('Password changed. You are signed in, and every other device is signed out.');
            navigate('/');
        } catch (err) {
            setError((err as Error).message);
            setBusy(false);
        }
    };

    if (!token) {
        return (
            <div className="auth-page">
                <Icon name="lock" size={28} className="auth-page__icon" />
                <h1 className="page-title">This link is incomplete</h1>
                <p className="auth-page__lede">Open the link from your email again, or ask for a new one.</p>
                <Link to="/forgot" className="auth-page__back">Get a new reset link</Link>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <Icon name="lock" size={28} className="auth-page__icon" />
            <h1 className="page-title">Choose a new password</h1>
            <form className="auth-page__form" onSubmit={submit} noValidate>
                <PasswordField label="New password" placeholder="New password" value={password} onChange={setPassword} showRules autoComplete="new-password" />
                <PasswordField label="Confirm new password" placeholder="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
                {confirm && password !== confirm && <div className="ui-hint ui-hint--error">The passwords don't match.</div>}
                {error && (
                    <div className="ui-hint ui-hint--error" role="alert">
                        {error} <Link to="/forgot">Get a new link</Link>
                    </div>
                )}
                <Button type="submit" variant="primary" className="ui-btn--block" loading={busy} disabled={!valid}>
                    Save password and sign in
                </Button>
            </form>
        </div>
    );
}

export default ResetPasswordPage;

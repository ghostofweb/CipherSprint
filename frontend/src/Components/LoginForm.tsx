import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from './ui/Input';
import Button from './ui/Button';
import PasswordField from './PasswordField';
import { useAuth } from '../Context/AuthContext';

interface LoginFormProps {
    onSuccess: () => void;
}

function LoginForm({ onSuccess }: LoginFormProps) {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Enter your email and password.');
            return;
        }
        setSubmitting(true);
        try {
            await login(email, password);
            onSuccess();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <Input
                label="Email"
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
            />
            <PasswordField value={password} onChange={setPassword} />
            {error && <div className="auth-error" role="alert">{error}</div>}
            <Button type="submit" variant="primary" className="ui-btn--block" loading={submitting}>Log in</Button>
            <button
                type="button"
                className="link-btn auth-forgot"
                onClick={() => {
                    onSuccess();
                    navigate('/forgot');
                }}
            >
                Forgot password?
            </button>
        </form>
    );
}

export default LoginForm;

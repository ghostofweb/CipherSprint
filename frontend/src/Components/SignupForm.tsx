import React, { useState } from 'react';
import { passwordSchema } from '@ciphersprint/shared';
import Input from './ui/Input';
import Button from './ui/Button';
import { useAuth } from '../Context/AuthContext';
import UsernameField from './UsernameField';
import PasswordField from './PasswordField';

interface SignupFormProps {
    onSuccess: () => void;
}

function SignupForm({ onSuccess }: SignupFormProps) {
    const { signup } = useAuth();
    const [username, setUsername] = useState('');
    const [usernameAvailable, setUsernameAvailable] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const passwordValid = passwordSchema.safeParse(password).success;
    const mismatch = !!confirmPassword && password !== confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!username || !email || !password || !confirmPassword) {
            setError('Fill in every field.');
            return;
        }
        if (!passwordValid) {
            setError("The password doesn't meet the requirements yet.");
            return;
        }
        if (password !== confirmPassword) {
            setError("The passwords don't match.");
            return;
        }
        setSubmitting(true);
        try {
            await signup(username, email, password);
            onSuccess();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <UsernameField value={username} onChange={setUsername} onAvailabilityChange={setUsernameAvailable} autoFocus />
            <Input label="Email" type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <PasswordField value={password} onChange={setPassword} showRules autoComplete="new-password" />
            <Input
                label="Confirm password"
                type="password"
                placeholder="Confirm password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={mismatch ? "The passwords don't match." : null}
            />
            {error && <div className="auth-error" role="alert">{error}</div>}
            <Button
                type="submit"
                variant="primary"
                className="ui-btn--block"
                loading={submitting}
                disabled={(!!username && !usernameAvailable) || (!!password && !passwordValid)}
            >
                Create account
            </Button>
        </form>
    );
}

export default SignupForm;

import React, { useEffect, useState } from 'react';
import Input from './ui/Input';
import Spinner from './ui/Spinner';
import { api } from '../Utils/api';
import { useDebouncedValue } from '../Hooks/useDebouncedValue';

type Status = null | 'checking' | 'available' | 'taken' | 'invalid';

interface UsernameFieldProps {
    value: string;
    onChange: (value: string) => void;
    onAvailabilityChange?: (available: boolean) => void;
    autoFocus?: boolean;
    placeholder?: string;
}

// A username input with a live (debounced) availability check -- shared by
// the signup form and the Google-onboarding "choose a username" step.
function UsernameField({ value, onChange, onAvailabilityChange, autoFocus, placeholder = 'Username' }: UsernameFieldProps) {
    const [status, setStatus] = useState<Status>(null);
    const debounced = useDebouncedValue(value, 400);

    useEffect(() => {
        const trimmed = debounced.trim();
        if (!trimmed) {
            setStatus(null);
            onAvailabilityChange?.(false);
            return undefined;
        }
        let cancelled = false;
        setStatus('checking');
        api.checkUsername(trimmed)
            .then((res) => {
                if (cancelled) return;
                if (!res.available && res.reason) setStatus('invalid');
                else setStatus(res.available ? 'available' : 'taken');
                onAvailabilityChange?.(res.available);
            })
            .catch(() => { if (!cancelled) setStatus(null); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debounced]);

    // Typing again invalidates the last verdict until the next check lands.
    const stale = value.trim() !== debounced.trim();
    const shown = stale && value.trim() ? 'checking' : status;

    return (
        <Input
            label="Username"
            placeholder={placeholder}
            value={value}
            autoFocus={autoFocus}
            autoComplete="username"
            spellCheck={false}
            maxLength={20}
            onChange={(e) => onChange(e.target.value)}
            trailing={shown === 'checking' ? <Spinner size={14} /> : undefined}
            error={shown === 'taken' ? 'That username is taken.' : shown === 'invalid' ? '3-20 characters: letters, numbers and underscores.' : null}
            hint={shown === 'available' ? 'Available' : shown === 'checking' ? 'Checking...' : undefined}
            hintTone={shown === 'available' ? 'success' : 'default'}
        />
    );
}

export default UsernameField;

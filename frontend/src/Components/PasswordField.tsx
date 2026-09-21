import React, { useState } from 'react';
import { PASSWORD_RULES } from '@ciphersprint/shared';
import Input from './ui/Input';
import IconButton from './ui/IconButton';
import Icon from './ui/Icon';
import { cx } from '../Utils/cx';

interface PasswordFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    // Show the live rules checklist (signup) or not (login, confirm).
    showRules?: boolean;
    autoComplete?: string;
}

// Runs the shared password rules synchronously on every keystroke (pure
// client-side logic, no network round-trip like username availability) and
// shows a live checklist instead of only finding out after submitting.
function PasswordField({ value, onChange, placeholder = 'Password', label = 'Password', showRules = false, autoComplete = 'current-password' }: PasswordFieldProps) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="ui-field">
            <Input
                label={label}
                type={visible ? 'text' : 'password'}
                placeholder={placeholder}
                value={value}
                autoComplete={autoComplete}
                onChange={(e) => onChange(e.target.value)}
                trailing={
                    <IconButton
                        icon={visible ? 'eye-off' : 'eye'}
                        label={visible ? 'Hide password' : 'Show password'}
                        size="sm"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setVisible((v) => !v)}
                    />
                }
            />
            {showRules && value && (
                <ul className="pw-rules" aria-label="Password requirements">
                    {PASSWORD_RULES.map((rule) => {
                        const met = rule.test(value);
                        return (
                            <li key={rule.key} className={cx('pw-rule', met && 'is-met')}>
                                <span className="pw-rule__dot">{met && <Icon name="check" size={14} />}</span>
                                {rule.label}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default PasswordField;

import React from 'react';
import Icon, { IconName } from './Icon';
import IconButton from './IconButton';
import { cx } from '../../Utils/cx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: IconName;
    // Shown as a trailing clear button whenever the field has a value.
    onClear?: () => void;
    error?: string | null;
    hint?: string;
    // "success" tints the hint in the accent (e.g. "Available").
    hintTone?: 'default' | 'success';
    // Visually hidden label for assistive tech (placeholders are not labels).
    label: string;
    trailing?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
    { icon, onClear, error, hint, hintTone = 'default', label, trailing, className, value, ...rest },
    ref
) {
    const hasValue = typeof value === 'string' ? value.length > 0 : false;
    return (
        <div className={cx('ui-field', className)}>
            <div className={cx('ui-input', !!error && 'has-error')}>
                {icon && <Icon name={icon} size={16} />}
                <input ref={ref} value={value} aria-label={label} aria-invalid={error ? true : undefined} {...rest} />
                {onClear && hasValue && (
                    <IconButton
                        className="ui-input__clear"
                        icon="close"
                        label="Clear"
                        size="sm"
                        iconSize={14}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={onClear}
                    />
                )}
                {trailing}
            </div>
            {error ? (
                <div className="ui-hint ui-hint--error" role="alert">{error}</div>
            ) : hint ? (
                <div className={cx('ui-hint', hintTone === 'success' && 'ui-hint--ok')}>{hint}</div>
            ) : null}
        </div>
    );
});

export default Input;

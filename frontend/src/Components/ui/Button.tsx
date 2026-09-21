import React from 'react';
import Icon, { IconName } from './Icon';
import Spinner from './Spinner';
import { cx } from '../../Utils/cx';

type Variant = 'default' | 'primary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: 'sm' | 'md';
    icon?: IconName;
    loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant = 'default', size = 'md', icon, loading, className, children, disabled, type = 'button', ...rest },
    ref
) {
    return (
        <button
            ref={ref}
            type={type}
            className={cx('ui-btn', `ui-btn--${variant}`, size === 'sm' && 'ui-btn--sm', className)}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            {...rest}
        >
            {loading ? <Spinner size={14} /> : icon ? <Icon name={icon} size={16} /> : null}
            {children}
        </button>
    );
});

export default Button;

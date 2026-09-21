import React from 'react';
import Icon, { IconName } from './Icon';
import { cx } from '../../Utils/cx';

interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
    icon: IconName;
    // Required: an icon-only control has no visible text, so the label is
    // both the accessible name and the native tooltip.
    label: string;
    size?: 'sm' | 'md';
    iconSize?: number;
    active?: boolean;
    badge?: number;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
    { icon, label, size = 'md', iconSize, active, badge, className, type = 'button', ...rest },
    ref
) {
    return (
        <button
            ref={ref}
            type={type}
            className={cx('ui-iconbtn', size === 'sm' && 'ui-iconbtn--sm', active && 'is-active', className)}
            aria-label={badge ? `${label} (${badge})` : label}
            aria-current={active ? 'page' : undefined}
            title={label}
            {...rest}
        >
            <Icon name={icon} size={iconSize ?? (size === 'sm' ? 16 : 20)} />
            {badge ? <span className="ui-iconbtn__badge">{badge > 99 ? '99+' : badge}</span> : null}
        </button>
    );
});

export default IconButton;

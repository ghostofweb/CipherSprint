import React from 'react';
import { cx } from '../../Utils/cx';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    disabled?: boolean;
}

// An on/off setting. A real button with role="switch", so it is focusable and
// announced correctly without a library.
function Switch({ checked, onChange, label, disabled }: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            className={cx('ui-switch', checked && 'is-on')}
            onClick={(e) => {
                e.stopPropagation();
                onChange(!checked);
            }}
        >
            <span className="ui-switch__thumb" />
        </button>
    );
}

export default Switch;

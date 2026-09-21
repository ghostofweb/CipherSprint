import React from 'react';
import { cx } from '../../Utils/cx';

export interface SegmentedOption<T extends string | number> {
    value: T;
    label: string;
}

interface SegmentedProps<T extends string | number> {
    options: SegmentedOption<T>[];
    value: T;
    onChange: (value: T) => void;
    label: string;
}

// A short row of mutually exclusive choices (a filter or a sort): text with
// an accent underline on the active one, no filled pills.
function Segmented<T extends string | number>({ options, value, onChange, label }: SegmentedProps<T>) {
    return (
        <div className="ui-seg" role="group" aria-label={label}>
            {options.map((o) => (
                <button
                    key={String(o.value)}
                    type="button"
                    className={cx('ui-seg__opt', o.value === value && 'is-active')}
                    aria-pressed={o.value === value}
                    onClick={() => onChange(o.value)}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

export default Segmented;

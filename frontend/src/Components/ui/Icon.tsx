import React from 'react';
import { icons, IconName } from './icons';

interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name'> {
    name: IconName;
    size?: number;
    // Provide a title only when the icon stands alone (no adjacent text or
    // labelled button); otherwise it is decorative and hidden from AT.
    title?: string;
}

function Icon({ name, size = 20, title, className, ...rest }: IconProps) {
    return (
        <svg
            className={`ui-icon${className ? ` ${className}` : ''}`}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            role={title ? 'img' : undefined}
            aria-label={title}
            aria-hidden={title ? undefined : true}
            focusable="false"
            {...rest}
        >
            {icons[name]}
        </svg>
    );
}

export default Icon;
export type { IconName };

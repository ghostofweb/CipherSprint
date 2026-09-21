import React from 'react';
import { cx } from '../../Utils/cx';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    circle?: boolean;
}

export function Skeleton({ width = '100%', height = 12, circle }: SkeletonProps) {
    return <span className={cx('ui-skel', circle && 'ui-skel--circle')} style={{ width, height }} aria-hidden="true" />;
}

// Avatar + two text lines, the shape of every list row in the app.
export function SkeletonRows({ count = 3 }: { count?: number }) {
    return (
        <div role="status" aria-label="Loading">
            {Array.from({ length: count }, (_, i) => (
                <div className="ui-skel-row" key={i}>
                    <Skeleton width={32} height={32} circle />
                    <div className="ui-skel-lines">
                        <Skeleton width={`${40 + ((i * 17) % 30)}%`} height={12} />
                        <Skeleton width={`${55 + ((i * 11) % 30)}%`} height={10} />
                    </div>
                </div>
            ))}
        </div>
    );
}

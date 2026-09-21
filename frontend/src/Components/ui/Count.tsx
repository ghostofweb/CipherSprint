import React from 'react';
import { cx } from '../../Utils/cx';

function Count({ n, accent }: { n: number; accent?: boolean }) {
    if (n <= 0) return null;
    return <span className={cx('ui-count', accent && 'ui-count--accent')}>{n > 99 ? '99+' : n}</span>;
}

export default Count;

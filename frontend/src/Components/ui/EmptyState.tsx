import React from 'react';

interface EmptyStateProps {
    art?: React.ReactNode;
    title: string;
    children?: React.ReactNode;
    action?: React.ReactNode;
}

// An empty area is an invitation to act: say what is missing, then what to do.
function EmptyState({ art, title, children, action }: EmptyStateProps) {
    return (
        <div className="ui-empty">
            {art && <div className="ui-empty__art">{art}</div>}
            <div className="ui-empty__title">{title}</div>
            {children && <div className="ui-empty__body">{children}</div>}
            {action && <div className="ui-empty__action">{action}</div>}
        </div>
    );
}

export default EmptyState;

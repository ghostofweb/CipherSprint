import React from 'react';
import type { FriendRequestRow } from '@ciphersprint/shared';
import Avatar from '../Avatar';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import { ago } from './time';

interface RequestRowProps {
    request: FriendRequestRow;
    direction: 'incoming' | 'outgoing';
    busy: boolean;
    onAccept?: () => void;
    // Declines an incoming request / cancels an outgoing one.
    onDismiss: () => void;
}

function RequestRow({ request, direction, busy, onAccept, onDismiss }: RequestRowProps) {
    return (
        <li className="sp-row">
            <div className="sp-row__main is-static">
                <Avatar url={request.avatarUrl} name={request.username} size="md" />
                <span className="sp-row__text">
                    <span className="sp-row__name">{request.username}</span>
                    <span className="sp-row__sub is-faint">
                        {direction === 'incoming' ? 'Sent' : 'You sent'} {ago(request.createdAt)}
                    </span>
                </span>
            </div>
            <div className="sp-row__actions">
                {direction === 'incoming' ? (
                    <>
                        <Button size="sm" variant="primary" data-nav loading={busy} onClick={onAccept}>Accept</Button>
                        <IconButton icon="close" size="sm" label={`Decline request from ${request.username}`} data-nav disabled={busy} onClick={onDismiss} />
                    </>
                ) : (
                    <Button size="sm" variant="ghost" data-nav loading={busy} onClick={onDismiss}>Cancel</Button>
                )}
            </div>
        </li>
    );
}

export default React.memo(RequestRow);

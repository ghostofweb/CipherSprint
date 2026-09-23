import React, { useState } from 'react';
import type { FriendRow as FriendRowData } from '@ciphersprint/shared';
import Avatar from '../Avatar';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import Count from '../ui/Count';
import Menu from '../ui/Menu';
import Highlight from './Highlight';
import { cx } from '../../Utils/cx';
import { formatRelativeTime } from '../../Utils/format';

interface FriendRowProps {
    friend: FriendRowData;
    me: string;
    query: string;
    confirming: boolean;
    removing: boolean;
    onOpen: () => void;
    onProfile: () => void;
    onChallenge: () => void;
    onWatch: (code: string) => void;
    onBlock: () => void;
    onReport: () => void;
    onAskRemove: () => void;
    onCancelRemove: () => void;
    onConfirmRemove: () => void;
}

// "You: hey" when you sent the last message; a DM has one other person, so
// theirs needs no prefix.
function preview(friend: FriendRowData, me: string): string | null {
    if (!friend.lastMessageText) return null;
    return friend.lastMessageSenderUsername === me ? `You: ${friend.lastMessageText}` : friend.lastMessageText;
}

function FriendRow({ friend, me, query, confirming, removing, onOpen, onProfile, onChallenge, onWatch, onBlock, onReport, onAskRemove, onCancelRemove, onConfirmRemove }: FriendRowProps) {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const text = preview(friend, me);
    const unread = friend.unreadCount > 0;

    if (confirming) {
        return (
            <li className="sp-row sp-row--confirm">
                <span className="sp-row__confirm-text">Remove {friend.username}?</span>
                <div className="sp-row__actions">
                    <Button size="sm" variant="ghost" data-nav onClick={onCancelRemove}>Cancel</Button>
                    <Button size="sm" variant="danger" data-nav loading={removing} onClick={onConfirmRemove}>Remove</Button>
                </div>
            </li>
        );
    }

    return (
        <li className={cx('sp-row', unread && 'has-unread')}>
            <button type="button" className="sp-row__main" data-nav data-nav-key={`dm:${friend.username}`} onClick={onOpen}>
                <Avatar url={friend.avatarUrl} name={friend.username} size="md" presence={friend.online ? 'online' : 'offline'} />
                <span className="sp-row__text">
                    <span className="sp-row__name"><Highlight text={friend.username} query={query} /></span>
                    {friend.racingCode ? (
                        <span className="sp-row__sub is-racing">racing now<span className="rl-caret" aria-hidden="true" /></span>
                    ) : (
                        <span className={cx('sp-row__sub', !text && 'is-faint')}>{text ?? (friend.online ? 'online' : 'offline')}</span>
                    )}
                </span>
                <span className="sp-row__meta">
                    {friend.lastMessageAt && <time className="sp-row__time tnum" dateTime={friend.lastMessageAt}>{formatRelativeTime(friend.lastMessageAt)}</time>}
                    <Count n={friend.unreadCount} accent />
                </span>
            </button>
            {friend.racingCode && (
                <IconButton icon="eye" size="sm" label={`Watch ${friend.username} race`} className="sp-row__watch" onClick={() => onWatch(friend.racingCode as string)} />
            )}
            <IconButton
                icon="more"
                size="sm"
                label={`More options for ${friend.username}`}
                className="sp-row__more"
                onClick={(e) => setAnchor(e.currentTarget)}
            />
            <Menu
                anchorEl={anchor}
                open={!!anchor}
                onClose={() => setAnchor(null)}
                actions={[
                    { id: 'profile', label: 'View profile', icon: 'user', onSelect: onProfile },
                    { id: 'race', label: 'Challenge to a race', icon: 'race', onSelect: onChallenge },
                    { id: 'remove', label: 'Remove friend', icon: 'user-minus', danger: true, onSelect: onAskRemove },
                    { id: 'report', label: 'Report', icon: 'flag', danger: true, onSelect: onReport },
                    { id: 'block', label: 'Block', icon: 'block', danger: true, onSelect: onBlock },
                ]}
            />
        </li>
    );
}

export default React.memo(FriendRow);

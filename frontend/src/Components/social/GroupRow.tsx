import React from 'react';
import type { GroupSummary } from '@ciphersprint/shared';
import Avatar from '../Avatar';
import Count from '../ui/Count';
import Highlight from './Highlight';
import { cx } from '../../Utils/cx';
import { formatRelativeTime } from '../../Utils/format';

interface GroupRowProps {
    group: GroupSummary;
    me: string;
    query: string;
    onOpen: () => void;
}

function GroupRow({ group, me, query, onOpen }: GroupRowProps) {
    const unread = (group.unreadCount ?? 0) > 0;
    const sender = group.lastMessageSenderUsername;
    const preview = group.lastMessageText
        ? `${sender ? `${sender === me ? 'You' : sender}: ` : ''}${group.lastMessageText}`
        : null;

    return (
        <li className={cx('sp-row', unread && 'has-unread')}>
            <button type="button" className="sp-row__main" data-nav data-nav-key={`group:${group._id}`} onClick={onOpen}>
                <Avatar url={group.avatarUrl} name={group.name} size="md" />
                <span className="sp-row__text">
                    <span className="sp-row__name"><Highlight text={group.name} query={query} /></span>
                    <span className={cx('sp-row__sub', !preview && 'is-faint')}>
                        {preview ?? `${group.memberCount} member${group.memberCount === 1 ? '' : 's'}`}
                    </span>
                </span>
                <span className="sp-row__meta">
                    {group.lastMessageAt && <time className="sp-row__time tnum" dateTime={group.lastMessageAt}>{formatRelativeTime(group.lastMessageAt)}</time>}
                    <Count n={group.unreadCount ?? 0} accent />
                </span>
            </button>
        </li>
    );
}

export default React.memo(GroupRow);

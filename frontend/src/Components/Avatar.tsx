import React from 'react';
import GeneratedAvatar from './assets/GeneratedAvatar';
import { cx } from '../Utils/cx';

interface AvatarProps {
    url?: string | null;
    name?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    // When set, a presence dot (filled = online, hollow = offline) is drawn
    // on the avatar's corner.
    presence?: 'online' | 'offline';
}

function Avatar({ url, name, size = 'md', presence }: AvatarProps) {
    const face = url ? (
        <img className={cx('avatar', `avatar-${size}`)} src={url} alt={name || 'avatar'} />
    ) : (
        <GeneratedAvatar name={name} className={cx('avatar', `avatar-${size}`)} />
    );

    if (!presence) return face;

    return (
        <span className="avatar-wrap">
            {face}
            <span className={cx('presence-dot', presence === 'offline' && 'is-offline')} title={presence} />
        </span>
    );
}

export default Avatar;

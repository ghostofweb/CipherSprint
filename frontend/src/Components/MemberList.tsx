import React from 'react';
import { Link } from 'react-router-dom';
import type { GroupMemberRow } from '@ciphersprint/shared';
import Avatar from './Avatar';

// Owner first, then alphabetical: stable and predictable.
function sortMembers(members: GroupMemberRow[]): GroupMemberRow[] {
    return members.slice().sort((a, b) => {
        if (a.role !== b.role) return a.role === 'owner' ? -1 : 1;
        return a.username.localeCompare(b.username);
    });
}

function MemberList({ members }: { members: GroupMemberRow[] }) {
    return (
        <ul className="member-list">
            {sortMembers(members).map((m) => (
                <li key={m.username} className="member-row">
                    <Avatar url={m.avatarUrl} name={m.username} size="sm" />
                    <Link className="member-row__name" to={`/u/${m.username}`}>{m.username}</Link>
                    {m.role === 'owner' && <span className="member-row__role">owner</span>}
                </li>
            ))}
        </ul>
    );
}

export default MemberList;

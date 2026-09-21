import type { FriendRow, FriendRequestRow, Relationship, UserSearchResult } from '@ciphersprint/shared';

export interface ResolvedRelationship {
    relationship: Relationship;
    requestId?: string;
}

// A search result carries a server snapshot of how you relate to someone,
// but that goes stale the moment anything changes (they accept, you cancel,
// a socket event lands). The lists in SocialContext are kept live, so once
// they have loaded they are the source of truth and the snapshot is only a
// first-paint fallback.
export function resolveRelationship(
    person: Pick<UserSearchResult, 'username' | 'relationship' | 'requestId'>,
    friends: FriendRow[],
    requests: { incoming: FriendRequestRow[]; outgoing: FriendRequestRow[] },
    listsLoaded: boolean
): ResolvedRelationship {
    if (person.relationship === 'self') return { relationship: 'self' };
    if (!listsLoaded) return { relationship: person.relationship, requestId: person.requestId };

    if (friends.some((f) => f.username === person.username)) return { relationship: 'friends' };
    const outgoing = requests.outgoing.find((r) => r.username === person.username);
    if (outgoing) return { relationship: 'outgoing', requestId: outgoing.id };
    const incoming = requests.incoming.find((r) => r.username === person.username);
    if (incoming) return { relationship: 'incoming', requestId: incoming.id };
    return { relationship: 'none' };
}

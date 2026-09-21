import React from 'react';
import type { UserSearchResult } from '@ciphersprint/shared';
import Avatar from '../Avatar';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import Highlight from './Highlight';
import type { ResolvedRelationship } from '../../Utils/relationship';

interface PersonRowProps {
    person: UserSearchResult;
    resolved: ResolvedRelationship;
    query: string;
    busy: boolean;
    onAdd: () => void;
    onCancel: () => void;
    onAccept: () => void;
    onMessage: () => void;
}

// One search result. The action reflects how you relate to them right now.
function PersonRow({ person, resolved, query, busy, onAdd, onCancel, onAccept, onMessage }: PersonRowProps) {
    const { relationship } = resolved;
    return (
        <li className="sp-row">
            <div className="sp-row__main is-static">
                <Avatar url={person.avatarUrl} name={person.username} size="md" />
                <span className="sp-row__text">
                    <span className="sp-row__name"><Highlight text={person.username} query={query} /></span>
                    <span className="sp-row__sub is-faint tnum">#{person.publicId}</span>
                </span>
            </div>
            <div className="sp-row__actions">
                {relationship === 'none' && <Button size="sm" data-nav loading={busy} onClick={onAdd}>Add</Button>}
                {relationship === 'outgoing' && (
                    <>
                        <span className="sp-row__state">Requested</span>
                        <IconButton icon="close" size="sm" label={`Cancel request to ${person.username}`} data-nav disabled={busy} onClick={onCancel} />
                    </>
                )}
                {relationship === 'incoming' && <Button size="sm" variant="primary" data-nav loading={busy} onClick={onAccept}>Accept</Button>}
                {relationship === 'friends' && <Button size="sm" variant="ghost" data-nav onClick={onMessage}>Message</Button>}
            </div>
        </li>
    );
}

export default React.memo(PersonRow);

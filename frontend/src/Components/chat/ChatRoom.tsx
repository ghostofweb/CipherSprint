import React from 'react';
import type { ChatState } from '../../Hooks/useChat';
import { useAuth } from '../../Context/AuthContext';
import MessageList from './MessageList';
import Composer from './Composer';

interface ChatRoomProps {
    chat: ChatState;
    // Unique per conversation; keys the unsent-draft store.
    draftKey: string;
    avatarsByUsername?: Record<string, string | null | undefined>;
    // Show sender names above messages (groups; a DM has only one "other").
    showNames?: boolean;
    disabled?: boolean;
    disabledReason?: string;
    emptyTitle?: string;
    emptyBody?: string;
    startLabel?: string;
    autoFocus?: boolean;
}

function typingLabel(usernames: string[]): string {
    if (usernames.length === 1) return `${usernames[0]} is typing`;
    if (usernames.length === 2) return `${usernames[0]} and ${usernames[1]} are typing`;
    return `${usernames.length} people are typing`;
}

function ChatRoom({
    chat,
    draftKey,
    avatarsByUsername = {},
    showNames = false,
    disabled,
    disabledReason,
    emptyTitle = 'No messages yet',
    emptyBody,
    startLabel,
    autoFocus,
}: ChatRoomProps) {
    const { user } = useAuth();
    const offline = !chat.connected;

    return (
        <div className="cr">
            <MessageList
                chat={chat}
                me={user?.username ?? ''}
                avatarsByUsername={avatarsByUsername}
                showNames={showNames}
                emptyTitle={emptyTitle}
                emptyBody={emptyBody}
                startLabel={startLabel}
            />
            {/* Fixed height so the line appearing never shifts the list. */}
            <div className="cr-typing" role="status" aria-live="polite">
                {chat.typingUsers.length > 0 && (
                    <>
                        {typingLabel(chat.typingUsers)}
                        <span className="cr-caret" aria-hidden="true" />
                    </>
                )}
            </div>
            <Composer
                draftKey={draftKey}
                autoFocus={autoFocus}
                disabled={disabled || offline}
                disabledReason={disabled ? disabledReason : offline ? 'Reconnecting...' : undefined}
                onSend={chat.sendMessage}
                onTyping={chat.notifyTyping}
                onStopTyping={chat.stopTyping}
            />
        </div>
    );
}

export default ChatRoom;

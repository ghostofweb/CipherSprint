// Unsent message text, kept per conversation for the lifetime of the tab, so
// backing out of a chat (or closing the panel) does not lose what you typed.
const drafts = new Map<string, string>();

export const getDraft = (key: string): string => drafts.get(key) ?? '';

export const setDraft = (key: string, text: string): void => {
    if (text) drafts.set(key, text);
    else drafts.delete(key);
};

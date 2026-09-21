// Remembers which row opened a conversation, so backing out returns focus to
// that row instead of dropping it on the page.
export const focusMemory: { key: string | null } = { key: null };

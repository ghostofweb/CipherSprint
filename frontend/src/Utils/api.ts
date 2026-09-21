import type {
    PublicUser,
    PersonalBest,
    LeaderboardRow,
    FriendRow,
    FriendRequestRow,
    GroupSummary,
    GroupMemberRow,
    ChatMessage,
    UserAggregates,
    UserSearchResult,
    MyLeaderboardEntry,
} from "@ciphersprint/shared";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const TOKEN_KEY = "authToken";

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions {
    method?: string;
    body?: unknown;
    auth?: boolean;
}

async function request<T = any>(path: string, { method = "GET", body, auth = false }: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (auth) {
        const token = getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data as T;
}

export interface AuthResult {
    token: string;
    user: PublicUser;
}

export interface GoogleAuthResult {
    needsUsername?: boolean;
    pendingToken?: string;
    token?: string;
    user?: PublicUser;
}

export interface MeResult {
    user: PublicUser;
    aggregates: UserAggregates;
    personalBests: PersonalBest[];
}

export interface ProfileResult {
    username: string;
    publicId: string;
    avatarUrl: string | null;
    createdAt: string;
    isPublic: boolean;
    aggregates: UserAggregates;
    personalBests: PersonalBest[];
}

export const api = {
    signup: (payload: { username: string; email: string; password: string }) =>
        request<AuthResult>("/api/auth/signup", { method: "POST", body: payload }),
    login: (payload: { email: string; password: string }) =>
        request<AuthResult>("/api/auth/login", { method: "POST", body: payload }),
    googleLogin: (idToken: string) =>
        request<GoogleAuthResult>("/api/auth/google", { method: "POST", body: { idToken } }),
    googleComplete: (pendingToken: string, username: string) =>
        request<AuthResult>("/api/auth/google/complete", { method: "POST", body: { pendingToken, username } }),
    checkUsername: (username: string) =>
        request<{ available: boolean; reason?: string }>(`/api/auth/username-available?username=${encodeURIComponent(username)}`),
    me: () => request<MeResult>("/api/auth/me", { auth: true }),
    saveResult: (payload: Record<string, unknown>) =>
        request("/api/results", { method: "POST", body: payload, auth: true }),
    myResults: (limit = 50) => request<{ results: any[] }>(`/api/results/me?limit=${limit}`, { auth: true }),
    profile: (username: string) => request<ProfileResult>(`/api/users/${encodeURIComponent(username)}`, { auth: true }),
    updateVisibility: (isPublic: boolean) =>
        request<{ isPublic: boolean }>("/api/users/me/visibility", { method: "PATCH", body: { isPublic }, auth: true }),
    updatePresence: (showPresence: boolean) =>
        request<{ showPresence: boolean }>("/api/users/me/presence", { method: "PATCH", body: { showPresence }, auth: true }),
    updateAvatar: (url: string, publicId: string) =>
        request<{ avatarUrl: string }>("/api/users/me/avatar", { method: "PATCH", body: { url, publicId }, auth: true }),
    updateGroupAvatar: (groupId: string, url: string, publicId: string) =>
        request<{ avatarUrl: string }>(`/api/groups/${groupId}/avatar`, { method: "PATCH", body: { url, publicId }, auth: true }),
    getUploadSignature: (folder: string) =>
        request<{ timestamp: number; signature: string; apiKey: string; cloudName: string; folder: string }>(
            "/api/media/signature",
            { method: "POST", body: { folder }, auth: true }
        ),
    searchUsers: (q: string) =>
        request<{ users: UserSearchResult[] }>(`/api/users/search?q=${encodeURIComponent(q)}`, { auth: true }),
    leaderboard: (mode: string, modeDetail: string | number | undefined, limit = 50) =>
        request<{ leaderboard: LeaderboardRow[] }>(
            `/api/leaderboard?mode=${encodeURIComponent(mode)}&modeDetail=${encodeURIComponent(modeDetail ?? "-")}&limit=${limit}`
        ),

    myLeaderboardEntry: (mode: string, modeDetail: string | number | undefined) =>
        request<{ entry: MyLeaderboardEntry | null }>(
            `/api/leaderboard/me?mode=${encodeURIComponent(mode)}&modeDetail=${encodeURIComponent(modeDetail ?? "-")}`,
            { auth: true }
        ),

    // Friends
    friends: () => request<{ friends: FriendRow[] }>("/api/friends", { auth: true }),
    friendRequests: () =>
        request<{ incoming: FriendRequestRow[]; outgoing: FriendRequestRow[] }>("/api/friends/requests", { auth: true }),
    sendFriendRequest: (username: string) =>
        request<{ id: string }>("/api/friends/requests", { method: "POST", body: { username }, auth: true }),
    acceptFriendRequest: (id: string) =>
        request(`/api/friends/requests/${id}/accept`, { method: "POST", auth: true }),
    declineFriendRequest: (id: string) => request(`/api/friends/requests/${id}`, { method: "DELETE", auth: true }),
    unfriend: (userId: string) => request(`/api/friends/${userId}`, { method: "DELETE", auth: true }),

    // Groups
    listGroups: (search = "", sort: "members" | "new" = "members") =>
        request<{ groups: GroupSummary[] }>(`/api/groups?search=${encodeURIComponent(search)}&sort=${sort}`, { auth: true }),
    myGroups: () => request<{ groups: GroupSummary[] }>("/api/groups/mine", { auth: true }),
    createGroup: (name: string, description: string) =>
        request<{ group: GroupSummary }>("/api/groups", { method: "POST", body: { name, description }, auth: true }),
    getGroup: (id: string) =>
        request<{ group: GroupSummary; isMember: boolean; members: GroupMemberRow[] }>(`/api/groups/${id}`, { auth: true }),
    joinGroup: (id: string) => request<{ ok: true }>(`/api/groups/${id}/join`, { method: "POST", auth: true }),
    leaveGroup: (id: string) => request<{ ok: true }>(`/api/groups/${id}/leave`, { method: "POST", auth: true }),
    groupMessages: (id: string, before?: number) =>
        request<{ messages: ChatMessage[] }>(`/api/groups/${id}/messages${before ? `?before=${before}` : ""}`, { auth: true }),

    // Direct messages
    openDm: (username: string) =>
        request<{ conversation: { _id: string }; otherUser: { username: string; avatarUrl: string | null } }>(
            `/api/dm/${encodeURIComponent(username)}`,
            { method: "POST", auth: true }
        ),
    dmMessages: (username: string, before?: number) =>
        request<{ conversation: { _id: string }; messages: ChatMessage[] }>(
            `/api/dm/${encodeURIComponent(username)}/messages${before ? `?before=${before}` : ""}`,
            { auth: true }
        ),
};

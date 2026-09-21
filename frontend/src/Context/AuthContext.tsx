import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { PublicUser, UserAggregates } from "@ciphersprint/shared";
import { api, getToken, setToken, GoogleAuthResult } from "../Utils/api";
import { disconnectSocket } from "../Utils/socket";

interface AuthContextValue {
    user: PublicUser | null;
    aggregates: UserAggregates | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (username: string, email: string, password: string) => Promise<void>;
    loginWithGoogle: (idToken: string) => Promise<GoogleAuthResult>;
    completeGoogleSignup: (pendingToken: string, username: string) => Promise<void>;
    logout: () => void;
    refreshAggregates: () => Promise<void>;
    updateVisibility: (isPublic: boolean) => Promise<boolean>;
    updatePresence: (showPresence: boolean) => Promise<boolean>;
    updateAvatar: (url: string, publicId: string) => Promise<string | null>;
}

const authContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<PublicUser | null>(null);
    const [aggregates, setAggregates] = useState<UserAggregates | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!getToken()) {
            setLoading(false);
            return;
        }
        api.me()
            .then(({ user, aggregates }) => {
                setUser(user);
                setAggregates(aggregates);
            })
            .catch(() => setToken(null))
            .finally(() => setLoading(false));
    }, []);

    const login = async (email: string, password: string) => {
        const { token, user } = await api.login({ email, password });
        setToken(token);
        setUser(user);
        const me = await api.me();
        setAggregates(me.aggregates);
    };

    const signup = async (username: string, email: string, password: string) => {
        const { token, user } = await api.signup({ username, email, password });
        setToken(token);
        setUser(user);
        setAggregates(null);
    };

    const loginWithGoogle = async (idToken: string): Promise<GoogleAuthResult> => {
        const res = await api.googleLogin(idToken);
        if (res.needsUsername) return res; // { needsUsername: true, pendingToken } -- caller shows a username picker
        setToken(res.token as string);
        setUser(res.user as PublicUser);
        const me = await api.me();
        setAggregates(me.aggregates);
        return res;
    };

    const completeGoogleSignup = async (pendingToken: string, username: string) => {
        const { token, user } = await api.googleComplete(pendingToken, username);
        setToken(token);
        setUser(user);
        setAggregates(null);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setAggregates(null);
        disconnectSocket();
    };

    const refreshAggregates = async () => {
        if (!getToken()) return;
        const me = await api.me();
        setAggregates(me.aggregates);
    };

    const updateVisibility = async (isPublic: boolean): Promise<boolean> => {
        const res = await api.updateVisibility(isPublic);
        setUser((u) => (u ? { ...u, isPublic: res.isPublic } : u));
        return res.isPublic;
    };

    const updatePresence = async (showPresence: boolean): Promise<boolean> => {
        const res = await api.updatePresence(showPresence);
        setUser((u) => (u ? { ...u, showPresence: res.showPresence } : u));
        return res.showPresence;
    };

    const updateAvatar = async (url: string, publicId: string): Promise<string | null> => {
        const res = await api.updateAvatar(url, publicId);
        setUser((u) => (u ? { ...u, avatarUrl: res.avatarUrl } : u));
        return res.avatarUrl;
    };

    const values: AuthContextValue = {
        user, aggregates, loading, login, signup, loginWithGoogle, completeGoogleSignup,
        logout, refreshAggregates, updateVisibility, updatePresence, updateAvatar,
    };

    return <authContext.Provider value={values}>{children}</authContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
    const ctx = useContext(authContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthContextProvider");
    return ctx;
};

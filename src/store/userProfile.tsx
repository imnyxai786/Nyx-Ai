"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  userId: string;
  isPremium: boolean;
  byokKey: string | null;       // Bring Your Own Key
  requestCount: number;
  requestLimit: number;
  displayName: string | null;
  email: string | null;
  imageUrl: string | null;
}

interface UserProfileActions {
  setPremium: (premium: boolean) => void;
  setByokKey: (key: string | null) => void;
  incrementRequestCount: () => boolean; // returns false if limit hit
  resetRequestCount: () => void;
  canMakeRequest: () => boolean;
  getRemainingRequests: () => number;
  setUserInfo: (info: { displayName: string | null; email: string | null; imageUrl: string | null }) => void;
  loadProfile: (userId: string) => void;
  clearProfile: () => void;
}

type UserProfileContext = UserProfile & UserProfileActions;

const UserProfileCtx = createContext<UserProfileContext | null>(null);

// ── Local Storage Helpers (per-user) ────────────────────────────────────────

const FREE_REQUEST_LIMIT = parseInt(
  process.env.NEXT_PUBLIC_FREE_REQUEST_LIMIT || "10",
  10
);

function storageKey(userId: string) {
  return `nyx-ai:profile:${userId}`;
}

function loadFromStorage(userId: string): UserProfile {
  if (typeof window === "undefined") {
    return createDefault(userId);
  }
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...createDefault(userId),
        ...parsed,
        userId, // always use current userId
      };
    }
  } catch {
    // ignore corrupt data
  }
  return createDefault(userId);
}

function saveToStorage(profile: UserProfile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(profile.userId), JSON.stringify(profile));
  } catch {
    // ignore quota errors
  }
}

function createDefault(userId: string): UserProfile {
  return {
    userId,
    isPremium: false,
    byokKey: null,
    requestCount: 0,
    requestLimit: FREE_REQUEST_LIMIT,
    displayName: null,
    email: null,
    imageUrl: null,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────

export function UserProfileProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<UserProfile>(() =>
    userId ? loadFromStorage(userId) : createDefault("anonymous")
  );

  // When userId changes, load the correct profile
  useEffect(() => {
    if (userId) {
      const loaded = loadFromStorage(userId);
      setProfile(loaded);
    } else {
      setProfile(createDefault("anonymous"));
    }
  }, [userId]);

  // Persist on every change
  useEffect(() => {
    if (profile.userId && profile.userId !== "anonymous") {
      saveToStorage(profile);
    }
  }, [profile]);

  const setPremium = useCallback((premium: boolean) => {
    setProfile((prev) => ({ ...prev, isPremium: premium }));
  }, []);

  const setByokKey = useCallback((key: string | null) => {
    setProfile((prev) => ({ ...prev, byokKey: key }));
  }, []);

  const incrementRequestCount = useCallback((): boolean => {
    let allowed = false;
    setProfile((prev) => {
      // Premium or BYOK users have no limits
      if (prev.isPremium || prev.byokKey) {
        allowed = true;
        return { ...prev, requestCount: prev.requestCount + 1 };
      }
      if (prev.requestCount < prev.requestLimit) {
        allowed = true;
        return { ...prev, requestCount: prev.requestCount + 1 };
      }
      // Limit reached
      allowed = false;
      return prev;
    });
    return allowed;
  }, []);

  const resetRequestCount = useCallback(() => {
    setProfile((prev) => ({ ...prev, requestCount: 0 }));
  }, []);

  const canMakeRequest = useCallback((): boolean => {
    if (profile.isPremium || profile.byokKey) return true;
    return profile.requestCount < profile.requestLimit;
  }, [profile.isPremium, profile.byokKey, profile.requestCount, profile.requestLimit]);

  const getRemainingRequests = useCallback((): number => {
    if (profile.isPremium || profile.byokKey) return Infinity;
    return Math.max(0, profile.requestLimit - profile.requestCount);
  }, [profile.isPremium, profile.byokKey, profile.requestCount, profile.requestLimit]);

  const setUserInfo = useCallback(
    (info: { displayName: string | null; email: string | null; imageUrl: string | null }) => {
      setProfile((prev) => ({ ...prev, ...info }));
    },
    []
  );

  const loadProfile = useCallback((uid: string) => {
    const loaded = loadFromStorage(uid);
    setProfile(loaded);
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(createDefault("anonymous"));
  }, []);

  const ctx: UserProfileContext = {
    ...profile,
    setPremium,
    setByokKey,
    incrementRequestCount,
    resetRequestCount,
    canMakeRequest,
    getRemainingRequests,
    setUserInfo,
    loadProfile,
    clearProfile,
  };

  return (
    <UserProfileCtx.Provider value={ctx}>{children}</UserProfileCtx.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useUserProfile(): UserProfileContext {
  const ctx = useContext(UserProfileCtx);
  if (!ctx) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return ctx;
}
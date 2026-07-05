"use client";

import { useState, useCallback } from "react";
import { useUserProfile } from "@/store/userProfile";

// ── Types ──────────────────────────────────────────────────────────────────

export interface RequestGuardResult {
  /** Whether the request is allowed to proceed */
  allowed: boolean;
  /** Reason for denial, if blocked */
  reason: "limit_reached" | "premium_required" | null;
  /** Remaining requests for free users */
  remainingRequests: number;
  /** Whether the user has unlimited access (premium or BYOK) */
  hasUnlimitedAccess: boolean;
  /** Attempt to make a request — returns true if allowed, false if blocked */
  guardRequest: () => boolean;
  /** Show the upgrade prompt */
  showUpgradePrompt: () => void;
  /** Dismiss the upgrade prompt */
  dismissUpgradePrompt: () => void;
  /** Whether the upgrade prompt is visible */
  upgradePromptVisible: boolean;
}

// ── Hook ───────────────────────────────────────────────────────────────────

/**
 * Guards the main composer orchestration endpoints.
 * - If isPremium or BYOK key is set → unlimited access
 * - Otherwise → enforce strict local request limit
 */
export function useRequestGuard(): RequestGuardResult {
  const {
    isPremium,
    byokKey,
    requestCount,
    requestLimit,
    incrementRequestCount,
    getRemainingRequests,
    canMakeRequest,
  } = useUserProfile();

  const [upgradePromptVisible, setUpgradePromptVisible] = useState(false);

  const hasUnlimitedAccess = isPremium || !!byokKey;
  const remainingRequests = getRemainingRequests();

  const guardRequest = useCallback((): boolean => {
    // Premium or BYOK users always pass
    if (hasUnlimitedAccess) {
      incrementRequestCount();
      return true;
    }

    // Free user — check limit
    if (canMakeRequest()) {
      incrementRequestCount();
      return true;
    }

    // Limit reached — show upgrade prompt
    setUpgradePromptVisible(true);
    return false;
  }, [hasUnlimitedAccess, canMakeRequest, incrementRequestCount]);

  const showUpgradePrompt = useCallback(() => {
    setUpgradePromptVisible(true);
  }, []);

  const dismissUpgradePrompt = useCallback(() => {
    setUpgradePromptVisible(false);
  }, []);

  const reason: "limit_reached" | "premium_required" | null =
    !hasUnlimitedAccess && !canMakeRequest() ? "limit_reached" : null;

  return {
    allowed: hasUnlimitedAccess || canMakeRequest(),
    reason,
    remainingRequests,
    hasUnlimitedAccess,
    guardRequest,
    showUpgradePrompt,
    dismissUpgradePrompt,
    upgradePromptVisible,
  };
}
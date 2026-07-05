"use client";

import { useState, useCallback } from "react";
import { useUserProfile } from "@/store/userProfile";

// ── Types ──────────────────────────────────────────────────────────────────

interface SubscriptionState {
  isPremium: boolean;
  byokKey: string | null;
  hasUnlimitedAccess: boolean;
  remainingRequests: number;
  requestCount: number;
  requestLimit: number;
}

interface SubscriptionActions {
  /** Mock upgrade — sets isPremium to true after a simulated delay */
  mockUpgrade: (planId: string) => Promise<boolean>;
  /** Set BYOK key */
  setByokKey: (key: string | null) => void;
  /** Check if a request can be made, and increment counter if so */
  tryMakeRequest: () => boolean;
  /** Reset the request counter (e.g., new session) */
  resetRequests: () => void;
  /** Open the pricing modal */
  showPricingModal: () => void;
  /** Close the pricing modal */
  hidePricingModal: () => void;
}

export type UseSubscriptionReturn = SubscriptionState &
  SubscriptionActions & {
    pricingModalOpen: boolean;
  };

// ── Hook ───────────────────────────────────────────────────────────────────

export function useSubscription(): UseSubscriptionReturn {
  const {
    isPremium,
    byokKey,
    requestCount,
    requestLimit,
    setPremium,
    setByokKey,
    incrementRequestCount,
    resetRequestCount,
    canMakeRequest,
    getRemainingRequests,
  } = useUserProfile();

  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  const hasUnlimitedAccess = isPremium || !!byokKey;
  const remainingRequests = getRemainingRequests();

  const mockUpgrade = useCallback(
    async (planId: string): Promise<boolean> => {
      // Simulate payment processing delay
      return new Promise((resolve) => {
        setTimeout(() => {
          setPremium(true);
          resolve(true);
        }, 1500);
      });
    },
    [setPremium]
  );

  const tryMakeRequest = useCallback((): boolean => {
    if (hasUnlimitedAccess) {
      incrementRequestCount();
      return true;
    }
    return incrementRequestCount();
  }, [hasUnlimitedAccess, incrementRequestCount]);

  const resetRequests = useCallback(() => {
    resetRequestCount();
  }, [resetRequestCount]);

  const showPricingModal = useCallback(() => {
    setPricingModalOpen(true);
  }, []);

  const hidePricingModal = useCallback(() => {
    setPricingModalOpen(false);
  }, []);

  return {
    isPremium,
    byokKey,
    hasUnlimitedAccess,
    remainingRequests,
    requestCount,
    requestLimit,
    mockUpgrade,
    setByokKey,
    tryMakeRequest,
    resetRequests,
    showPricingModal,
    hidePricingModal,
    pricingModalOpen,
  };
}
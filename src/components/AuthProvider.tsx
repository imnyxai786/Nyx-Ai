"use client";

import React, { useState } from "react";
import {
  SignIn,
  useUser,
} from "@clerk/nextjs";
import { UserProfileProvider, useUserProfile } from "@/store/userProfile";
import {
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Loader2,
} from "lucide-react";

// ── Dev mode detection ──────────────────────────────────────────────────────

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isClerkConfigured =
  PUBLISHABLE_KEY.startsWith("pk_test_") &&
  !PUBLISHABLE_KEY.includes("placeholder");

// ── Beta Access Gate ────────────────────────────────────────────────────────

const BETA_CODE = process.env.NEXT_PUBLIC_BETA_ACCESS_CODE || "NYX-BETA-2024";

function BetaAccessGate({ onVerified }: { onVerified: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setError("");

    // Simulate a brief verification delay
    setTimeout(() => {
      if (code.trim() === BETA_CODE) {
        onVerified();
      } else {
        setError("Invalid beta access code. Please contact the team for access.");
      }
      setChecking(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-vsc-bg">
      <div className="w-full max-w-sm mx-auto">
        <div className="rounded-lg border border-vsc-border bg-vsc-sidebar p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-vsc-accent/15 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-vsc-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-vsc-text-bright">
                Invite-Only Beta
              </h2>
              <p className="text-[11px] text-vsc-text-dim">
                Enter your access code to continue
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-vsc-text-dim mb-1.5">
                Beta Access Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-vsc-text-subtle" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="NYX-BETA-XXXX"
                  className="w-full pl-8 pr-3 py-2 rounded-sm bg-vsc-input border border-vsc-border text-vsc-text text-xs placeholder-vsc-text-subtle focus:outline-none focus:border-vsc-border-focus transition-colors"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!code.trim() || checking}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-sm bg-vsc-accent text-white text-xs font-medium hover:bg-vsc-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checking ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Access"
              )}
            </button>
          </form>

          <p className="text-center text-[10px] text-vsc-text-subtle mt-4">
            Nyx AI is currently in closed beta.
            <br />
            Request access at{" "}
            <span className="text-vsc-accent">nyx-ai.dev/beta</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Authenticated App Shell ─────────────────────────────────────────────────

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { setUserInfo } = useUserProfile();

  // Sync Clerk user info to our profile store
  React.useEffect(() => {
    if (user) {
      setUserInfo({
        displayName: user.fullName || user.username || null,
        email: user.primaryEmailAddress?.emailAddress || null,
        imageUrl: user.imageUrl || null,
      });

      // Automatically inject $1.50 into wallet for new users
      // This is a placeholder for actual Supabase interaction.
      // In a production environment, this would trigger a server-side function to update the user_wallets table.
      if (user.createdAt && user.lastSignInAt && user.createdAt === user.lastSignInAt) { // Check if it\'s a new user
        console.log(`New user ${user.id} provisioned with a $1.50 starter balance.`);
        // Example of how you *might* call a Supabase function (requires client-side Supabase instance):
        // const supabase = createClientComponentClient();
        // await supabase.from(\'user_wallets\').insert({ user_id: user.id, balance_usd: 1.50, status: \'active\' });
      }
    }
  }, [user, setUserInfo]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vsc-bg">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-vsc-accent animate-spin" />
          <span className="text-sm text-vsc-text-dim">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vsc-bg">
        <div className="w-full max-w-sm mx-auto">
          <div className="rounded-lg border border-vsc-border bg-vsc-sidebar p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-vsc-accent/15 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-vsc-accent" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-vsc-text-bright">
                  Welcome to Nyx AI
                </h2>
                <p className="text-[11px] text-vsc-text-dim">
                  Sign in to continue
                </p>
              </div>
            </div>
            <SignIn routing="hash" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ── Clerk Authenticated Shell ───────────────────────────────────────────────

function ClerkAuthShell({ children }: { children: React.ReactNode }) {
  const [betaVerified, setBetaVerified] = useState(false);
  const { user } = useUser();
  const userId = user?.id || null;

  // If beta not verified, show the gate
  if (!betaVerified) {
    return (
      <BetaAccessGate onVerified={() => setBetaVerified(true)} />
    );
  }

  // Beta verified — wrap with user profile (per-user isolation)
  return (
    <UserProfileProvider userId={userId}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </UserProfileProvider>
  );
}

// ── Dev Mode Shell (no Clerk) ───────────────────────────────────────────────

function DevModeShell({ children }: { children: React.ReactNode }) {
  const [betaVerified, setBetaVerified] = useState(false);

  if (!betaVerified) {
    return <BetaAccessGate onVerified={() => setBetaVerified(true)} />;
  }

  // In dev mode without Clerk, render children directly with a default user profile
  return (
    <UserProfileProvider userId={"dev-user"}>
      {children}
    </UserProfileProvider>
  );
}

// ── Auth Provider (top-level) ────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // If Clerk is not properly configured, use dev mode shell (no Clerk)
  if (!isClerkConfigured) {
    return <DevModeShell>{children}</DevModeShell>;
  }

  return <ClerkAuthShell>{children}</ClerkAuthShell>;
}

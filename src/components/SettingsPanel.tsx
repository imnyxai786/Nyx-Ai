"use client";

import React, { useState } from "react";
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ShieldCheck,
  Zap,
  Trash2,
} from "lucide-react";
import { useUserProfile } from "@/store/userProfile";

// ── Types ──────────────────────────────────────────────────────────────────

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

// ── Settings Panel Component ────────────────────────────────────────────────

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { isPremium, byokKey, setByokKey, requestCount, requestLimit } =
    useUserProfile();
  const [keyInput, setKeyInput] = useState(byokKey || "");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const handleSaveKey = () => {
    const trimmed = keyInput.trim();
    setByokKey(trimmed || null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRemoveKey = () => {
    setKeyInput("");
    setByokKey(null);
  };

  const hasUnlimitedAccess = isPremium || !!byokKey;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel */}
        <div className="relative w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto rounded-lg border border-vsc-border bg-vsc-sidebar shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-vsc-border">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-vsc-accent" />
              <h2 className="text-sm font-semibold text-vsc-text-bright">
                Settings
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-sm text-vsc-text-dim hover:text-vsc-text hover:bg-vsc-list-hover transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Subscription Status */}
            <div>
              <h3 className="text-[11px] font-semibold text-vsc-text-subtle uppercase tracking-wider mb-3">
                Subscription
              </h3>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-sm bg-vsc-bg border border-vsc-border">
                {isPremium ? (
                  <>
                    <div className="w-7 h-7 rounded-sm bg-amber-400/15 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-vsc-text-bright">
                        Pro Plan
                      </p>
                      <p className="text-[10px] text-vsc-text-dim">
                        Unlimited requests
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-7 h-7 rounded-sm bg-vsc-input flex items-center justify-center">
                      <ShieldCheck className="w-3.5 h-3.5 text-vsc-text-dim" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-vsc-text-bright">
                        Free Plan
                      </p>
                      <p className="text-[10px] text-vsc-text-dim">
                        {byokKey
                          ? "Unlimited (BYOK active)"
                          : `${requestLimit - requestCount} / ${requestLimit} requests remaining`}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* BYOK Section */}
            <div>
              <h3 className="text-[11px] font-semibold text-vsc-text-subtle uppercase tracking-wider mb-2">
                Bring Your Own Key (BYOK)
              </h3>
              <p className="text-[10px] text-vsc-text-dim mb-3">
                Use your own OpenAI API key to bypass request limits. Your key
                is stored locally and never sent to our servers.
              </p>

              <div className="space-y-2">
                <div className="relative">
                  <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-vsc-text-subtle" />
                  <input
                    type={showKey ? "text" : "password"}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="sk-..."
                    className="w-full pl-8 pr-10 py-2 rounded-sm bg-vsc-input border border-vsc-border text-vsc-text text-xs placeholder-vsc-text-subtle focus:outline-none focus:border-vsc-border-focus transition-colors font-mono"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-vsc-text-subtle hover:text-vsc-text transition-colors"
                  >
                    {showKey ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveKey}
                    disabled={!keyInput.trim() && !byokKey}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-vsc-accent text-white text-[11px] font-medium hover:bg-vsc-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saved ? (
                      <>
                        <Check className="w-3 h-3" />
                        Saved!
                      </>
                    ) : (
                      "Save Key"
                    )}
                  </button>
                  {byokKey && (
                    <button
                      onClick={handleRemoveKey}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-medium hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>

                {byokKey && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px]">
                    <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      BYOK active — you have unlimited requests using your own
                      key.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-sm bg-vsc-bg border border-vsc-border">
              <AlertCircle className="w-3.5 h-3.5 text-vsc-text-subtle flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-vsc-text-dim">
                Your API key and settings are stored locally in your browser.
                They are never transmitted to any server other than the OpenAI
                API endpoint you configure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

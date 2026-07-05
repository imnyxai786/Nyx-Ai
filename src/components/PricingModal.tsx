"use client";

import React, { useState } from "react";
import {
  X,
  Check,
  Sparkles,
  Zap,
  Crown,
  KeyRound,
  Loader2,
} from "lucide-react";
import { useUserProfile } from "@/store/userProfile";

// ── Types ──────────────────────────────────────────────────────────────────

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
}

// ── Plan Data ──────────────────────────────────────────────────────────────

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Sparkles,
    color: "text-vsc-text-dim",
    borderColor: "border-vsc-border",
    bgColor: "bg-vsc-input",
    features: [
      "10 AI requests per session",
      "Basic code generation",
      "Single file editing",
      "Community support",
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    period: "/month",
    icon: Zap,
    color: "text-vsc-accent",
    borderColor: "border-vsc-accent/50",
    bgColor: "bg-vsc-accent/10",
    popular: true,
    features: [
      "Unlimited AI requests",
      "Advanced multi-file orchestration",
      "Priority model access (GPT-4)",
      "BYOK — use your own API key",
      "Live preview & terminal",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
  },
  {
    id: "team",
    name: "Team",
    price: "$49",
    period: "/month",
    icon: Crown,
    color: "text-amber-400",
    borderColor: "border-amber-400/50",
    bgColor: "bg-amber-400/10",
    features: [
      "Everything in Pro",
      "5 team seats included",
      "Shared workspaces",
      "Admin dashboard",
      "SSO / SAML",
      "Dedicated support channel",
    ],
    cta: "Upgrade to Team",
  },
];

// ── Pricing Modal Component ────────────────────────────────────────────────

export default function PricingModal({ open, onClose }: PricingModalProps) {
  const { isPremium, setPremium, byokKey } = useUserProfile();
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleUpgrade = (planId: string) => {
    setUpgrading(planId);

    // Mock payment — simulate a 1.5s delay then set isPremium: true
    setTimeout(() => {
      setPremium(true);
      setUpgrading(null);
      setSuccess(true);

      // Auto-close after showing success
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto rounded-lg border border-vsc-border bg-vsc-sidebar shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-vsc-border bg-vsc-sidebar">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-vsc-accent/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-vsc-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-vsc-text-bright">
                Upgrade Nyx AI
              </h2>
              <p className="text-[11px] text-vsc-text-dim">
                Unlock unlimited AI-powered coding
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm text-vsc-text-dim hover:text-vsc-text hover:bg-vsc-list-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Banner */}
        {success && (
          <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            <Check className="w-4 h-4" />
            <span className="font-medium">
              Upgrade successful! You now have unlimited access.
            </span>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentFree = plan.id === "free" && !isPremium;
            const isCurrentPremium = (plan.id === "pro" || plan.id === "team") && isPremium;
            const isUpgrading = upgrading === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-lg border p-5 transition-all ${
                  plan.popular
                    ? "border-vsc-accent/50 shadow-lg shadow-vsc-accent/5"
                    : "border-vsc-border"
                } ${isCurrentPremium ? "ring-1 ring-emerald-400/50" : ""}`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-vsc-accent text-white text-[10px] font-semibold">
                    Most Popular
                  </div>
                )}

                {/* Plan Icon & Name */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-8 h-8 rounded-lg ${plan.bgColor} flex items-center justify-center`}
                  >
                    <Icon className={`w-4 h-4 ${plan.color}`} />
                  </div>
                  <span className="text-sm font-semibold text-vsc-text-bright">
                    {plan.name}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-2xl font-bold text-vsc-text-bright">
                    {plan.price}
                  </span>
                  <span className="text-xs text-vsc-text-dim ml-1">
                    {plan.period}
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-[11px] text-vsc-text"
                    >
                      <Check
                        className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${plan.color}`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() =>
                    !plan.disabled && !isCurrentPremium && handleUpgrade(plan.id)
                  }
                  disabled={plan.disabled || isCurrentPremium || !!upgrading || success}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-sm text-xs font-medium transition-all ${
                    isCurrentFree
                      ? "bg-vsc-input border border-vsc-border text-vsc-text-dim cursor-default"
                      : isCurrentPremium
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 cursor-default"
                      : plan.popular
                      ? "bg-vsc-accent text-white hover:bg-vsc-accent-hover shadow-lg shadow-vsc-accent/20"
                      : "bg-vsc-input border border-vsc-border text-vsc-text hover:bg-vsc-list-hover hover:border-vsc-border-focus"
                  } disabled:opacity-60`}
                >
                  {isUpgrading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentFree ? (
                    "Current Plan"
                  ) : isCurrentPremium ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Active
                    </>
                  ) : (
                    plan.cta
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* BYOK Notice */}
        <div className="mx-6 mb-6 px-4 py-3 rounded-sm bg-vsc-accent/5 border border-vsc-accent/20">
          <div className="flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-vsc-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-medium text-vsc-text-bright">
                Bring Your Own Key (BYOK)
              </p>
              <p className="text-[10px] text-vsc-text-dim mt-0.5">
                Already have an OpenAI API key? Add it in Settings to bypass
                request limits without upgrading. Your key stays local and is
                never sent to our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
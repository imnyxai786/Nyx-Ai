import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cursor AI Dark Mode Palette
        "editor-surface": "#09090b", // Deep charcoal for background
        "editor-surface-2": "#18181b", // Slightly lighter charcoal for secondary surfaces
        "editor-border": "#27272a", // Soft subtle border color
        "editor-accent-blue": "#007acc", // Muted blue accent
        "editor-accent-purple": "#896AD8", // Subtle purple accent
        "editor-text": "#e0e0e0", // Clean white for UI text
        "editor-text-dim": "#a1a1aa", // Dimmed text for secondary information
        "editor-text-subtle": "#71717a", // Very subtle text

        vsc: {
          bg: "#1e1e1e",
          sidebar: "#181818",
          activitybar: "#181818",
          titlebar: "#181818",
          panel: "#1e1e1e",
          input: "#2a2a2a",
          border: "#2b2b2b",
          "border-focus": "#007acc",
          text: "#d4d4d4",
          "text-bright": "#e0e0e0",
          "text-dim": "#858585",
          "text-subtle": "#6a6a6a",
          accent: "#007acc",
          "accent-hover": "#1a8ad4",
          "accent-dim": "#264f78",
          "list-hover": "#2a2a2a",
          "list-active": "#2a2a2a",
          "selection": "#264f78",
          "scrollbar": "#424242",
          "scrollbar-hover": "#4f4f4f",
          "chat-user": "#202020",
          "token-keyword": "#569cd6",
          "token-string": "#ce9178",
          "token-number": "#b5cea8",
          "token-type": "#4ec9b0",
          "token-function": "#dcdcaa",
          "token-comment": "#6a9955",
          "token-variable": "#9cdcfe",
          "token-operator": "#d4d4d4",
          "token-tag": "#569cd6",
          "token-attr": "#9cdcfe",
          success: "#4ec9b0",
          warning: "#dcdcaa",
          error: "#f44747",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      letterSpacing: {
        tight: "-0.01em",
        normal: "0em",
        wide: "0.02em",
      },
    },
  },
  plugins: [],
};

export default config;

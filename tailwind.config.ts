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
        vsc: {
          bg: "#1e1e1e",           // Primary workspace background
          sidebar: "#181818",      // Left sidebar, file tree, right chat pane
          activitybar: "#181818",  // Activity bar (same as sidebar)
          titlebar: "#181818",     // Flat header bars (Cursor style)
          panel: "#1e1e1e",       // Bottom panel
          input: "#2a2a2a",       // Input / active tab background
          border: "#2b2b2b",      // Crisp 1px panel borders
          "border-focus": "#007acc", // Focus border
          text: "#d4d4d4",        // Off-white developer font color
          "text-bright": "#e0e0e0", // Brighter text
          "text-dim": "#858585",  // Dimmed / muted text
          "text-subtle": "#6a6a6a", // Very subtle text
          accent: "#007acc",      // Blue accent
          "accent-hover": "#1a8ad4", // Lighter blue on hover
          "accent-dim": "#264f78", // Dimmed accent for selections
          "list-hover": "#2a2a2a", // List item hover / active tab bg
          "list-active": "#2a2a2a", // Active list item
          "selection": "#264f78", // Text selection
          "scrollbar": "#424242", // Scrollbar thumb
          "scrollbar-hover": "#4f4f4f", // Scrollbar hover
          "chat-user": "#202020",  // User chat bubble / composer card bg
          // Syntax token colors (Cursor Dark)
          "token-keyword": "#569cd6",    // Blue - keywords
          "token-string": "#ce9178",     // Orange - strings
          "token-number": "#b5cea8",     // Green - numbers
          "token-type": "#4ec9b0",       // Teal - types
          "token-function": "#dcdcaa",   // Yellow - functions
          "token-comment": "#6a9955",    // Green - comments
          "token-variable": "#9cdcfe",   // Light blue - variables
          "token-operator": "#d4d4d4",   // White - operators
          "token-tag": "#569cd6",        // Blue - HTML tags
          "token-attr": "#9cdcfe",       // Light blue - attributes
          // Status colors
          success: "#4ec9b0",
          warning: "#dcdcaa",
          error: "#f44747",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "sans-serif",
        ],
        mono: [
          "'SF Mono'",
          "Menlo",
          "Monaco",
          "Consolas",
          "'Courier New'",
          "monospace",
        ],
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

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      // Weavy.ai inspired color palette
      colors: {
        // Background colors
        background: {
          DEFAULT: "#0a0a0f",
          secondary: "#0f0f15",
          tertiary: "#14141b",
          elevated: "#1a1a24",
          hover: "#1f1f2a",
        },
        // Surface colors (cards, panels)
        surface: {
          DEFAULT: "#12121a",
          secondary: "#18181f",
          border: "#2a2a35",
          "border-light": "#3a3a48",
        },
        // Primary accent (purple/violet)
        primary: {
          DEFAULT: "#8b5cf6",
          hover: "#7c3aed",
          light: "#a78bfa",
          dark: "#6d28d9",
          muted: "rgba(139, 92, 246, 0.15)",
        },
        // Secondary accent (pink/magenta)
        accent: {
          DEFAULT: "#ec4899",
          hover: "#db2777",
          light: "#f472b6",
          muted: "rgba(236, 72, 153, 0.15)",
        },
        // Success
        success: {
          DEFAULT: "#22c55e",
          light: "#4ade80",
          muted: "rgba(34, 197, 94, 0.15)",
        },
        // Warning
        warning: {
          DEFAULT: "#f59e0b",
          light: "#fbbf24",
          muted: "rgba(245, 158, 11, 0.15)",
        },
        // Error
        error: {
          DEFAULT: "#ef4444",
          light: "#f87171",
          muted: "rgba(239, 68, 68, 0.15)",
        },
        // Info/Cyan
        info: {
          DEFAULT: "#06b6d4",
          light: "#22d3ee",
          muted: "rgba(6, 182, 212, 0.15)",
        },
        // Text colors
        text: {
          primary: "#ffffff",
          secondary: "#a1a1aa",
          tertiary: "#71717a",
          muted: "#52525b",
        },
        // Node type colors
        node: {
          text: "#3b82f6",
          image: "#22c55e",
          video: "#a855f7",
          llm: "#f59e0b",
          crop: "#ec4899",
          frame: "#f97316",
        },
      },
      // Typography
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      // Spacing
      spacing: {
        sidebar: "280px",
        "sidebar-collapsed": "64px",
        toolbar: "56px",
        "history-panel": "320px",
      },
      // Border radius
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
      },
      // Box shadows
      boxShadow: {
        glow: "0 0 20px rgba(139, 92, 246, 0.3)",
        "glow-sm": "0 0 10px rgba(139, 92, 246, 0.2)",
        "glow-lg": "0 0 40px rgba(139, 92, 246, 0.4)",
        "glow-success": "0 0 20px rgba(34, 197, 94, 0.3)",
        "glow-error": "0 0 20px rgba(239, 68, 68, 0.3)",
        "glow-info": "0 0 20px rgba(6, 182, 212, 0.3)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)",
        "card-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)",
      },
      // Animations
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        glow: {
          "0%, 100%": {
            boxShadow: "0 0 15px 3px rgba(139, 92, 246, 0.4)",
          },
          "50%": {
            boxShadow: "0 0 25px 6px rgba(139, 92, 246, 0.6)",
          },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      // Backdrop blur
      backdropBlur: {
        xs: "2px",
      },
      // Z-index scale
      zIndex: {
        sidebar: "40",
        toolbar: "30",
        canvas: "10",
        modal: "50",
        tooltip: "60",
        dropdown: "45",
      },
    },
  },
  plugins: [],
};

export default config;

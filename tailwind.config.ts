import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0B1220", soft: "#131C30" },
        paper: "#F6F7FA",
        card: "#FFFFFF",
        border: { DEFAULT: "#E5E7EB", soft: "#EEF0F3" },
        text: { DEFAULT: "#0B1220", muted: "#5B6472", faint: "#9AA3B2" },
        brand: { DEFAULT: "#2563EB", dark: "#1D4ED8", light: "#60A5FA", soft: "#E9F0FE" },
        success: { DEFAULT: "#16A34A", soft: "#E5F6EA" },
        danger: { DEFAULT: "#DC2626", soft: "#FBE9E8" },
        warning: { DEFAULT: "#D97706", soft: "#FEF3E2" },
        achievement: { DEFAULT: "#B8860B", light: "#E8B923", soft: "#FBF3DC" },
      },
      fontFamily: {
        display: ["Inter", "-apple-system", "sans-serif"],
        sans: ["Inter", "-apple-system", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11, 18, 32, 0.04), 0 1px 12px rgba(11, 18, 32, 0.04)",
        popover: "0 8px 30px rgba(11, 18, 32, 0.14)",
      },
    },
  },
  plugins: [],
};
export default config;

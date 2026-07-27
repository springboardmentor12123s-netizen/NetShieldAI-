/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#0b0f1a",
        panel: "#111827",
        "panel-border": "#1f2937",
        accent: "#22d3ee",
        critical: "#f87171",
        warning: "#fbbf24",
        healthy: "#34d399",
      },
      fontFamily: {
        display: ["Rajdhani", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

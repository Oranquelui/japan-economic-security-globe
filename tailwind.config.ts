import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "night-950": "#030711",
        "night-900": "#06101d",
        "night-800": "#0a1727",
        "signal-energy": "#ff9f2f",
        "signal-rice": "#d9b45b",
        "signal-water": "#39c6ff",
        "signal-defense": "#d85d68",
        "signal-semi": "#49f0d0"
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      },
      boxShadow: {
        glow: "0 0 50px rgba(255, 159, 47, 0.24)"
      }
    }
  },
  plugins: []
};

export default config;

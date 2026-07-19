import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "var(--color-cream)",
        corgi: "var(--color-corgi)",
        brown: "var(--color-brown)",
        night: "var(--color-night)",
        ivory: "var(--color-ivory)",
        success: "var(--color-success)",
        danger: "var(--color-danger)",
        "success-text": "var(--color-success-text)",
        "danger-text": "var(--color-danger-text)",
        "corgi-text": "var(--color-corgi-text)",
      },
      borderRadius: {
        xl2: "1.5rem",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
    },
  },
  plugins: [],
} satisfies Config;

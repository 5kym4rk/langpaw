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

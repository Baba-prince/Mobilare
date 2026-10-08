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
        charcoal: "#1A1A1A",
        ink: "#0F1419",
        slate: "#1A2332",
        teal: {
          DEFAULT: "#0D6E7F",
          bright: "#00A8CC",
          soft: "rgba(13,110,127,0.1)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Outfit", "Inter", "sans-serif"],
      },
      boxShadow: {
        teal: "0 20px 40px rgba(13,110,127,0.35)",
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#0E5A46",
          "primary-dark": "#08382D",
          "primary-soft": "#DDF2EA",
          accent: "#F4C400",
          "accent-hover": "#D9AB00",
          "accent-soft": "#FFF4BF",
        },
        text: {
          primary: "#14201B",
          secondary: "#41514A",
          muted: "#6E7E76",
          inverse: "#FFFFFF",
        },
        bg: {
          page: "#F6F9F7",
          surface: "#FFFFFF",
          "surface-alt": "#EEF4F0",
        },
        border: {
          soft: "#D8E2DD",
          strong: "#B7C7C0",
        },
        state: {
          success: "#1F9D55",
          warning: "#D9822B",
          error: "#D64545",
          critical: "#8B5CF6",
          info: "#2F80ED",
        },
      },
      spacing: {
        18: "4.5rem",
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.625rem",
        lg: "1rem",
        xl: "1.5rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(20,32,27,0.08)",
        "card-hover": "0 8px 28px rgba(14,90,70,0.12)",
        focus: "0 0 0 3px rgba(244,196,0,0.28)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
      },
      transitionDuration: {
        150: "150ms",
        250: "250ms",
        400: "400ms",
      },
      transitionTimingFunction: {
        emphasized: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;

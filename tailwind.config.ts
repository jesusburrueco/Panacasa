import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#fefccf",
          dim: "#dedcb1",
          bright: "#fefccf",
          "container-lowest": "#ffffff",
          "container-low": "#f8f6c9",
          container: "#f2f0c4",
          "container-high": "#eceabe",
          "container-highest": "#e6e5b9",
          variant: "#e6e5b9",
        },
        "surface-tint": "#934b19",
        "on-surface": {
          DEFAULT: "#1d1d03",
          variant: "#54433a",
        },
        "inverse-surface": "#323214",
        "inverse-on-surface": "#f5f3c7",
        outline: {
          DEFAULT: "#877369",
          variant: "#dac2b6",
        },
        primary: {
          DEFAULT: "#6c2f00",
          container: "#8b4513",
        },
        "on-primary": {
          DEFAULT: "#ffffff",
          container: "#ffc29f",
        },
        "inverse-primary": "#ffb68c",
        secondary: {
          DEFAULT: "#5e604d",
          container: "#e1e1c9",
        },
        "on-secondary": {
          DEFAULT: "#ffffff",
          container: "#636451",
        },
        tertiary: {
          DEFAULT: "#523e00",
          container: "#6f5400",
        },
        "on-tertiary": {
          DEFAULT: "#ffffff",
          container: "#fec72c",
        },
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        },
        "on-error": {
          DEFAULT: "#ffffff",
          container: "#93000a",
        },
        "primary-fixed": {
          DEFAULT: "#ffdbc9",
          dim: "#ffb68c",
        },
        "on-primary-fixed": {
          DEFAULT: "#321200",
          variant: "#753401",
        },
        "secondary-fixed": {
          DEFAULT: "#e4e4cc",
          dim: "#c8c8b0",
        },
        "on-secondary-fixed": {
          DEFAULT: "#1b1d0e",
          variant: "#474836",
        },
        "tertiary-fixed": {
          DEFAULT: "#ffdf98",
          dim: "#f5bf22",
        },
        "on-tertiary-fixed": {
          DEFAULT: "#251a00",
          variant: "#5a4300",
        },
        background: "#fefccf",
        "on-background": "#1d1d03",
      },
      fontFamily: {
        serif: ["var(--font-eb-garamond)", "Georgia", "serif"],
        sans: ["var(--font-be-vietnam-pro)", "Helvetica", "Arial", "sans-serif"],
      },
      fontSize: {
        "display-lg": [
          "48px",
          { lineHeight: "56px", fontWeight: "600", letterSpacing: "-0.02em" },
        ],
        "display-lg-mobile": [
          "36px",
          { lineHeight: "42px", fontWeight: "600", letterSpacing: "-0.01em" },
        ],
        "headline-md": ["32px", { lineHeight: "40px", fontWeight: "500" }],
        "headline-sm": ["24px", { lineHeight: "32px", fontWeight: "500" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-md": [
          "14px",
          { lineHeight: "20px", fontWeight: "600", letterSpacing: "0.05em" },
        ],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },
      borderRadius: {
        sm: "0.5rem",
        DEFAULT: "1rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },
      spacing: {
        unit: "8px",
        "margin-mobile": "20px",
        "margin-desktop": "80px",
        gutter: "24px",
        "section-gap": "64px",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(139, 69, 19, 0.08)",
        "soft-lg": "0 10px 40px rgba(139, 69, 19, 0.12)",
        inset: "inset 0 2px 4px rgba(139, 69, 19, 0.08)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")({ strategy: "class" })],
};

export default config;

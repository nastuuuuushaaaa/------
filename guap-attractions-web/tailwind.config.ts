import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--main-background)",
        foreground: "var(--suai-default-color)",
        guap: {
          page: "var(--page-bg)",
          card: "var(--card-bg)",
          heading: "var(--text-heading)",
          pill: "var(--pill-bg)",
          hover: "var(--hover-bg)",
          input: "var(--input-bg)",
          link: "var(--link-color)",
          nav: "var(--header-bg)",
          muted: "var(--text-muted)",
        },
        suai: {
          brand: "var(--suai-brand-color-1)",
          button: "var(--suai-button-bg)",
          "brand-2": "#e72b70",
          "brand-3": "#ab3a8d",
          text: "var(--suai-default-color)",
          border: "var(--suai-default-border)",
          bg: "var(--page-bg)",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-open-sans)",
          '"Open Sans"',
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        suai: ["13px", { lineHeight: "1.5" }],
      },
      borderRadius: {
        suai: "0.75rem",
      },
      boxShadow: {
        suai: "var(--shadow-card)",
      },
    },
  },
  plugins: [],
};
export default config;

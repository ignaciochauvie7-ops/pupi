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
        brand: {
          DEFAULT: "#0c1929",
          50: "#e8eef4",
          100: "#c5d4e3",
          200: "#8fa8c4",
          300: "#5a7fa3",
          400: "#2d5a82",
          500: "#1a3d5c",
          600: "#122d47",
          700: "#0c1929",
          800: "#081420",
          900: "#050d16",
          950: "#020608",
        },
        accent: {
          DEFAULT: "#3b82f6",
          light: "#60a5fa",
          muted: "#1e4976",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
  safelist: [
    {
      pattern: /^(bg|text|border|ring|from|to|via)-(brand|accent)(-\w+)?$/,
    },
  ],
};

export default config;

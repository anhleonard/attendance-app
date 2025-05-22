import type { Config } from "tailwindcss";
import { PluginAPI } from "tailwindcss/types/config";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js"],
  theme: {
    extend: {
      colors: {
        transparent: "transparent",
        white: "#fff",
        grey: {
          c900: "#454545", //95C7D6
          c800: "#585858",
          c700: "#646464",
          c600: "#767676",
          c500: "#898989",
          c400: "#979797",
          c300: "#ACACAC",
          c200: "#C6C6C6",
          c100: "#E2DFDF",
          c50: "#F0F0F0",
        },
        primary: {
          c900: "#6580A9",
          c800: "#6E88B0",
          c700: "#7E98BF",
          c600: "#8AA2C6",
          c500: "#9FB3D0",
          c400: "#AEC0DB",
          c300: "#C0D0E8",
          c200: "#CFDEF4",
          c100: "#E2EBF8",
          c50: "#F1F6FE",
          c10: "#F8FBFF",
        },
        support: {
          c900: "#B31919",
          c800: "#C21E1E",
          c700: "#CF2929",
          c600: "#E03030",
          c500: "#F13232",
          c400: "#F64343",
          c300: "#FB5C5C",
          c200: "#FF7676",
          c100: "#FF9191",
          c50: "#FFB2B2",
          c10: "#FFEEEE",
        },
        success: {
          c900: "#1B5E20",
          c800: "#2E7D32",
          c700: "#388E3C",
          c600: "#43A047",
          c500: "#4CAF50",
          c400: "#66BB6A",
          c300: "#81C784",
          c200: "#A5D6A7",
          c100: "#C8E6C9",
          c50: "#E8F5E9",
        },
        secondary: {
          c900: "#FF5C00",
          c800: "#FE630B",
          c700: "#FE6D1C",
          c600: "#FF7426",
          c500: "#FF7B31",
          c400: "#FF8743",
          c300: "#FF9458",
          c200: "#FFAB7B",
          c100: "#FFBC97",
          c50: "#FFCEB3",
        },
        dk: {
          primary: {
            c50: "#F4F9FB",
            c700: "#2D7D9F",
          },
          grey: {
            c700: "#575757",
            c800: "#323232",
          },
        },
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "4.5": "18px",
        "5": "20px",
        "6": "24px",
        "7": "28px",
        "8": "32px",
        "9": "36px",
        "10": "40px",
      },
      fontFamily: {
        questrial: ["var(--font-questrial)", "sans-serif"],
        urbanist: ["Urbanist", "sans-serif"],
        sourceSans3: ["var(--font-source-sans-3)", "sans-serif"],
      },
      // fontWeight: {
      //   thin: "100",
      //   extralight: "200",
      //   light: "300",
      //   normal: "400",
      //   medium: "500",
      //   semibold: "600",
      //   bold: "700",
      //   extrabold: "800",
      //   blackbold: "900",
      // },
      keyframes: {
        "zoom-out": {
          from: {
            transform: "scale(1.2)",
            opacity: "0",
          },
          to: {
            transform: "scale(1)",
            opacity: "1",
          },
        },
      },
    },
    fontSize: {
      xs: [
        "0.75rem" /* 12px */,
        {
          lineHeight: "1rem" /* 16px */,
        },
      ],
      sm: [
        "0.875rem" /* 14px */,
        {
          lineHeight: "1.25rem" /* 20px */,
        },
      ],
      base: [
        "1rem" /* 16px */,
        {
          lineHeight: "1.5rem" /* 24px */,
        },
      ],
      lg: [
        "1.125rem" /* 18px */,
        {
          lineHeight: "1.75rem" /* 28px */,
        },
      ],
      xl: [
        "1.25rem" /* 20px */,
        {
          lineHeight: "1.75rem" /* 28px */,
        },
      ],
      "2xl": [
        "1.5rem" /* 24px */,
        {
          lineHeight: "2rem" /* 32px */,
        },
      ],
      "3xl": [
        "1.875rem" /* 30px */,
        {
          lineHeight: "2.25rem" /* 36px */,
        },
      ],
      "4xl": [
        "2.25rem" /* 36px */,
        {
          lineHeight: "2.5rem" /* 40px */,
        },
      ],
      "5xl": [
        "3rem" /* 48px */,
        {
          lineHeight: "1rem",
        },
      ],
      "6xl": [
        "3.75rem" /* 60px */,
        {
          lineHeight: "1",
        },
      ],
      "7xl": [
        "4.5rem" /* 72px */,
        {
          lineHeight: "1",
        },
      ],
      "8xl": [
        "6rem" /* 96px */,
        {
          lineHeight: "1",
        },
      ],
      "9xl": [
        "8rem" /* 128px */,
        {
          lineHeight: "1rem",
        },
      ],
    },
  },
  plugins: [],
} satisfies Config;

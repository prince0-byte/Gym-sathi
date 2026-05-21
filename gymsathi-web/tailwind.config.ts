import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: { 500: "#14b8a6", 600: "#0d9488" }
      },
    },
  },
  plugins: [],
};
export default config;

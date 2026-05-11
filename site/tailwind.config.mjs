/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            "pre code": {
              backgroundColor: "transparent",
              borderRadius: "0",
              padding: "0",
              fontSize: "inherit",
              color: "inherit",
              fontWeight: "inherit",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

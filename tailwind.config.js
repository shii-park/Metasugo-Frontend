/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brown: {
          DEFAULT: "#CBB994",
          light: "#E3DECF",
        },
        blue: {
          DEFAULT: "#5B7BA6",
        },
        red: {
          DEFAULT: "#A65B5B",
        },
        yellow: {
          DEFAULT: "#DDDB6C",
        },
        green: {
          DEFAULT: "#94CB99",
        },
        pink: {
          DEFAULT: "#DC6BA2",
        },
        gray: {
          light: "#E2DED6",
        },
      },
    },
    screens: {
      portrait: { raw: "(orientation: portrait)" },
      landscape: { raw: "(orientation: landscape)" },
    },
  },
  plugins: [],
};

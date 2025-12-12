/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        swiftPayBlue: "#1400FB",
        swiftPurple: "#4537e6",
        danger: "#CC1212",
        dangerBg: "#fde8e8",
        red: "#c81e1e",
        greenText: "#046c4e",
        blue: {
          100: "#e1effe",
          600: "#0000ff",
          700: "#1D4ED8",
        },
        gray: {
          100: "#F3F3F3",
          200: "#6A6A6A",
          300: "#555555",
        },
      },
    },
  },
  plugins: [],
};

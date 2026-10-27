/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#171613",
        muted: "#77736C",
        paper: "#F8F7F4",
        gold: "#B8860B",
        "gold-light": "#E3B448",
        "pale-gold": "#FDF1DD",
        line: "#EAE7E1",
      },
    },
  },
  plugins: [],
};
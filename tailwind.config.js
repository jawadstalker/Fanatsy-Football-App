/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        base: "#08110D",
        surface: "#101C15",
        elevated: "#17271D",
        line: "#26382C",
        turf: "#A3E635",
        turfdim: "#52752D",
        gold: "#F4C96B",
        ink: "#F4F7F1",
        muted: "#91A397",
        danger: "#F07868",
      },
      fontFamily: {
        display: ["Oswald_500Medium"],
        "display-bold": ["Oswald_700Bold"],
        body: ["Vazirmatn_400Regular"],
        "body-medium": ["Vazirmatn_600SemiBold"],
      },
    },
  },
  plugins: [],
};

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
        base: "#0D1512",
        surface: "#141F19",
        elevated: "#1B2A21",
        line: "#28372C",
        turf: "#79B34C",
        turfdim: "#3E5A34",
        gold: "#E3B34B",
        ink: "#F3F4EE",
        muted: "#8FA093",
        danger: "#D9695A",
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

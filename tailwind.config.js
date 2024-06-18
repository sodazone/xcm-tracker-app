/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        noto: ["Noto Sans Mono", "monospace"],
      },
      colors: {
        transparent: "transparent",
        current: "currentColor",
        white: "#EEEEEE",
        midnight: "#121063",
        metal: "#565584",
        tahiti: "#3ab7bf",
        silver: "#ecebff",
        "bubble-gum": "#ff77e9",
        bermuda: "#78dcca",
        deep: "#212121",
        teal: "#76ABAE",
        "dot-pink": "#E6007A",
        "dot-purple": "#552BBF",
        "dot-cyan": "#00B2FF",
      },
    },
  },
  plugins: [],
};

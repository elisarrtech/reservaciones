import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#131B2B",
        sand: "#F8F3E8",
        coral: "#E17855",
        mist: "#E7EDF4",
        pine: "#36534E"
      },
      boxShadow: {
        panel: "0 20px 45px -20px rgba(19, 27, 43, 0.35)"
      },
      fontFamily: {
        title: ["'Bricolage Grotesque'", "sans-serif"],
        body: ["'Manrope'", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;


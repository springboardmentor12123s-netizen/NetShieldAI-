/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#08111f",
        panel: "#101c2e",
        cyan: "#39d9c8",
      },
      boxShadow: {
        glow: "0 0 28px rgba(57, 217, 200, 0.14)",
      },
    },
  },
  plugins: [],
};

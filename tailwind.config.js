/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ponytail: 3-token palette; expand when a real brand kit lands
        brand: { 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca" },
        done: "#10b981",
        current: "#f59e0b",
        goal: "#ef4444",
        stage: {
          0: "#3b82f6",
          1: "#8b5cf6",
          2: "#ec4899",
          3: "#f97316",
          4: "#10b981",
          5: "#14b8a6",
          6: "#6366f1",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

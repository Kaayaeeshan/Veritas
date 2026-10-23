/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // A confident, clinical cobalt-navy -- calm and trustworthy without
        // reading as generic "Bootstrap blue". Paired with the existing gold
        // accent (kept unchanged: it already carries meaning via the Trust
        // Ring and star ratings, and blue+gold is a classic, credible pair
        // for a healthcare brand).
        primary: { DEFAULT: "#14538C", dark: "#0B3760", light: "#DCE9F5" },
        gold: { DEFAULT: "#C9962E", soft: "#F6EBD4" },
        alert: { DEFAULT: "#B6482F", soft: "#F7E4DE" },
        success: "#2E7D53",
        // Neutrals shifted to a cool blue-gray family to match the new
        // primary -- carrying over the old warm/green-tinted neutrals would
        // fight the blue rather than support it.
        ink: "#16202B",
        muted: "#5C6B78",
        line: "#DCE3EA",
        surface: { DEFAULT: "#FFFFFF", alt: "#EDF2F7" },
        canvas: "#F5F7FA",
      },
     fontFamily: {
        display: ["Roboto", "sans-serif"],    // headings
        body: ["Poppins", "sans-serif"],      // body text
        mono: ["Ubuntu Mono", "monospace"],   // code blocks
       },

    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Senin mevcut renklerin (Zikirmatik ile uyumlu)
        islamic: {
          green: '#044d29',
          gold: '#D4AF37',
          dark: '#021a0f', // Zikirmatik arka planı için ekstra bir ton ekledim (Opsiyonel kullanım için)
        },
        cream: {
          bg: '#FFFDF5',
          DEFAULT: '#FFFDF5'
        },
        // Shadcn UI Renkleri (Mevcut ayarların)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        // BURAYA DİKKAT: Amiri fontunu ekledim, Zikirmatik'teki Arapça/Osmanlı havası için.
        serif: ['Amiri', 'Playfair Display', 'serif'],
        // Header başlığı için native sistem fontu (iOS'ta SF Pro, Android'de Roboto)
        display: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
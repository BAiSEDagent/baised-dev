import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          1: '#0A0A0A',
          2: '#111111',
          3: '#171717',
        },
        border: {
          1: '#1A1A1A',
          2: '#262626',
          3: '#333333',
        },
        text: {
          primary: '#EDEDED',
          secondary: '#A1A1A1',
          tertiary: '#787878',
          muted: '#444444',
        },
        accent: {
          blue: '#0052FF',
          'blue-hover': '#3380FF',
          green: '#00C853',
          amber: '#FFB000',
          red: '#FF3B30',
        },
      },
      maxWidth: {
        content: '768px',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      fontSize: {
        display: ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.04em', fontWeight: '700' }],
        h1: ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        h2: ['0.875rem', { lineHeight: '1.3', letterSpacing: '0.05em', fontWeight: '600' }],
        body: ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
        caption: ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
        micro: ['0.625rem', { lineHeight: '1.2', letterSpacing: '0.08em', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
};
export default config;

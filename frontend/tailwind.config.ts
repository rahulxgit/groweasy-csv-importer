import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#EF7B45',
          hover: '#E0672F',
        },
        ink: '#1F2328',
        muted: '#6B7280',
        border: '#E5E7EB',
      },
    },
  },
  plugins: [],
};

export default config;

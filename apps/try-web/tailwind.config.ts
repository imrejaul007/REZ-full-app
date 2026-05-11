import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#7C3AED',
          orange: '#F97316',
          nileBlue: '#1a3a52',
          goldAccent: '#FFC857',
        },
        nileBlue: '#1a3a52',
      },
    },
  },
  plugins: [],
}
export default config

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}', // Include pages directory if you have one
    './src/components/**/*.{js,ts,jsx,tsx,mdx}', // Include components directory
    './src/app/**/*.{js,ts,jsx,tsx,mdx}', // Include app directory
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      // You can add your custom theme extensions here
      // For example: colors, fonts, spacing, etc.
    },
  },
  plugins: [],
};
export default config; 
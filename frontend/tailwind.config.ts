import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      // You can add your custom theme extensions here
      // For example: colors, fonts, spacing, etc.
      animation: {
        'marquee': 'marquee 25s linear infinite',
        'scanOnce': 'scanOnce 2s ease forwards',
        'scanDown': 'scanDown 4s ease-in-out forwards',
        'highlight1': 'highlight 0.4s ease-in forwards 2.2s',
        'highlight2': 'highlight 0.4s ease-in forwards 2.6s', 
        'contractToList': 'contractToList 0.8s ease-out forwards 3s',
        'showResults': 'showResults 0.8s ease-out forwards 3.2s',
        'fadeInUp': 'fadeInUp 0.6s ease-out forwards',
        'pulse': 'pulse 2s infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        scanOnce: {
          '0%': { top: '0', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { top: '100%', opacity: '0' },
        },
        scanDown: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '10%': { transform: 'translateY(0)', opacity: '1' },
          '90%': { transform: 'translateY(300px)', opacity: '1' },
          '100%': { transform: 'translateY(350px)', opacity: '0' }
        },
        highlight: {
          '0%': { opacity: '0', borderLeftWidth: '0', paddingLeft: '0' },
          '100%': { opacity: '1', borderLeftWidth: '4px', paddingLeft: '0.75rem' },
        },
        contractToList: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(0.97)', opacity: '0.8' },
          '100%': { transform: 'scale(0.95)', opacity: '0.7' },
        },
        showResults: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
};

export default config; 
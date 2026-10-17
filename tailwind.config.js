/** MODARA tokens, taken from the marketing site (mmd/src/index.css). */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#07111F', 2: '#0D1B2A' },
        brand: { DEFAULT: '#2563EB', strong: '#1D4ED8' },
        cyan: { DEFAULT: '#22D3EE' },
        emerald: { DEFAULT: '#10B981' },
        amber: { DEFAULT: '#F59E0B' },
        ink: { DEFAULT: '#0F172A', soft: '#475569' },
        line: '#E2E8F0',
        offwhite: '#F8FAFC',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { sm: '10px', DEFAULT: '16px', lg: '24px' },
      boxShadow: {
        sm: '0 1px 2px rgba(7,17,31,.06)',
        md: '0 10px 30px rgba(7,17,31,.1)',
        lg: '0 24px 60px rgba(7,17,31,.16)',
      },
    },
  },
};

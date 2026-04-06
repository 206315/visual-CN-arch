/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* 中式暗黑配色体系 */
        imperial: {
          gold: '#C5A55A',       // 皇家金
          red: '#8B2500',        // 朱砂红
          crimson: '#DC143C',    // 妃红
          dark: '#0A0A0F',       // 墨玉黑
          deeper: '#050508',     // 深渊黑
          wood: '#3E2723',       // 紫檀木
          jade: '#2E7D5F',       // 翡翠绿
          ink: '#1A1A2E',        // 墨色
          paper: '#F5E6C8',      // 宣纸色
          bronze: '#8B7355',     // 青铜色
        },
      },
      fontFamily: {
        song: ['"Noto Serif SC"', 'serif'],
        kai: ['"LXGW WenKai"', 'cursive'],
      },
      backgroundImage: {
        'ink-wash': 'radial-gradient(ellipse at top, #1A1A2E 0%, #0A0A0F 70%)',
        'gold-gradient': 'linear-gradient(135deg, #C5A55A 0%, #8B7355 50%, #C5A55A 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { textShadow: '0 0 5px #C5A55A, 0 0 10px #C5A55A' },
          '100%': { textShadow: '0 0 20px #C5A55A, 0 0 40px #C5A55A' },
        },
      },
    },
  },
  plugins: [],
};

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"SF Pro Display"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
      colors: {
        // 主灰度系统 —— Zinc 方向
        surface: {
          0: '#ffffff',
          50: '#fafafa',
          100: '#f5f5f5',
          150: '#f0f0f0',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Accent —— 极克制的蓝
        accent: {
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#c2d8ff',
          300: '#94bbff',
          400: '#5c9aff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // 语义化颜色别名（向后兼容，逐步迁移）
        resume: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'floating': '0 8px 24px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        'card': '10px',
        'button': '8px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        'sidebar': '200px',
        'rightbar': '280px',
      },
      fontSize: {
        'h1': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'h2': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'h3': ['15px', { lineHeight: '22px', fontWeight: '500' }],
        'body': ['14px', { lineHeight: '22px' }],
        'caption': ['13px', { lineHeight: '20px' }],
        'small': ['12px', { lineHeight: '18px' }],
        'micro': ['11px', { lineHeight: '16px' }],
      },
    },
  },
  plugins: [],
};

export default config;

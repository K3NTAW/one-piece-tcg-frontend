/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // One Piece Inspired Colors
        'straw-hat-red': '#E53E3E',
        'straw-hat-orange': '#FF8C00',
        'straw-hat-yellow': '#FFD700',
        'straw-hat-green': '#38A169',
        'straw-hat-blue': '#3182CE',
        'straw-hat-purple': '#805AD5',
        'straw-hat-pink': '#E91E63',
        'straw-hat-black': '#2D3748',
        'straw-hat-white': '#F7FAFC',
        'straw-hat-gray': '#718096',
        
        // TCG Card Colors
        'card-red': '#DC2626',
        'card-green': '#059669',
        'card-blue': '#2563EB',
        'card-purple': '#7C3AED',
        'card-black': '#1F2937',
        'card-yellow': '#D97706',
        
        // Rarity Colors
        'rarity-common': '#9CA3AF',
        'rarity-uncommon': '#10B981',
        'rarity-rare': '#3B82F6',
        'rarity-super-rare': '#8B5CF6',
        'rarity-secret-rare': '#F59E0B',
        'rarity-leader': '#EF4444',
        'rarity-promo': '#EC4899',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'card-draw': 'cardDraw 0.5s ease-out',
        'card-play': 'cardPlay 0.3s ease-out',
        'card-attack': 'cardAttack 0.4s ease-out',
        'card-destroy': 'cardDestroy 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        cardDraw: {
          '0%': { transform: 'translateY(-100px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        cardPlay: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        cardAttack: {
          '0%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(10px)' },
          '100%': { transform: 'translateX(0)' },
        },
        cardDestroy: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}

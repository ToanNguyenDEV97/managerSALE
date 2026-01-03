// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // ĐỊNH NGHĨA HỆ MÀU CHUẨN TẠI ĐÂY
      colors: {
        // Màu chủ đạo (Primary - Dùng cho nút chính, link, điểm nhấn)
        // Đây là một tone xanh indigo hiện đại, chuyên nghiệp.
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', // Màu chính
          600: '#4f46e5', // Màu hover
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Màu lỗi/nguy hiểm (Danger - Dùng cho nút xóa, báo lỗi)
        danger: {
           50: '#fef2f2',
          100: '#fee2e2',
          // ... bạn có thể dùng bảng màu red mặc định của tailwind hoặc định nghĩa lại
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        // Màu thành công (Success)
        success: {
          500: '#22c55e',
          600: '#16a34a',
        }
        // Các màu slate (xám) giữ nguyên mặc định của Tailwind
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          'from': { opacity: 0, transform: 'translateY(-10px)' },
          'to': { opacity: 1, transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
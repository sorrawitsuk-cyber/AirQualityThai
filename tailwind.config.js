/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 👇 เพิ่มตั้งค่า fontFamily ตรงนี้ครับ
      fontFamily: {
        sans: ['Kanit', 'sans-serif'], 
      },
    },
  },
  plugins: [],
}
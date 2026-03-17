import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // สร้างเส้นทางจำลองชื่อ /api-air
      '/api-air': {
        target: 'http://air4thai.pcd.go.th', // เป้าหมายที่แท้จริงที่เราจะไปดึงข้อมูล
        changeOrigin: true, // หลอก Server ปลายทางว่าเรามาจากโดเมนเดียวกัน
        rewrite: (path) => path.replace(/^\/api-air/, '') // ตัดคำว่า /api-air ออกก่อนส่งไปที่ Air4Thai
      }
    }
  }
})
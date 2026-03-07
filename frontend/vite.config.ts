import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/test/setup.ts',
    },
    plugins: [
        react(),
        tailwindcss(),
    ],
    server: {
        proxy: {
            "/promptvault": {
                target: "http://localhost:8080",
                changeOrigin: true,
                cookieDomainRewrite: "localhost",
            }
        }
    },
})

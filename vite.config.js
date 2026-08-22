import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    // Плагины (можно добавить @vitejs/plugin-basic-ssl для HTTPS)
    plugins: [],
    
    // Сервер разработки
    server: {
        port: 3000,
        open: true,
        host: true  // Доступ по локальной сети
    },
    
    // Настройки сборки
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
        minify: 'esbuild',
        rollupOptions: {
            output: {
                manualChunks: {
                    three: ['three'],
                    vendor: ['@vitejs/plugin-basic-ssl']
                }
            }
        }
    },
    
    // Алиасы для удобных импортов
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@core': path.resolve(__dirname, './src/core'),
            '@components': path.resolve(__dirname, './src/components'),
            '@three': path.resolve(__dirname, './src/three'),
            '@data': path.resolve(__dirname, './src/data'),
            '@assets': path.resolve(__dirname, './src/assets')
        }
    },
    
    // Оптимизация зависимостей
    optimizeDeps: {
        include: ['three']
    }
});
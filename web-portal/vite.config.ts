import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          
          // Material-UI libraries
          if (id.includes('@mui/material') || id.includes('@mui/icons-material') || id.includes('@mui/lab')) {
            return 'mui-vendor';
          }
          
          // Router and navigation
          if (id.includes('react-router') || id.includes('@tanstack/react-router')) {
            return 'router-vendor';
          }
          
          // State management
          if (id.includes('zustand') || id.includes('@tanstack/react-query')) {
            return 'state-vendor';
          }
          
          // Charts and visualization
          if (id.includes('recharts') || id.includes('chart.js') || id.includes('d3')) {
            return 'charts-vendor';
          }
          
          // Maps and location services
          if (id.includes('google') || id.includes('maps') || id.includes('geolocation')) {
            return 'maps-vendor';
          }
          
          // Utility libraries
          if (id.includes('lodash') || id.includes('moment') || id.includes('date-fns') || id.includes('axios')) {
            return 'utils-vendor';
          }
          
          // Socket.io and real-time features
          if (id.includes('socket.io') || id.includes('ws')) {
            return 'socket-vendor';
          }
          
          // Large components that can be lazy loaded
          if (id.includes('Dashboard') || id.includes('Analytics')) {
            return 'dashboard-components';
          }
          
          if (id.includes('Orders') || id.includes('Deliveries')) {
            return 'order-components';
          }
          
          if (id.includes('Tracking') || id.includes('Maps')) {
            return 'tracking-components';
          }
          
          // Default vendor chunk for other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Optimize chunk names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `js/[name]-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `css/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});

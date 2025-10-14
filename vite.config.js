import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isGamingPlatform = mode === 'gaming'
  
  return {
    plugins: [react()],
    
    // Base URL configuration
    base: isGamingPlatform ? './' : '/',
    
    build: {
      // Output directory
      outDir: isGamingPlatform ? 'dist-gaming' : 'dist',
      
      // Optimize for production
      minify: 'terser',
      sourcemap: false,
      
      rollupOptions: {
        output: {
          // Organize output files
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
      
      // Asset handling
      assetsInlineLimit: 4096, // Inline assets smaller than 4kb
      
      // Performance optimizations
      chunkSizeWarningLimit: 1000,
    },
    
    // Preview server configuration
    preview: {
      port: 4173,
      open: true,
    },
    
    // Development server configuration
    server: {
      port: 5173,
      open: true,
    },
  }
})

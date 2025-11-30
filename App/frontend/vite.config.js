import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // if using React

export default defineConfig({
  plugins: [react()],
  
  server: {
    // 1. Host settings for Nginx proxying
    host: '0.0.0.0', // Listen on all network interfaces
    allowedHosts: [
      'team18.cpsc4911.com', 
      '3.229.166.87' 
    ],
    
    // 2. Your original port setting (CHECK: Should this be 5173 or 3000?)
    port: 3000, 
    
    // 3. Your original API proxy configuration
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request:', req.method, req.url);
          });
        },
      },
    },
  },
  // **********************************************
});
export default {
  build: {
    sourcemap: true,
  },
  server: {
    host: true,
    allowedHosts: ["cachy.tailf64956.ts.net"],
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
 };

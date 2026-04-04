const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const basicSsl = require('@vitejs/plugin-basic-ssl');

// https://vitejs.dev/config/
module.exports = defineConfig(() => {
  // Electron开发模式不使用HTTPS，手机AR模式使用HTTPS
  const isElectronDev = process.env.ELECTRON === 'true';

  console.log('Vite config - ELECTRON:', process.env.ELECTRON);
  console.log('Vite config - isElectronDev:', isElectronDev);

  return {
    plugins: isElectronDev
      ? [react()]  // Electron: 无HTTPS
      : [react(), basicSsl()],  // 手机AR: 有HTTPS
    server: {
      port: 3000,
      host: true,
      https: !isElectronDev,  // Electron用HTTP，手机用HTTPS
      fs: {
        strict: false,
      },
    },
    preview: {
      port: 3000,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ancient.architecture.viz',
  appName: '匠心永驻',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'https://ajax.googleapis.com',
      'https://modelviewer.dev',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ],
    hostname: 'ancient-architecture-viz'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    useLegacyBridge: false,
    buildOptions: {
      keystorePath: '',
      keystoreAlias: ''
    }
  },
  plugins: {
    CapacitorCookies: {
      enabled: true
    },
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;

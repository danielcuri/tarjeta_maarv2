import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tarjeta.maar.jjc.simplex',
  appName: 'Tarjeta Maar - JJC',
  webDir: 'www',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK', 
      backgroundColor: '#ffffff',
    }
  }
};

export default config;

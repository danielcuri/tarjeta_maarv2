import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tarjeta.maar.jjc',
  appName: 'Tarjeta MAAR - JJC',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    iosScheme:'https',
    cleartext: true,
  }
};

export default config;


import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.829112dbae2e4b2a8ef836cbe2db2b2d',
  appName: 'Transporte Maneiro',
  webDir: 'dist',
  server: {
    url: 'https://829112db-ae2e-4b2a-8ef8-36cbe2db2b2d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Geolocation: {
      requestPermissions: true,
      accuracy: "high"
    }
  }
};

export default config;

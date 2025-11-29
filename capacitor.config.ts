import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.8eedd528faf5473ba997f111735cf9e1',
  appName: 'EduKI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Descomente para desenvolvimento com hot-reload
    // url: 'https://8eedd528-faf5-473b-a997-f111735cf9e1.lovableproject.com?forceHideBadge=true',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#6366f1",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;

// Unified Unity Ads type definitions for Web SDK
// This file should be the ONLY place declaring Window.UnityAds

export interface UnityAdsWebSDK {
  init: (config: { gameId: string; testMode?: boolean; debug?: boolean }) => void;
  load: (placementId: string) => void;
  isReady: (placementId: string) => boolean;
  show: (
    placementId: string,
    callbacks: {
      onStart?: () => void;
      onComplete?: (rewarded: boolean) => void;
      onError?: (error: unknown) => void;
      onClose?: () => void;
    }
  ) => void;
  // Banner methods (may not be available in all SDK versions)
  loadBanner?: (options: { placementId: string }) => void;
  showBanner?: (options: { placementId: string; position: string }) => void;
  hideBanner?: () => void;
}

declare global {
  interface Window {
    UnityAds?: UnityAdsWebSDK;
  }
}

export {};

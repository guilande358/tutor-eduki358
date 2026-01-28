import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Crown, X } from "lucide-react";
import { Capacitor } from "@capacitor/core";

declare global {
  interface Window {
    UnityAds?: {
      init: (options: { gameId: string; testMode?: boolean }) => void;
      loadBanner: (options: { placementId: string }) => void;
      showBanner: (options: { placementId: string; position: string }) => void;
      hideBanner: () => void;
    };
  }
}

interface UnityAdsBannerProps {
  userId: string;
  position?: "top" | "bottom";
  onPremiumClick?: () => void;
}

const UNITY_GAME_ID = "5993995";
const UNITY_PLACEMENT_ID = "Banner_Android";

const UnityAdsBanner = ({ userId, position = "bottom", onPremiumClick }: UnityAdsBannerProps) => {
  const [isPremium, setIsPremium] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const bannerContainerRef = useRef<HTMLDivElement>(null);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    const checkPremium = async () => {
      const { data } = await supabase
        .from("user_progress")
        .select("is_premium")
        .eq("user_id", userId)
        .maybeSingle();

      const premium = data?.is_premium ?? false;
      setIsPremium(premium);
      setIsVisible(!premium);
    };

    checkPremium();

    const channel = supabase
      .channel(`premium-check-banner-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_progress",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const premium = (payload.new as any).is_premium ?? false;
          setIsPremium(premium);
          setIsVisible(!premium);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Initialize Unity Ads SDK for web
  useEffect(() => {
    if (isPremium || !isVisible || isNative) return;

    const loadUnityAds = async () => {
      // Check if already loaded
      if (window.UnityAds) {
        initializeAds();
        return;
      }

      // Load Unity Ads Web SDK
      const script = document.createElement("script");
      script.src = "https://ads.unity3d.com/web/v3.3/unityads.js";
      script.async = true;
      script.onload = () => {
        initializeAds();
      };
      script.onerror = () => {
        console.error("Failed to load Unity Ads SDK");
        setAdLoaded(false);
      };
      document.body.appendChild(script);
    };

    const initializeAds = () => {
      if (window.UnityAds) {
        try {
          window.UnityAds.init({ gameId: UNITY_GAME_ID, testMode: false });
          window.UnityAds.loadBanner({ placementId: UNITY_PLACEMENT_ID });
          setAdLoaded(true);
        } catch (error) {
          console.error("Failed to initialize Unity Ads:", error);
        }
      }
    };

    loadUnityAds();

    return () => {
      if (window.UnityAds) {
        try {
          window.UnityAds.hideBanner();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [isPremium, isVisible, isNative]);

  // For native, use Capacitor Unity Ads plugin
  useEffect(() => {
    if (isPremium || !isVisible || !isNative) return;

    const initNativeAds = async () => {
      try {
        const { UnityAds } = await import("capacitor-unity-ads");
        await UnityAds.initialize({ gameId: UNITY_GAME_ID, testMode: false });
        await UnityAds.loadBanner({ placementId: UNITY_PLACEMENT_ID });
        await UnityAds.showBanner({ placementId: UNITY_PLACEMENT_ID, position: position === "top" ? "top" : "bottom" });
        setAdLoaded(true);
      } catch (error) {
        console.error("Failed to initialize native Unity Ads:", error);
      }
    };

    initNativeAds();

    return () => {
      const cleanupNativeAds = async () => {
        try {
          const { UnityAds } = await import("capacitor-unity-ads");
          await UnityAds.hideBanner();
        } catch (e) {
          // Ignore cleanup errors
        }
      };
      cleanupNativeAds();
    };
  }, [isPremium, isVisible, isNative, position]);

  if (isPremium || !isVisible) return null;

  return (
    <div
      ref={bannerContainerRef}
      className={`fixed left-0 right-0 z-40 flex items-center justify-center bg-gradient-to-r from-muted/95 to-muted/90 backdrop-blur-sm border-border/50 ${
        position === "top" ? "top-0 border-b" : "bottom-0 border-t"
      }`}
      style={{ 
        height: "60px", 
        paddingBottom: position === "bottom" ? "env(safe-area-inset-bottom)" : undefined 
      }}
      role="banner"
      aria-label="Anúncio"
    >
      <div className="flex items-center gap-3 px-4 w-full max-w-md justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
            📢 AD
          </span>
          {adLoaded ? (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Anúncio ativo
            </span>
          ) : (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Carregando anúncio...
            </span>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1.5 text-primary hover:text-primary/80 hover:bg-primary/10"
          onClick={onPremiumClick}
        >
          <Crown className="w-3.5 h-3.5" />
          Remover anúncios
        </Button>
      </div>
    </div>
  );
};

export default UnityAdsBanner;

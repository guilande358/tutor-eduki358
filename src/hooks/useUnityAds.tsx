import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { useToast } from "@/components/ui/use-toast";

interface AdStats {
  totalWatched: number;
  todayWatched: number;
  rewardsEarned: number;
  lastWatched: Date | null;
}

const UNITY_GAME_ID = "5993995";
const UNITY_PLACEMENT_ID = "Rewarded_Android";

export const useUnityAds = (userId: string) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAdReady, setIsAdReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adStats, setAdStats] = useState<AdStats>({
    totalWatched: 0,
    todayWatched: 0,
    rewardsEarned: 0,
    lastWatched: null,
  });
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  // Load ad statistics from database
  const loadAdStats = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data: allAds } = await supabase
      .from("ad_impressions")
      .select("*")
      .eq("user_id", userId);

    const { data: todayAds } = await supabase
      .from("ad_impressions")
      .select("*")
      .eq("user_id", userId)
      .gte("watched_at", today);

    if (allAds) {
      const rewardsEarned = allAds.filter((ad) => ad.reward_claimed).length;
      setAdStats({
        totalWatched: allAds.length,
        todayWatched: todayAds?.length || 0,
        rewardsEarned,
        lastWatched: allAds.length > 0 
          ? new Date(allAds[allAds.length - 1].watched_at) 
          : null,
      });
    }
  }, [userId]);

  // Initialize Unity Ads
  useEffect(() => {
    const initialize = async () => {
      if (isNative) {
        try {
          const { UnityAds } = await import("capacitor-unity-ads");
          
          await UnityAds.initialize({
            gameId: UNITY_GAME_ID,
            testMode: false,
          });

          setIsInitialized(true);
          console.log("Unity Ads initialized (native)");

          // Pre-load first ad
          await UnityAds.loadRewardedVideo({ placementId: UNITY_PLACEMENT_ID });
          
          // Check if ad is loaded
          const checkLoaded = async () => {
            const { loaded } = await UnityAds.isRewardedVideoLoaded();
            setIsAdReady(loaded);
          };

          checkLoaded();
          const interval = setInterval(checkLoaded, 2000);
          
          return () => clearInterval(interval);
        } catch (error) {
          console.error("Unity Ads init error (native):", error);
        }
      } else {
        // Web fallback - Unity Ads Web SDK
        if (window.UnityAds) {
          try {
            window.UnityAds.init({
              gameId: UNITY_GAME_ID,
              debug: false,
            });

            window.UnityAds.load(UNITY_PLACEMENT_ID);
            setIsInitialized(true);

            const checkReady = setInterval(() => {
              if (window.UnityAds.isReady(UNITY_PLACEMENT_ID)) {
                setIsAdReady(true);
                clearInterval(checkReady);
              }
            }, 1000);

            return () => clearInterval(checkReady);
          } catch (error) {
            console.error("Unity Ads init error (web):", error);
          }
        }
      }
    };

    initialize();
    loadAdStats();
  }, [isNative, loadAdStats]);

  // Record ad impression in database
  const recordAdImpression = useCallback(async (
    adType: string,
    rewardType?: string,
    rewardClaimed: boolean = false
  ) => {
    try {
      await supabase.from("ad_impressions").insert({
        user_id: userId,
        ad_type: adType,
        placement_id: UNITY_PLACEMENT_ID,
        reward_type: rewardType,
        reward_claimed: rewardClaimed,
      });
      
      // Update local stats
      await loadAdStats();
    } catch (error) {
      console.error("Error recording ad impression:", error);
    }
  }, [userId, loadAdStats]);

  // Show rewarded ad
  const showRewardedAd = useCallback(async (): Promise<{
    success: boolean;
    rewarded: boolean;
  }> => {
    if (!isInitialized) {
      toast({
        title: "Carregando anúncios...",
        description: "Aguarde alguns segundos",
      });
      return { success: false, rewarded: false };
    }

    if (!isAdReady) {
      toast({
        title: "Preparando anúncio...",
        description: "Quase pronto, tente novamente",
      });

      // Try to load ad
      if (isNative) {
        const { UnityAds } = await import("capacitor-unity-ads");
        await UnityAds.loadRewardedVideo({ placementId: UNITY_PLACEMENT_ID });
      } else if (window.UnityAds) {
        window.UnityAds.load(UNITY_PLACEMENT_ID);
      }

      return { success: false, rewarded: false };
    }

    setIsLoading(true);

    try {
      if (isNative) {
        const { UnityAds } = await import("capacitor-unity-ads");
        
        // Show the ad
        const result = await UnityAds.showRewardedVideo();
        
        console.log("Unity Ads result:", result);
        
        if (result.reward) {
          await recordAdImpression("rewarded", "pending", false);
          
          toast({
            title: "Anúncio completo! 🎉",
            description: "Escolha sua recompensa",
          });

          // Pre-load next ad
          await UnityAds.loadRewardedVideo({ placementId: UNITY_PLACEMENT_ID });
          
          setIsLoading(false);
          return { success: true, rewarded: true };
        } else {
          toast({
            title: "Anúncio não completado",
            description: "Assista até o final para ganhar recompensa",
            variant: "destructive",
          });
          
          setIsLoading(false);
          return { success: true, rewarded: false };
        }
      } else {
        // Web implementation
        return new Promise((resolve) => {
          if (!window.UnityAds) {
            setIsLoading(false);
            resolve({ success: false, rewarded: false });
            return;
          }

          window.UnityAds.show(UNITY_PLACEMENT_ID, {
            onStart: () => {
              console.log("Ad started");
            },
            onComplete: async (reward: boolean) => {
              setIsLoading(false);
              
              if (reward) {
                await recordAdImpression("rewarded", "pending", false);
                window.UnityAds.load(UNITY_PLACEMENT_ID);
                toast({
                  title: "Anúncio completo! 🎉",
                  description: "Escolha sua recompensa",
                });
              }
              
              resolve({ success: true, rewarded: reward });
            },
            onError: (error: any) => {
              console.error("Ad error:", error);
              setIsLoading(false);
              toast({
                title: "Erro no anúncio",
                description: "Tente novamente mais tarde",
                variant: "destructive",
              });
              resolve({ success: false, rewarded: false });
            },
            onClose: () => {
              setIsLoading(false);
            },
          });
        });
      }
    } catch (error) {
      console.error("Error showing ad:", error);
      setIsLoading(false);
      toast({
        title: "Erro",
        description: "Não foi possível mostrar o anúncio",
        variant: "destructive",
      });
      return { success: false, rewarded: false };
    }
  }, [isInitialized, isAdReady, isNative, recordAdImpression, toast]);

  // Claim reward and update database
  const claimReward = useCallback(async (rewardType: "life" | "xp") => {
    try {
      // Get latest impression that wasn't claimed
      const { data: impressions } = await supabase
        .from("ad_impressions")
        .select("id")
        .eq("user_id", userId)
        .eq("reward_claimed", false)
        .order("watched_at", { ascending: false })
        .limit(1);

      if (impressions && impressions.length > 0) {
        // Mark as claimed
        await supabase
          .from("ad_impressions")
          .update({ reward_claimed: true, reward_type: rewardType })
          .eq("id", impressions[0].id);
      }

      // Give reward
      const { data: progress } = await supabase
        .from("user_progress")
        .select("lives, xp")
        .eq("user_id", userId)
        .single();

      if (rewardType === "life") {
        await supabase
          .from("user_progress")
          .update({ lives: Math.min((progress?.lives || 0) + 1, 5) })
          .eq("user_id", userId);

        toast({
          title: "Vida recuperada! ❤️",
          description: "Você ganhou +1 vida",
        });
      } else {
        await supabase
          .from("user_progress")
          .update({ xp: (progress?.xp || 0) + 50 })
          .eq("user_id", userId);

        toast({
          title: "XP ganho! ⭐",
          description: "Você ganhou +50 XP",
        });
      }

      await loadAdStats();
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast({
        title: "Erro",
        description: "Não foi possível dar a recompensa",
        variant: "destructive",
      });
    }
  }, [userId, loadAdStats, toast]);

  return {
    isInitialized,
    isAdReady,
    isLoading,
    adStats,
    showRewardedAd,
    claimReward,
    loadAdStats,
  };
};

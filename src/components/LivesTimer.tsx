import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Clock, PlayCircle, BookOpen, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MicroLessonPanel from "./MicroLessonPanel";
import { Capacitor } from "@capacitor/core";

// Unity Ads types para Web
declare global {
  interface Window {
    UnityAds: {
      init: (config: { gameId: string; debug: boolean }) => void;
      load: (placementId: string) => void;
      isReady: (placementId: string) => boolean;
      show: (placementId: string, callbacks: {
        onStart?: () => void;
        onComplete?: (reward: boolean) => void;
        onError?: (error: any) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

interface LivesTimerProps {
  userId: string;
  currentLives: number;
  onLivesUpdate: () => void;
  kiLevel: number;
}

const DAILY_AD_LIMIT = 10;
const AD_LIMIT_STORAGE_KEY = 'eduKi_daily_ad_count';
const AD_LIMIT_DATE_KEY = 'eduKi_daily_ad_date';
const UNITY_GAME_ID = '5993995';
const UNITY_PLACEMENT_ID = 'Rewarded_Android';

const LivesTimer = ({ userId, currentLives, onLivesUpdate, kiLevel }: LivesTimerProps) => {
  const [timeUntilNextLife, setTimeUntilNextLife] = useState<string>("");
  const [lastLifeLost, setLastLifeLost] = useState<Date | null>(null);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const [showMicroLesson, setShowMicroLesson] = useState(false);
  const [dailyAdCount, setDailyAdCount] = useState(0);
  const [adReady, setAdReady] = useState(false);
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();
  const [nativeAdsInitialized, setNativeAdsInitialized] = useState(false);

  useEffect(() => {
    const initializeAds = async () => {
      if (isNative) {
        // Initialize Unity Ads for Native (Capacitor)
        try {
          const { UnityAds } = await import('capacitor-unity-ads');
          
          // Initialize with game ID
          await UnityAds.initialize({
            gameId: UNITY_GAME_ID,
            testMode: true, // Alterar para false em produção
          });

          setNativeAdsInitialized(true);
          console.log('Unity Ads inicializado (nativo)');

          // Load rewarded video
          await UnityAds.loadRewardedVideo({ placementId: UNITY_PLACEMENT_ID });
          
          // Check if ad is loaded
          const checkAdReady = async () => {
            const { loaded } = await UnityAds.isRewardedVideoLoaded();
            setAdReady(loaded);
            if (loaded) {
              console.log('Anúncio carregado (nativo)');
            }
          };

          checkAdReady();
          const interval = setInterval(checkAdReady, 2000);
          
          return () => clearInterval(interval);
        } catch (error) {
          console.error('Erro ao configurar Unity Ads (nativo):', error);
        }
      } else {
        // Initialize Unity Ads for Web (PWA)
        if (window.UnityAds) {
          try {
            window.UnityAds.init({
              gameId: UNITY_GAME_ID,
              debug: true, // Alterar para false em produção
            });
            
            // Preload the rewarded ad
            window.UnityAds.load(UNITY_PLACEMENT_ID);
            
            // Check if ad is ready
            const checkAdReady = setInterval(() => {
              if (window.UnityAds.isReady(UNITY_PLACEMENT_ID)) {
                setAdReady(true);
                clearInterval(checkAdReady);
              }
            }, 1000);

            return () => clearInterval(checkAdReady);
          } catch (error) {
            console.error("Erro ao inicializar Unity Ads (web):", error);
          }
        }
      }
    };

    initializeAds();
    checkDailyAdLimit();
  }, [isNative]);

  const checkDailyAdLimit = () => {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem(AD_LIMIT_DATE_KEY);
    
    if (lastDate !== today) {
      // Reset count for new day
      localStorage.setItem(AD_LIMIT_DATE_KEY, today);
      localStorage.setItem(AD_LIMIT_STORAGE_KEY, '0');
      setDailyAdCount(0);
    } else {
      const count = parseInt(localStorage.getItem(AD_LIMIT_STORAGE_KEY) || '0');
      setDailyAdCount(count);
    }
  };

  const incrementAdCount = () => {
    const newCount = dailyAdCount + 1;
    setDailyAdCount(newCount);
    localStorage.setItem(AD_LIMIT_STORAGE_KEY, newCount.toString());
  };

  const canWatchAd = () => {
    return dailyAdCount < DAILY_AD_LIMIT;
  };

  useEffect(() => {
    fetchLastLifeLost();
  }, [userId]);

  useEffect(() => {
    if (currentLives < 5 && lastLifeLost) {
      const interval = setInterval(() => {
        calculateTimeUntilNextLife();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentLives, lastLifeLost]);

  const fetchLastLifeLost = async () => {
    const { data } = await supabase
      .from('user_progress')
      .select('last_life_lost_at')
      .eq('user_id', userId)
      .single();

    if (data?.last_life_lost_at) {
      setLastLifeLost(new Date(data.last_life_lost_at));
    }
  };

  const calculateTimeUntilNextLife = () => {
    if (!lastLifeLost) return;

    const now = new Date();
    const nextLifeTime = new Date(lastLifeLost.getTime() + 2 * 60 * 60 * 1000); // 2 horas
    const diff = nextLifeTime.getTime() - now.getTime();

    if (diff <= 0) {
      // Recuperar vida automaticamente
      recoverLife();
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeUntilNextLife(`${hours}h ${minutes}m ${seconds}s`);
  };

  const recoverLife = async () => {
    const newLives = Math.min(currentLives + 1, 5);
    await supabase
      .from('user_progress')
      .update({ lives: newLives })
      .eq('user_id', userId);
    
    onLivesUpdate();
    toast({
      title: "Vida recuperada! ❤️",
      description: "Você ganhou uma vida!",
    });
  };

  const watchAdForLife = async () => {
    // Check daily limit
    if (!canWatchAd()) {
      toast({
        title: "Limite diário atingido",
        description: `Você já assistiu ${DAILY_AD_LIMIT} anúncios hoje. Tente novamente amanhã!`,
        variant: "destructive",
      });
      return;
    }

    if (isNative) {
      // Native Unity Ads (Capacitor)
      if (!nativeAdsInitialized || !adReady) {
        toast({
          title: "Anúncios não disponíveis",
          description: "Aguarde o carregamento do anúncio",
          variant: "destructive",
        });
        return;
      }

      setIsLoadingAd(true);

      try {
        const { UnityAds } = await import('capacitor-unity-ads');
        
        // Show rewarded video
        const result = await UnityAds.showRewardedVideo();
        setIsLoadingAd(false);

        if (result.success && result.reward) {
          // User watched the ad to completion
          setShowRewardDialog(true);
          incrementAdCount();
          
          toast({
            title: "Anúncio completado! 🎉",
            description: "Escolha sua recompensa",
          });

          // Load next ad
          await UnityAds.loadRewardedVideo({ placementId: UNITY_PLACEMENT_ID });
          setAdReady(false);
          
          // Check when next ad is ready
          setTimeout(async () => {
            const { loaded } = await UnityAds.isRewardedVideoLoaded();
            setAdReady(loaded);
          }, 2000);
        } else {
          toast({
            title: "Anúncio não completado",
            description: "Você precisa assistir o anúncio completo para ganhar a recompensa",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Erro ao exibir anúncio Unity (nativo):", error);
        setIsLoadingAd(false);
        toast({
          title: "Erro ao carregar anúncio",
          description: "Tente novamente mais tarde",
          variant: "destructive",
        });
      }
    } else {
      // Web Unity Ads (PWA)
      if (!window.UnityAds) {
        toast({
          title: "Anúncios não disponíveis",
          description: "Sistema de anúncios não carregado",
          variant: "destructive",
        });
        return;
      }

      if (!window.UnityAds.isReady(UNITY_PLACEMENT_ID)) {
        toast({
          title: "Carregando vídeo...",
          description: "Tente novamente em alguns segundos",
        });
        window.UnityAds.load(UNITY_PLACEMENT_ID);
        return;
      }

      setIsLoadingAd(true);

      try {
        window.UnityAds.show(UNITY_PLACEMENT_ID, {
          onStart: () => {
            toast({
              title: "Anúncio iniciado",
              description: "Assista até o final para escolher sua recompensa!",
            });
          },
          onComplete: (reward: boolean) => {
            setIsLoadingAd(false);
            if (reward) {
              setShowRewardDialog(true);
              incrementAdCount();
              window.UnityAds.load(UNITY_PLACEMENT_ID);
            } else {
              toast({
                title: "Anúncio não completado",
                description: "Você precisa assistir o anúncio completo para ganhar a recompensa",
                variant: "destructive",
              });
            }
          },
          onError: (error: any) => {
            console.error("Erro no Unity Ads (web):", error);
            setIsLoadingAd(false);
            toast({
              title: "Vídeo indisponível",
              description: "Tente novamente em breve",
              variant: "destructive",
            });
            window.UnityAds.load(UNITY_PLACEMENT_ID);
          },
          onClose: () => {
            setIsLoadingAd(false);
          },
        });
      } catch (error) {
        console.error("Erro ao mostrar anúncio Unity (web):", error);
        setIsLoadingAd(false);
        toast({
          title: "Erro ao carregar anúncio",
          description: "Tente novamente mais tarde",
          variant: "destructive",
        });
      }
    }
  };

  const claimReward = async (rewardType: 'life' | 'xp') => {
    try {
      if (rewardType === 'life') {
        const newLives = Math.min(currentLives + 1, 5);
        await supabase
          .from('user_progress')
          .update({ lives: newLives })
          .eq('user_id', userId);
        
        toast({
          title: "Vida recuperada! ❤️",
          description: "Você ganhou uma vida!",
        });
      } else {
        const { data: currentProgress } = await supabase
          .from('user_progress')
          .select('xp')
          .eq('user_id', userId)
          .single();

        const newXp = (currentProgress?.xp || 0) + 50;
        await supabase
          .from('user_progress')
          .update({ xp: newXp })
          .eq('user_id', userId);

        toast({
          title: "XP ganho! ⭐",
          description: "Você ganhou 50 XP!",
        });
      }
      
      onLivesUpdate();
      setShowRewardDialog(false);
    } catch (error) {
      console.error("Erro ao conceder recompensa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível conceder a recompensa",
        variant: "destructive",
      });
    }
  };

  const completeMicroLesson = () => {
    setShowMicroLesson(true);
  };

  const handleMicroLessonComplete = () => {
    setShowMicroLesson(false);
    onLivesUpdate();
    toast({
      title: "Parabéns! 🎉",
      description: "Você completou a micro-aula e ganhou +1 vida!",
    });
  };

  if (currentLives >= 5) return null;

  if (showMicroLesson) {
    return (
      <MicroLessonPanel
        userId={userId}
        kiLevel={kiLevel}
        onClose={() => setShowMicroLesson(false)}
        onComplete={handleMicroLessonComplete}
      />
    );
  }

  return (
    <Card className="p-4 bg-gradient-card shadow-md border-2 border-destructive/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Heart className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold">Vidas Esgotadas</h3>
              {timeUntilNextLife && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Próxima vida em: {timeUntilNextLife}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 ${
                  i < currentLives
                    ? "fill-destructive text-destructive"
                    : "text-muted-foreground/20"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Recupere vidas rapidamente:
          </p>
          {!canWatchAd() && (
            <p className="text-xs text-destructive">
              Limite diário de anúncios atingido ({dailyAdCount}/{DAILY_AD_LIMIT})
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={watchAdForLife}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isLoadingAd || !canWatchAd()}
            >
              <PlayCircle className="w-4 h-4" />
              {isLoadingAd ? "Carregando..." : "Assistir Vídeo"}
            </Button>
            <Button
              onClick={completeMicroLesson}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Micro-aula
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Gift className="w-6 h-6 text-primary" />
              Escolha sua recompensa!
            </DialogTitle>
            <DialogDescription className="text-center">
              Obrigado por assistir o anúncio! Escolha sua recompensa:
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button
              onClick={() => claimReward('life')}
              className="h-24 flex flex-col gap-2"
              variant="outline"
            >
              <Heart className="w-8 h-8 text-destructive" />
              <span className="font-semibold">+1 Vida</span>
            </Button>
            <Button
              onClick={() => claimReward('xp')}
              className="h-24 flex flex-col gap-2"
              variant="outline"
            >
              <Gift className="w-8 h-8 text-primary" />
              <span className="font-semibold">+50 XP</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default LivesTimer;

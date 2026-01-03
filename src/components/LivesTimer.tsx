import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Clock, PlayCircle, BookOpen, Gift, Loader2 } from "lucide-react";
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

const UNITY_GAME_ID = '5993995';
const UNITY_PLACEMENT_ID = 'Rewarded_Android';

const LivesTimer = ({ userId, currentLives, onLivesUpdate, kiLevel }: LivesTimerProps) => {
  const [timeUntilNextLife, setTimeUntilNextLife] = useState<string>("");
  const [lastLifeLost, setLastLifeLost] = useState<Date | null>(null);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const [showMicroLesson, setShowMicroLesson] = useState(false);
  
  // Contador motivacional (sem limite – só pra mostrar progresso)
  const [adsWatchedToday, setAdsWatchedToday] = useState(0);
  
  const [adReady, setAdReady] = useState(false);
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();
  const [nativeAdsInitialized, setNativeAdsInitialized] = useState(false);

  useEffect(() => {
    const initializeAds = async () => {
      if (isNative) {
        try {
          const { UnityAds } = await import('capacitor-unity-ads');
          
          await UnityAds.initialize({
            gameId: UNITY_GAME_ID,
            testMode: false, // Produção
          });

          setNativeAdsInitialized(true);
          console.log('Unity Ads inicializado (nativo)');

          await UnityAds.loadRewardedVideo({ placementId: UNITY_PLACEMENT_ID });
          
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
        // Web (PWA)
        if (window.UnityAds) {
          try {
            window.UnityAds.init({
              gameId: UNITY_GAME_ID,
              debug: false,
            });
            
            window.UnityAds.load(UNITY_PLACEMENT_ID);
            
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
    loadAdsWatchedToday();
  }, [isNative]);

  const loadAdsWatchedToday = () => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('eduKi_ads_date');
    const savedCount = localStorage.getItem('eduKi_ads_count');

    if (savedDate === today) {
      setAdsWatchedToday(parseInt(savedCount || '0'));
    } else {
      localStorage.setItem('eduKi_ads_date', today);
      localStorage.setItem('eduKi_ads_count', '0');
      setAdsWatchedToday(0);
    }
  };

  const incrementAdsWatched = () => {
    const newCount = adsWatchedToday + 1;
    setAdsWatchedToday(newCount);
    localStorage.setItem('eduKi_ads_count', newCount.toString());
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
      recoverLife();
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeUntilNextLife(`\( {hours}h \){minutes}m ${seconds}s`);
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
    if (isNative) {
      if (!nativeAdsInitialized) {
        toast({
          title: "Carregando anúncios...",
          description: "Inicializando, tente novamente em alguns segundos",
        });
        return;
      }

      if (!adReady) {
        toast({
          title: "Preparando anúncio...",
          description: "Quase pronto, tente novamente em 2 segundos",
        });
        
        try {
          const { UnityAds } = await import('capacitor-unity-ads');
          await UnityAds.loadRewardedVideo({ placementId: UNITY_PLACEMENT_ID });
        } catch (err) {}
        return;
      }

      setIsLoadingAd(true);

      try {
        const { UnityAds } = await import('capacitor-unity-ads');
        
        // Mostrar vídeo recompensado
        const result = await UnityAds.showRewardedVideo();
        
        setIsLoadingAd(false);
        console.log('Unity Ads Result:', result);

        if (result.reward) {
          setShowRewardDialog(true);
          incrementAdsWatched();
          toast({
            title: "Anúncio completado! 🎉",
            description: "Escolha sua recompensa",
          });
        } else {
          toast({
            title: "Anúncio não completado",
            description: "Assista até o final para ganhar a recompensa",
            variant: "destructive",
          });
        }

        // Pré-carregar próximo anúncio
        await UnityAds.loadRewardedVideo({ placementId: UNITY_PLACEMENT_ID });
      } catch (error) {
        console.error("Erro Unity Ads:", error);
        setIsLoadingAd(false);
        toast({
          title: "Erro ao mostrar",
          description: "Tente novamente",
          variant: "destructive",
        });
      }
    } else {
      // Web (PWA)
      if (!window.UnityAds || !window.UnityAds.isReady(UNITY_PLACEMENT_ID)) {
        toast({
          title: "Carregando vídeo...",
          description: "Tente novamente em alguns segundos",
        });
        window.UnityAds?.load(UNITY_PLACEMENT_ID);
        return;
      }

      setIsLoadingAd(true);

      window.UnityAds.show(UNITY_PLACEMENT_ID, {
        onComplete: (reward: boolean) => {
          setIsLoadingAd(false);
          if (reward) {
            setShowRewardDialog(true);
            incrementAdsWatched();
            window.UnityAds.load(UNITY_PLACEMENT_ID);
          }
        },
        onError: () => {
          setIsLoadingAd(false);
          toast({
            title: "Vídeo indisponível",
            description: "Tente novamente em breve",
            variant: "destructive",
          });
        },
      });
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
          
          {/* Dica motivacional */}
          <p className="text-sm text-primary font-medium">
            Vídeos assistidos hoje: {adsWatchedToday} 🚀
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={watchAdForLife}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isLoadingAd}
            >
              {isLoadingAd ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Assistir Vídeo
                </>
              )}
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

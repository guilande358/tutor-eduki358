import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Clock, PlayCircle, BookOpen, Gift, Loader2 } from "lucide-react";
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

// Tipagem para Unity Ads (web / bridge)
declare global {
  interface Window {
    UnityAds: {
      init: (config: { gameId: string; debug: boolean }) => void;
      load: (placementId: string) => void;
      isReady: (placementId: string) => boolean;
      show: (
        placementId: string,
        callbacks: {
          onStart?: () => void;
          onComplete?: (rewarded: boolean) => void;
          onError?: (error: any) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

interface LivesTimerProps {
  userId: string;
  currentLives: number;
  onLivesUpdate: () => void;
  kiLevel: number;
}

// IDs do Unity Ads
const UNITY_GAME_ID = '5993995';
const REWARDED_PLACEMENT = 'Rewarded_Android';

const LivesTimer = ({ userId, currentLives, onLivesUpdate, kiLevel }: LivesTimerProps) => {
  const [timeUntilNextLife, setTimeUntilNextLife] = useState<string>("");
  const [lastLifeLost, setLastLifeLost] = useState<Date | null>(null);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const [showMicroLesson, setShowMicroLesson] = useState(false);
  
  // Contador motivacional de vídeos assistidos hoje
  const [adsWatchedToday, setAdsWatchedToday] = useState(0);
  
  // Estados para anúncios
  const [rewardedReady, setRewardedReady] = useState(false);
  
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();
  const [adsInitialized, setAdsInitialized] = useState(false);

  // Inicialização dos anúncios
  useEffect(() => {
    const initializeAds = async () => {
      if (isNative) {
        try {
          const { UnityAds } = await import('capacitor-unity-ads');

          await UnityAds.initialize({
            gameId: UNITY_GAME_ID,
            testMode: false,
          });

          setAdsInitialized(true);
          console.log('Unity Ads inicializado com sucesso (nativo)');

          // Pré-carregar anúncios
          await UnityAds.loadRewardedVideo({ placementId: REWARDED_PLACEMENT });

          // Verificar disponibilidade periodicamente
          const checkReady = async () => {
            try {
              const { loaded } = await UnityAds.isRewardedVideoLoaded();
              setRewardedReady(loaded);
            } catch (err) {
              console.warn('Erro ao verificar status dos ads:', err);
            }
          };

          checkReady();
          const interval = setInterval(checkReady, 3000);
          return () => clearInterval(interval);
        } catch (error) {
          console.error('Falha ao inicializar Unity Ads (nativo):', error);
        }
      } else {
        // Modo Web / PWA
        if (window.UnityAds) {
          try {
            window.UnityAds.init({
              gameId: UNITY_GAME_ID,
              debug: true,
            });

            window.UnityAds.load(REWARDED_PLACEMENT);

            const checkInterval = setInterval(() => {
              setRewardedReady(window.UnityAds.isReady(REWARDED_PLACEMENT));
            }, 1500);

            return () => clearInterval(checkInterval);
          } catch (err) {
            console.error('Erro inicialização Unity Ads web:', err);
          }
        }
      }
    };

    initializeAds();
    loadAdsWatchedToday();
  }, [isNative]);

  // Carregar contador de anúncios assistidos hoje
  const loadAdsWatchedToday = () => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('eduki_ads_date');
    const savedCount = localStorage.getItem('eduki_ads_count');

    if (savedDate === today) {
      setAdsWatchedToday(parseInt(savedCount || '0'));
    } else {
      localStorage.setItem('eduki_ads_date', today);
      localStorage.setItem('eduki_ads_count', '0');
      setAdsWatchedToday(0);
    }
  };

  const incrementAdsWatched = () => {
    const newCount = adsWatchedToday + 1;
    setAdsWatchedToday(newCount);
    localStorage.setItem('eduki_ads_count', newCount.toString());
  };

  // Lógica de vidas
  useEffect(() => {
    fetchLastLifeLost();
  }, [userId]);

  useEffect(() => {
    if (currentLives < 5 && lastLifeLost) {
      const interval = setInterval(calculateTimeUntilNextLife, 1000);
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

    setTimeUntilNextLife(`${hours.toString().padStart(2,'0')}h ${minutes.toString().padStart(2,'0')}m ${seconds.toString().padStart(2,'0')}s`);
  };

  const recoverLife = async () => {
    const newLives = Math.min(currentLives + 1, 5);
    await supabase
      .from('user_progress')
      .update({ lives: newLives, last_life_lost_at: new Date().toISOString() })
      .eq('user_id', userId);
    
    onLivesUpdate();
    toast({ title: "Vida recuperada! ❤️" });
  };

  // Mostrar rewarded ad
  const watchAdForLife = async () => {
    setIsLoadingAd(true);

    try {
      if (isNative) {
        const { UnityAds } = await import('capacitor-unity-ads');

        if (!rewardedReady) {
          await UnityAds.loadRewardedVideo({ placementId: REWARDED_PLACEMENT });
          await new Promise(r => setTimeout(r, 1500));
        }

        const result = await UnityAds.showRewardedVideo();

        if (result?.reward) {
          setShowRewardDialog(true);
          incrementAdsWatched();
        }
      } else {
        // Web
        if (!window.UnityAds?.isReady(REWARDED_PLACEMENT)) {
          window.UnityAds?.load(REWARDED_PLACEMENT);
          await new Promise(r => setTimeout(r, 2000));
        }

        window.UnityAds?.show(REWARDED_PLACEMENT, {
          onComplete: (rewarded: boolean) => {
            if (rewarded) {
              setShowRewardDialog(true);
              incrementAdsWatched();
            }
          },
          onError: () => {
            toast({ title: "Erro no vídeo", variant: "destructive" });
          }
        });
      }
    } catch (error) {
      console.error('Erro ao mostrar rewarded:', error);
      toast({ title: "Não foi possível carregar o anúncio", variant: "destructive" });
    } finally {
      setIsLoadingAd(false);
    }
  };

  const claimReward = async (rewardType: 'credits' | 'xp') => {
    try {
      if (rewardType === 'credits') {
        const { data } = await supabase.from('user_progress').select('credits').eq('user_id', userId).single();
        const newCredits = (data?.credits || 0) + 2;
        await supabase.from('user_progress').update({ credits: newCredits }).eq('user_id', userId);
        toast({ title: "Créditos ganhos! 🪙", description: "+2 créditos" });
      } else {
        const { data } = await supabase.from('user_progress').select('xp').eq('user_id', userId).single();
        const newXp = (data?.xp || 0) + 50;
        await supabase.from('user_progress').update({ xp: newXp }).eq('user_id', userId);
        toast({ title: "50 XP adicionados! ⭐" });
      }
      onLivesUpdate();
      setShowRewardDialog(false);
    } catch (err) {
      toast({ title: "Erro ao conceder recompensa", variant: "destructive" });
    }
  };

  const completeMicroLesson = () => setShowMicroLesson(true);

  const handleMicroLessonComplete = async () => {
    setShowMicroLesson(false);
    // Give 1 credit for micro-lesson
    const { data } = await supabase.from('user_progress').select('credits').eq('user_id', userId).single();
    const newCredits = (data?.credits || 0) + 1;
    await supabase.from('user_progress').update({ credits: newCredits }).eq('user_id', userId);
    onLivesUpdate();
    toast({ title: "Micro-aula concluída! +1 crédito 🎓" });
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
    <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 shadow-xl">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coins className="w-6 h-6 text-amber-500" />
            <div>
              <h3 className="font-bold text-lg">Créditos Esgotados</h3>
              {timeUntilNextLife && (
                <p className="text-sm text-slate-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Próximo em: {timeUntilNextLife}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-1 items-center">
            <Coins className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-bold">{currentLives}/5</span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-slate-300">Ganhe créditos rapidamente:</p>
          
          <p className="text-sm font-medium text-cyan-400">
            Vídeos assistidos hoje: {adsWatchedToday} 🔥
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={watchAdForLife}
              disabled={isLoadingAd || !rewardedReady}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {isLoadingAd ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <PlayCircle className="w-5 h-5 mr-2" />
              )}
              Vídeo (+2)
            </Button>

            <Button
              onClick={completeMicroLesson}
              variant="outline"
              className="border-cyan-600 text-cyan-400 hover:bg-cyan-950/30"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Micro-aula (+1)
            </Button>
          </div>
        </div>
      </div>

      {/* Diálogo de escolha de recompensa */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Escolha sua recompensa!</DialogTitle>
            <DialogDescription className="text-slate-400">
              Você completou o anúncio com sucesso.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Button
              onClick={() => claimReward('credits')}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Coins className="mr-2 h-5 w-5" /> +2 Créditos
            </Button>
            <Button
              onClick={() => claimReward('xp')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Gift className="mr-2 h-5 w-5" /> +50 XP
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default LivesTimer;

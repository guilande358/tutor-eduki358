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

// IDs do Unity Ads (ajuste se necessário)
const UNITY_GAME_ID = '5993995';                    // Seu Game ID real
const REWARDED_PLACEMENT = 'Rewarded_Android';
const INTERSTITIAL_PLACEMENT = 'Interstitial_Android';
// const BANNER_PLACEMENT = 'Banner_Android';       // Banner geralmente não é suportado bem nesse tipo de bridge

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
  const [interstitialReady, setInterstitialReady] = useState(false);
  
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();
  const [adsInitialized, setAdsInitialized] = useState(false);

  // Inicialização dos anúncios
  useEffect(() => {
    const initializeAds = async () => {
      if (isNative) {
        try {
          // Import dinâmico do plugin Unity Ads para Capacitor (ajuste o nome do pacote conforme instalado)
          const { UnityAds } = await import('@capacitor-community/unity-ads'); // ← ajuste o nome do pacote se for diferente

          await UnityAds.initialize({
            gameId: UNITY_GAME_ID,
            testMode: false, // ← Mude para false quando for publicar!
          });

          setAdsInitialized(true);
          console.log('Unity Ads inicializado com sucesso (nativo)');

          // Pré-carregar anúncios
          await UnityAds.load({ placementId: REWARDED_PLACEMENT });
          await UnityAds.load({ placementId: INTERSTITIAL_PLACEMENT });
          // await UnityAds.load({ placementId: BANNER_PLACEMENT }); // Banner pode não funcionar

          // Verificar disponibilidade periodicamente
          const checkReady = async () => {
            try {
              const rewardedStatus = await UnityAds.isLoaded({ placementId: REWARDED_PLACEMENT });
              setRewardedReady(!!rewardedStatus?.loaded);

              const interstitialStatus = await UnityAds.isLoaded({ placementId: INTERSTITIAL_PLACEMENT });
              setInterstitialReady(!!interstitialStatus?.loaded);
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
            window.UnityAds.load(INTERSTITIAL_PLACEMENT);

            const checkInterval = setInterval(() => {
              setRewardedReady(window.UnityAds.isReady(REWARDED_PLACEMENT));
              setInterstitialReady(window.UnityAds.isReady(INTERSTITIAL_PLACEMENT));
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

  // Lógica de vidas (mantida exatamente igual)
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
        const { UnityAds } = await import('@capacitor-community/unity-ads'); // ajuste o pacote se necessário

        if (!rewardedReady) {
          await UnityAds.load({ placementId: REWARDED_PLACEMENT });
          await new Promise(r => setTimeout(r, 1500));
        }

        const result = await UnityAds.show({ placementId: REWARDED_PLACEMENT });

        if (result?.rewarded) {
          setShowRewardDialog(true);
          incrementAdsWatched();
          // Mostra interstitial após rewarded bem-sucedido
          await showInterstitial();
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
              // Mostra interstitial após recompensa
              showInterstitial();
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

  // Função para mostrar Interstitial
  const showInterstitial = async () => {
    try {
      if (isNative) {
        const { UnityAds } = await import('@capacitor-community/unity-ads');
        if (!interstitialReady) await UnityAds.load({ placementId: INTERSTITIAL_PLACEMENT });
        await UnityAds.show({ placementId: INTERSTITIAL_PLACEMENT });
      } else if (window.UnityAds?.isReady(INTERSTITIAL_PLACEMENT)) {
        window.UnityAds.show(INTERSTITIAL_PLACEMENT, {
          onComplete: () => console.log('Interstitial concluído'),
          onError: (err) => console.error('Erro interstitial:', err)
        });
      }
    } catch (err) {
      console.warn('Não foi possível mostrar interstitial:', err);
    }
  };

  const claimReward = async (rewardType: 'life' | 'xp') => {
    try {
      if (rewardType === 'life') {
        const newLives = Math.min(currentLives + 1, 5);
        await supabase.from('user_progress').update({ lives: newLives }).eq('user_id', userId);
        toast({ title: "Vida recuperada! ❤️" });
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

  const handleMicroLessonComplete = () => {
    setShowMicroLesson(false);
    onLivesUpdate();
    toast({ title: "Micro-aula concluída! +1 vida" });
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
            <Heart className="w-6 h-6 text-red-500" fill="currentColor" />
            <div>
              <h3 className="font-bold text-lg">Vidas Esgotadas</h3>
              {timeUntilNextLife && (
                <p className="text-sm text-slate-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Próxima em: {timeUntilNextLife}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-1">
            {Array(5).fill(0).map((_, i) => (
              <Heart
                key={i}
                className={`w-6 h-6 ${i < currentLives ? "fill-red-500 text-red-500" : "text-slate-600"}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-slate-300">Recupere vidas rapidamente:</p>
          
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
              Assistir Vídeo
            </Button>

            <Button
              onClick={completeMicroLesson}
              variant="outline"
              className="border-cyan-600 text-cyan-400 hover:bg-cyan-950/30"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Micro-Aula
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
              onClick={() => claimReward('life')}
              className="bg-red-600 hover:bg-red-700"
              disabled={currentLives >= 5}
            >
              <Heart className="mr-2 h-5 w-5" /> +1 Vida
            </Button>
            <Button
              onClick={() => claimReward('xp')}
              className="bg-amber-600 hover:bg-amber-700"
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

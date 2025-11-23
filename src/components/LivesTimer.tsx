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

interface LivesTimerProps {
  userId: string;
  currentLives: number;
  onLivesUpdate: () => void;
  kiLevel: number;
}

const LivesTimer = ({ userId, currentLives, onLivesUpdate, kiLevel }: LivesTimerProps) => {
  const [timeUntilNextLife, setTimeUntilNextLife] = useState<string>("");
  const [lastLifeLost, setLastLifeLost] = useState<Date | null>(null);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const [showMicroLesson, setShowMicroLesson] = useState(false);
  const { toast } = useToast();

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
    setIsLoadingAd(true);
    
    toast({
      title: "Carregando anúncio...",
      description: "Por favor, aguarde",
    });

    try {
      // Load AdMob Rewarded Ad
      if ((window as any).adsbygoogle) {
        const adBreak = (window as any).adBreak;
        const adConfig = (window as any).adConfig;
        
        if (adBreak && adConfig) {
          await adConfig({
            preloadAdBreaks: 'on',
            sound: 'on',
          });

          await adBreak({
            type: 'reward',
            name: 'reward-ad',
            beforeAd: () => {
              toast({
                title: "Anúncio iniciado",
                description: "Assista até o final para escolher sua recompensa!",
              });
            },
            afterAd: () => {
              setShowRewardDialog(true);
            },
            adBreakDone: (placementInfo: any) => {
              if (placementInfo.breakStatus === 'viewed') {
                setShowRewardDialog(true);
              } else {
                toast({
                  title: "Anúncio não completado",
                  description: "Você precisa assistir o anúncio completo para ganhar a recompensa",
                  variant: "destructive",
                });
              }
              setIsLoadingAd(false);
            },
          });
        } else {
          throw new Error("AdMob não configurado");
        }
      } else {
        throw new Error("AdMob não disponível");
      }
    } catch (error) {
      console.error("Erro ao carregar anúncio:", error);
      toast({
        title: "Erro ao carregar anúncio",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
      setIsLoadingAd(false);
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
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={watchAdForLife}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isLoadingAd}
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

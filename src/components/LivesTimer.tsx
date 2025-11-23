import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Clock, PlayCircle, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface LivesTimerProps {
  userId: string;
  currentLives: number;
  onLivesUpdate: () => void;
}

const LivesTimer = ({ userId, currentLives, onLivesUpdate }: LivesTimerProps) => {
  const [timeUntilNextLife, setTimeUntilNextLife] = useState<string>("");
  const [lastLifeLost, setLastLifeLost] = useState<Date | null>(null);
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
    // Simular assistir vídeo (30 segundos)
    toast({
      title: "Assistindo anúncio...",
      description: "Aguarde 30 segundos para ganhar uma vida",
    });

    setTimeout(async () => {
      const newLives = Math.min(currentLives + 1, 5);
      await supabase
        .from('user_progress')
        .update({ lives: newLives })
        .eq('user_id', userId);
      
      onLivesUpdate();
      toast({
        title: "Vida recuperada! 🎉",
        description: "Obrigado por assistir o anúncio!",
      });
    }, 3000); // Simulando 3s em vez de 30s para demo
  };

  const completeMicroLesson = async () => {
    toast({
      title: "Em breve!",
      description: "Micro-aulas em desenvolvimento",
    });
  };

  if (currentLives >= 5) return null;

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
            >
              <PlayCircle className="w-4 h-4" />
              Assistir Vídeo
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
    </Card>
  );
};

export default LivesTimer;

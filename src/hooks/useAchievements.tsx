import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface NewAchievement {
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
}

export const useAchievements = (userId: string) => {
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);

  const checkAchievements = async () => {
    if (!userId || checking) return;

    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-achievements");

      if (error) throw error;

      if (data?.newAchievements && data.newAchievements.length > 0) {
        // Mostrar notificação para cada conquista
        for (const achievement of data.newAchievements as NewAchievement[]) {
          toast({
            title: `🎉 Nova Conquista Desbloqueada!`,
            description: (
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <span className="text-2xl">{achievement.icon}</span>
                  <span>{achievement.title}</span>
                </div>
                <p className="text-sm">{achievement.description}</p>
                <p className="text-xs text-muted-foreground">
                  +{achievement.xp_reward} XP
                </p>
              </div>
            ),
            duration: 5000,
          });
        }

        // Se ganhou XP, mostrar notificação extra
        if (data.totalXpReward > 0) {
          setTimeout(() => {
            toast({
              title: "Recompensa Total",
              description: `Você ganhou ${data.totalXpReward} XP pelas conquistas!`,
              duration: 3000,
            });
          }, data.newAchievements.length * 5000);
        }
      }
    } catch (error: any) {
      console.error("Erro ao verificar conquistas:", error);
    } finally {
      setChecking(false);
    }
  };

  // Verificar conquistas automaticamente em intervalos
  useEffect(() => {
    if (!userId) return;

    // Verificar imediatamente
    checkAchievements();

    // Verificar a cada 30 segundos
    const interval = setInterval(checkAchievements, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  return { checkAchievements, checking };
};

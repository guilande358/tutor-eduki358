import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Gift, Heart, Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface StreakBonusProps {
  userId: string;
  onBonusClaimed: () => void;
}

const StreakBonus = ({ userId, onBonusClaimed }: StreakBonusProps) => {
  const [streak, setStreak] = useState(0);
  const [canClaimBonus, setCanClaimBonus] = useState(false);
  const [lastStudyDate, setLastStudyDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkStreak();
  }, [userId]);

  const checkStreak = async () => {
    const { data } = await supabase
      .from("user_progress")
      .select("daily_streak, last_study_date")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setStreak(data.daily_streak || 0);
      setLastStudyDate(data.last_study_date);

      // Verificar se pode reivindicar bônus (login diário)
      const today = new Date().toISOString().split("T")[0];
      const canClaim = data.last_study_date !== today;
      setCanClaimBonus(canClaim);
    }
  };

  const claimDailyBonus = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

      // Verificar se mantém a streak
      let newStreak = 1;
      if (lastStudyDate === yesterday) {
        newStreak = streak + 1;
      }

      // Determinar recompensa baseado na streak
      const isStreakMilestone = newStreak % 7 === 0; // Bônus especial a cada 7 dias
      const xpBonus = isStreakMilestone ? 100 : 50;
      const lifeBonus = isStreakMilestone ? 1 : 0;

      // Buscar dados atuais
      const { data: current } = await supabase
        .from("user_progress")
        .select("xp, lives")
        .eq("user_id", userId)
        .maybeSingle();

      // Atualizar progresso
      await supabase
        .from("user_progress")
        .update({
          daily_streak: newStreak,
          last_study_date: today,
          xp: (current?.xp || 0) + xpBonus,
          lives: Math.min((current?.lives || 0) + lifeBonus, 5),
        })
        .eq("user_id", userId);

      setStreak(newStreak);
      setCanClaimBonus(false);

      toast({
        title: isStreakMilestone ? "🎉 Bônus de Streak!" : "✨ Bônus Diário!",
        description: (
          <div className="flex flex-col gap-1">
            <span>+{xpBonus} XP</span>
            {lifeBonus > 0 && <span>+{lifeBonus} Vida</span>}
            <span className="text-sm">🔥 Streak: {newStreak} dias</span>
          </div>
        ),
      });

      onBonusClaimed();
    } catch (error) {
      console.error("Erro ao reivindicar bônus:", error);
      toast({
        title: "Erro",
        description: "Não foi possível reivindicar o bônus",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canClaimBonus && streak === 0) return null;

  return (
    <AnimatePresence>
      {canClaimBonus && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card className="p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-full">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Bônus Diário Disponível!</h3>
                  <p className="text-sm text-muted-foreground">
                    Streak atual: {streak} dias
                  </p>
                </div>
              </div>
              <Button
                onClick={claimDailyBonus}
                disabled={loading}
                className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Gift className="w-4 h-4" />
                Resgatar
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StreakBonus;

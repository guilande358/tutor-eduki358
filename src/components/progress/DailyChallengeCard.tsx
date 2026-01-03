import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Star, Check, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

interface DailyChallengeCardProps {
  userId: string;
  onStartChallenge: () => void;
}

interface Challenge {
  id: string;
  challenge_data: {
    type: string;
    subject: string;
    description: string;
    target: number;
  };
  is_completed: boolean;
  xp_reward: number;
}

const CHALLENGE_TEMPLATES = [
  { type: "exercises", subject: "Matemática", description: "Complete 3 exercícios de Matemática", target: 3 },
  { type: "exercises", subject: "Física", description: "Complete 2 exercícios de Física", target: 2 },
  { type: "chat", subject: "Tutor", description: "Faça 5 perguntas ao tutor", target: 5 },
  { type: "streak", subject: "Estudo", description: "Mantenha seu streak de hoje", target: 1 },
  { type: "perfect", subject: "Perfeição", description: "Acerte 100% em um exercício", target: 1 },
];

const DailyChallengeCard = ({ userId, onStartChallenge }: DailyChallengeCardProps) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadOrCreateChallenge();
  }, [userId]);

  const loadOrCreateChallenge = async () => {
    const today = new Date().toISOString().split("T")[0];

    // Tentar carregar desafio existente
    const { data: existing } = await supabase
      .from("daily_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("challenge_date", today)
      .maybeSingle();

    if (existing) {
      setChallenge(existing as unknown as Challenge);
    } else {
      // Criar novo desafio
      const randomTemplate = CHALLENGE_TEMPLATES[Math.floor(Math.random() * CHALLENGE_TEMPLATES.length)];
      const xpReward = 50 + Math.floor(Math.random() * 50); // 50-100 XP

      const { data: newChallenge, error } = await supabase
        .from("daily_challenges")
        .insert({
          user_id: userId,
          challenge_date: today,
          challenge_data: randomTemplate,
          xp_reward: xpReward,
        })
        .select()
        .single();

      if (!error && newChallenge) {
        setChallenge(newChallenge as unknown as Challenge);
      }
    }
    setLoading(false);
  };

  const claimReward = async () => {
    if (!challenge || challenge.is_completed) return;

    try {
      // Marcar como completado
      await supabase
        .from("daily_challenges")
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq("id", challenge.id);

      // Adicionar XP
      const { data: progress } = await supabase
        .from("user_progress")
        .select("xp")
        .eq("user_id", userId)
        .maybeSingle();

      await supabase
        .from("user_progress")
        .update({ xp: (progress?.xp || 0) + challenge.xp_reward })
        .eq("user_id", userId);

      setChallenge({ ...challenge, is_completed: true });

      toast({
        title: "Desafio Completado! 🎉",
        description: `Você ganhou ${challenge.xp_reward} XP!`,
      });
    } catch (error) {
      console.error("Erro ao reivindicar recompensa:", error);
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse flex items-center gap-4">
          <div className="w-12 h-12 bg-muted rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!challenge) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card
        className={`p-4 ${
          challenge.is_completed
            ? "bg-green-500/10 border-green-500/30"
            : "bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-full ${
                challenge.is_completed ? "bg-green-500/20" : "bg-primary/20"
              }`}
            >
              {challenge.is_completed ? (
                <Check className="w-6 h-6 text-green-500" />
              ) : (
                <Zap className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">Desafio do Dia</h3>
                <Badge variant="secondary" className="gap-1">
                  <Star className="w-3 h-3" />
                  {challenge.xp_reward} XP
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {challenge.challenge_data.description}
              </p>
            </div>
          </div>

          {!challenge.is_completed && (
            <Button onClick={onStartChallenge} size="sm" className="gap-2">
              Iniciar
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {challenge.is_completed && (
            <Badge variant="outline" className="text-green-500 border-green-500">
              Completado ✓
            </Badge>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default DailyChallengeCard;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Heart, Target, TrendingUp, Award } from "lucide-react";

interface UserProgress {
  ki_level: number;
  xp: number;
  lives: number;
  daily_streak: number;
}

interface DashboardProps {
  userId: string;
}

const Dashboard = ({ userId }: DashboardProps) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    fetchProgress();
  }, [userId]);

  const fetchProgress = async () => {
    const { data } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) setProgress(data);
  };

  if (!progress) return <div>Carregando...</div>;

  const getKILevel = (ki: number) => {
    if (ki <= 20) return { label: "Iniciante", color: "bg-muted" };
    if (ki <= 50) return { label: "Intermediário", color: "bg-primary" };
    if (ki <= 80) return { label: "Avançado", color: "bg-secondary" };
    return { label: "Mestre", color: "bg-accent" };
  };

  const kiInfo = getKILevel(progress.ki_level);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KI Card */}
        <Card className="p-6 bg-gradient-card shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nível KI</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{progress.ki_level}</p>
                <Badge variant="secondary" className={kiInfo.color}>
                  {kiInfo.label}
                </Badge>
              </div>
            </div>
          </div>
          <Progress value={progress.ki_level} className="mt-4" />
        </Card>

        {/* XP Card */}
        <Card className="p-6 bg-gradient-card shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent/10 rounded-xl">
              <Zap className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Experiência</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{progress.xp}</p>
                <span className="text-sm text-muted-foreground">XP</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <p className="text-xs text-muted-foreground">Continue estudando!</p>
          </div>
        </Card>

        {/* Lives Card */}
        <Card className="p-6 bg-gradient-card shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-destructive/10 rounded-xl">
              <Heart className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vidas</p>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-5 h-5 ${
                      i < progress.lives
                        ? "fill-destructive text-destructive"
                        : "text-muted-foreground/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Streak Card */}
        <Card className="p-6 bg-gradient-card shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-secondary/10 rounded-xl">
              <Target className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sequência</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{progress.daily_streak}</p>
                <span className="text-sm text-muted-foreground">dias</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-secondary" />
            <p className="text-xs text-muted-foreground">Continue assim! 🔥</p>
          </div>
        </Card>
      </div>

      {/* Motivational Card */}
      <Card className="p-6 bg-gradient-primary text-white shadow-glow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Você está indo muito bem! 🎉</h3>
            <p className="text-white/90">
              Continue estudando para aumentar seu KI e desbloquear novos desafios
            </p>
          </div>
          <Brain className="w-16 h-16 opacity-20" />
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, Star, Flame, Heart, Target, TrendingUp, 
  Calendar, BookOpen, Award, ShoppingBag 
} from "lucide-react";
import LevelBadge from "./LevelBadge";
import StreakBonus from "./StreakBonus";
import RewardShop from "./RewardShop";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ProgressScreenProps {
  userId: string;
}

interface UserStats {
  xp: number;
  ki_level: number;
  daily_streak: number;
  lives: number;
  total_videos_watched: number;
  level: number;
}

interface DailyProgress {
  date: string;
  xp: number;
  exercises: number;
}

const ProgressScreen = ({ userId }: ProgressScreenProps) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<number>(0);
  const [totalExercises, setTotalExercises] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState<DailyProgress[]>([]);
  const [dailyGoal, setDailyGoal] = useState({ completed: 0, target: 5 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar estatísticas do usuário
      const { data: progress } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (progress) {
        setStats({
          xp: progress.xp || 0,
          ki_level: progress.ki_level || 0,
          daily_streak: progress.daily_streak || 0,
          lives: progress.lives || 3,
          total_videos_watched: progress.total_videos_watched || 0,
          level: progress.level || 1,
        });
      }

      // Contar conquistas
      const { count: achievementCount } = await supabase
        .from("achievements")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      setAchievements(achievementCount || 0);

      // Contar exercícios totais
      const { count: exerciseCount } = await supabase
        .from("completed_exercises")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      setTotalExercises(exerciseCount || 0);

      // Carregar meta diária
      const today = new Date().toISOString().split("T")[0];
      const { data: goal } = await supabase
        .from("daily_goals")
        .select("*")
        .eq("user_id", userId)
        .eq("goal_date", today)
        .maybeSingle();

      if (goal) {
        setDailyGoal({
          completed: goal.completed_exercises || 0,
          target: goal.target_exercises || 5,
        });
      }

      // Carregar progresso semanal
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const { data: exercises } = await supabase
        .from("completed_exercises")
        .select("completed_at, xp_earned")
        .eq("user_id", userId)
        .gte("completed_at", weekAgo);

      // Agrupar por dia
      const dailyData: Record<string, DailyProgress> = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        dailyData[date] = { date, xp: 0, exercises: 0 };
      }

      exercises?.forEach((ex) => {
        const date = ex.completed_at?.split("T")[0];
        if (date && dailyData[date]) {
          dailyData[date].xp += ex.xp_earned || 0;
          dailyData[date].exercises += 1;
        }
      });

      setWeeklyProgress(
        Object.values(dailyData)
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((d) => ({
            ...d,
            date: new Date(d.date).toLocaleDateString("pt-BR", { weekday: "short" }),
          }))
      );
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const goalPercent = Math.min(100, (dailyGoal.completed / dailyGoal.target) * 100);

  return (
    <div className="space-y-6">
      {/* Bônus de Streak */}
      <StreakBonus userId={userId} onBonusClaimed={loadData} />

      {/* Header com Nível */}
      <Card className="p-6 bg-gradient-primary text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">Meu Progresso</h2>
              <p className="text-white/80">Continue evoluindo!</p>
            </div>
          </div>
          <LevelBadge xp={stats.xp} size="lg" />
        </div>
      </Card>

      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="stats" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Estatísticas
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-2">
            <Award className="w-4 h-4" />
            Conquistas
          </TabsTrigger>
          <TabsTrigger value="shop" className="gap-2">
            <ShoppingBag className="w-4 h-4" />
            Loja
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          {/* Grid de estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-4 text-center">
                <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">{stats.xp}</p>
                <p className="text-sm text-muted-foreground">XP Total</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-4 text-center">
                <Flame className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold">{stats.daily_streak}</p>
                <p className="text-sm text-muted-foreground">Dias Streak</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4 text-center">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{totalExercises}</p>
                <p className="text-sm text-muted-foreground">Exercícios</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-4 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold">{achievements}</p>
                <p className="text-sm text-muted-foreground">Conquistas</p>
              </Card>
            </motion.div>
          </div>

          {/* Meta Diária */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-primary" />
                <h3 className="font-semibold">Meta Diária</h3>
              </div>
              <Badge variant={goalPercent >= 100 ? "default" : "secondary"}>
                {dailyGoal.completed}/{dailyGoal.target} exercícios
              </Badge>
            </div>
            <Progress value={goalPercent} className="h-3" />
            {goalPercent >= 100 && (
              <p className="text-sm text-green-500 mt-2 text-center">
                🎉 Meta concluída! +50 XP
              </p>
            )}
          </Card>

          {/* Gráfico Semanal */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-primary" />
              <h3 className="font-semibold">Progresso Semanal</h3>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="xp"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <Card className="p-6 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-bold mb-2">{achievements} Conquistas</h3>
            <p className="text-muted-foreground">
              Visite a aba de Conquistas no menu principal para ver todas!
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="shop">
          <RewardShop userId={userId} userXp={stats.xp} onPurchase={loadData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProgressScreen;

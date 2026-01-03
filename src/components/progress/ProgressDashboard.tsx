import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  BookOpen,
  Clock,
  Target,
  Award,
  Lightbulb,
} from "lucide-react";
import { motion } from "framer-motion";

interface ProgressDashboardProps {
  userId: string;
}

interface SubjectProgress {
  subject: string;
  exercises: number;
  correct: number;
  avgScore: number;
}

interface WeeklyData {
  day: string;
  xp: number;
  exercises: number;
}

const ProgressDashboard = ({ userId }: ProgressDashboardProps) => {
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalTime: 0,
    totalExercises: 0,
    avgScore: 0,
    streak: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      // Load weekly exercise data
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: exercises } = await supabase
        .from("completed_exercises")
        .select("*")
        .eq("user_id", userId)
        .gte("completed_at", weekAgo);

      // Group by day
      const dailyMap: Record<string, WeeklyData> = {};
      const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dayName = days[date.getDay()];
        const dateKey = date.toISOString().split("T")[0];
        dailyMap[dateKey] = { day: dayName, xp: 0, exercises: 0 };
      }

      exercises?.forEach((ex) => {
        const dateKey = ex.completed_at?.split("T")[0];
        if (dateKey && dailyMap[dateKey]) {
          dailyMap[dateKey].xp += ex.xp_earned || 0;
          dailyMap[dateKey].exercises += 1;
        }
      });

      setWeeklyData(Object.values(dailyMap));

      // Load all-time exercises for subject breakdown
      const { data: allExercises } = await supabase
        .from("completed_exercises")
        .select("subject, score")
        .eq("user_id", userId);

      // Group by subject
      const subjectMap: Record<string, { count: number; totalScore: number }> = {};
      allExercises?.forEach((ex) => {
        if (!subjectMap[ex.subject]) {
          subjectMap[ex.subject] = { count: 0, totalScore: 0 };
        }
        subjectMap[ex.subject].count += 1;
        subjectMap[ex.subject].totalScore += ex.score || 0;
      });

      const subjectData = Object.entries(subjectMap).map(([subject, data]) => ({
        subject,
        exercises: data.count,
        correct: Math.round((data.totalScore / data.count) * data.count / 100),
        avgScore: Math.round(data.totalScore / data.count),
      }));

      setSubjectProgress(subjectData);

      // Calculate stats
      const totalExercises = allExercises?.length || 0;
      const avgScore = totalExercises > 0
        ? Math.round(allExercises!.reduce((sum, ex) => sum + (ex.score || 0), 0) / totalExercises)
        : 0;

      // Load streak
      const { data: progress } = await supabase
        .from("user_progress")
        .select("daily_streak")
        .eq("user_id", userId)
        .maybeSingle();

      setStats({
        totalTime: Math.round(totalExercises * 5), // Estimate 5 min per exercise
        totalExercises,
        avgScore,
        streak: progress?.daily_streak || 0,
      });

      // Generate insights
      const generatedInsights: string[] = [];
      
      if (subjectData.length > 0) {
        const bestSubject = subjectData.reduce((a, b) => a.avgScore > b.avgScore ? a : b);
        generatedInsights.push(`🏆 Você está mandando bem em ${bestSubject.subject} com média de ${bestSubject.avgScore}%!`);
      }

      const todayExercises = Object.values(dailyMap).slice(-1)[0]?.exercises || 0;
      if (todayExercises >= 3) {
        generatedInsights.push("🔥 Ótimo ritmo hoje! Continue assim!");
      }

      if (stats.streak >= 3) {
        generatedInsights.push(`📈 ${stats.streak} dias seguidos estudando! Você está criando um hábito!`);
      }

      if (avgScore >= 80) {
        generatedInsights.push("⭐ Sua média está excelente! Que tal tentar exercícios mais difíceis?");
      } else if (avgScore < 60 && totalExercises > 5) {
        generatedInsights.push("💪 Continue praticando! A persistência leva à perfeição.");
      }

      setInsights(generatedInsights);

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-[200px] bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-primary text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Dashboard de Progresso</h2>
            <p className="text-white/80">Acompanhe sua evolução</p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{stats.totalTime}m</p>
            <p className="text-sm text-muted-foreground">Tempo Total</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-4 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats.totalExercises}</p>
            <p className="text-sm text-muted-foreground">Exercícios</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{stats.avgScore}%</p>
            <p className="text-sm text-muted-foreground">Média</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-4 text-center">
            <Award className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{stats.streak}</p>
            <p className="text-sm text-muted-foreground">Dias Streak</p>
          </Card>
        </motion.div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold">Insights da Semana</h3>
          </div>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <p key={i} className="text-sm">{insight}</p>
            ))}
          </div>
        </Card>
      )}

      {/* Weekly Progress Chart */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Progresso Semanal (XP)</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="day" className="text-xs" />
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

      {/* Subject Breakdown */}
      {subjectProgress.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Desempenho por Matéria</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectProgress} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" domain={[0, 100]} className="text-xs" />
                <YAxis dataKey="subject" type="category" width={80} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProgressDashboard;

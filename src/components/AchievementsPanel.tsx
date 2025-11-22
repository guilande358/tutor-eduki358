import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned_at: string | null;
}

interface AchievementsPanelProps {
  userId: string;
}

const ALL_ACHIEVEMENTS = [
  // Início
  { id: "first_chat", title: "Primeira Conversa", description: "Iniciou sua primeira conversa com o tutor", icon: "💬", category: "inicio" },
  { id: "first_exercise", title: "Primeiro Exercício", description: "Completou seu primeiro exercício", icon: "📝", category: "inicio" },
  
  // Exercícios
  { id: "exercises_5", title: "Praticante Dedicado", description: "Completou 5 exercícios", icon: "🎯", category: "exercicios" },
  { id: "exercises_10", title: "Mestre dos Exercícios", description: "Completou 10 exercícios", icon: "🏆", category: "exercicios" },
  { id: "exercises_25", title: "Incansável", description: "Completou 25 exercícios", icon: "⭐", category: "exercicios" },
  
  // Streak
  { id: "streak_3", title: "Consistente", description: "Manteve uma sequência de 3 dias", icon: "🔥", category: "streak" },
  { id: "streak_7", title: "Semana Completa", description: "Manteve uma sequência de 7 dias", icon: "🌟", category: "streak" },
  { id: "streak_14", title: "Duas Semanas Fortes", description: "Manteve uma sequência de 14 dias", icon: "💪", category: "streak" },
  { id: "streak_30", title: "Mês Perfeito", description: "Manteve uma sequência de 30 dias", icon: "👑", category: "streak" },
  
  // KI
  { id: "ki_20", title: "Iniciante Completo", description: "Alcançou KI nível 20", icon: "🌱", category: "ki" },
  { id: "ki_50", title: "Intermediário", description: "Alcançou KI nível 50", icon: "🌿", category: "ki" },
  { id: "ki_80", title: "Avançado", description: "Alcançou KI nível 80", icon: "🌳", category: "ki" },
  { id: "ki_100", title: "Mestre Supremo", description: "Alcançou KI nível 100", icon: "🎓", category: "ki" },
  
  // XP
  { id: "xp_100", title: "Primeira Centena", description: "Alcançou 100 XP", icon: "⚡", category: "xp" },
  { id: "xp_500", title: "Meio Milhar", description: "Alcançou 500 XP", icon: "💫", category: "xp" },
  { id: "xp_1000", title: "Milhar", description: "Alcançou 1000 XP", icon: "🌟", category: "xp" },
  
  // Especiais
  { id: "perfect_score", title: "Perfeição", description: "Tirou nota 100 em um exercício", icon: "💯", category: "especial" },
  { id: "night_owl", title: "Coruja Noturna", description: "Estudou depois da meia-noite", icon: "🦉", category: "especial" },
  { id: "early_bird", title: "Madrugador", description: "Estudou antes das 6h da manhã", icon: "🐦", category: "especial" },
];

const AchievementsPanel = ({ userId }: AchievementsPanelProps) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar conquistas:", error);
    } finally {
      setLoading(false);
    }
  };

  const earnedTitles = new Set(achievements.map(a => a.title));
  const earnedAchievements = ALL_ACHIEVEMENTS.filter(a => earnedTitles.has(a.title));
  const lockedAchievements = ALL_ACHIEVEMENTS.filter(a => !earnedTitles.has(a.title));

  const getAchievementsByCategory = (category: string, list: typeof ALL_ACHIEVEMENTS) => {
    return list.filter(a => a.category === category);
  };

  const categories = [
    { id: "all", label: "Todas", icon: "🏆" },
    { id: "inicio", label: "Início", icon: "🎯" },
    { id: "exercicios", label: "Exercícios", icon: "📝" },
    { id: "streak", label: "Sequência", icon: "🔥" },
    { id: "ki", label: "Nível KI", icon: "🌱" },
    { id: "xp", label: "Experiência", icon: "⚡" },
    { id: "especial", label: "Especiais", icon: "✨" },
  ];

  const AchievementCard = ({ achievement, isLocked }: { achievement: any; isLocked: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`p-4 ${
          isLocked
            ? "bg-muted/50 border-muted"
            : "bg-gradient-card border-primary/20 shadow-md hover:shadow-lg transition-shadow"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`text-4xl ${
              isLocked ? "grayscale opacity-40" : ""
            }`}
          >
            {isLocked ? <Lock className="w-10 h-10 text-muted-foreground" /> : achievement.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4
                className={`font-semibold ${
                  isLocked ? "text-muted-foreground" : ""
                }`}
              >
                {achievement.title}
              </h4>
              {!isLocked && (
                <Badge variant="secondary" className="text-xs">
                  Conquistado
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {achievement.description}
            </p>
            {!isLocked && achievement.earned_at && (
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(achievement.earned_at).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <Card className="p-6 bg-gradient-primary text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Suas Conquistas</h2>
            <p className="text-white/90">
              {earnedAchievements.length} de {ALL_ACHIEVEMENTS.length} desbloqueadas
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">
              {Math.round((earnedAchievements.length / ALL_ACHIEVEMENTS.length) * 100)}%
            </div>
            <p className="text-sm text-white/80">Progresso</p>
          </div>
        </div>
      </Card>

      {/* Conquistas por categoria */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid grid-cols-7 w-full">
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
              <span className="hidden sm:inline">{cat.label}</span>
              <span className="sm:hidden">{cat.icon}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id}>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>{cat.icon}</span>
                {cat.label}
              </h3>

              {/* Conquistadas */}
              {getAchievementsByCategory(
                cat.id === "all" ? "" : cat.id,
                earnedAchievements
              ).length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Conquistadas ({getAchievementsByCategory(cat.id === "all" ? "" : cat.id, earnedAchievements).length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                      {(cat.id === "all"
                        ? earnedAchievements
                        : getAchievementsByCategory(cat.id, earnedAchievements)
                      ).map((achievement) => {
                        const fullAchievement = achievements.find(
                          (a) => a.title === achievement.title
                        );
                        return (
                          <AchievementCard
                            key={achievement.id}
                            achievement={{ ...achievement, earned_at: fullAchievement?.earned_at }}
                            isLocked={false}
                          />
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Bloqueadas */}
              {getAchievementsByCategory(
                cat.id === "all" ? "" : cat.id,
                lockedAchievements
              ).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Bloqueadas ({getAchievementsByCategory(cat.id === "all" ? "" : cat.id, lockedAchievements).length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(cat.id === "all"
                      ? lockedAchievements
                      : getAchievementsByCategory(cat.id, lockedAchievements)
                    ).map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        isLocked={true}
                      />
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AchievementsPanel;

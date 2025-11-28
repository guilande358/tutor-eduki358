import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Dumbbell, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HomePanelProps {
  userId: string;
  onStartExercise: () => void;
  onContinueStudying: () => void;
}

const motivationalPhrases = [
  "Conhecimento é poder! Continue aprendendo hoje! 💪",
  "Cada exercício te deixa mais forte! Vamos lá! 🚀",
  "A jornada de mil milhas começa com um passo. Estude hoje! 🌟",
  "Você está construindo seu futuro agora! Continue! ✨",
  "Pequenos passos levam a grandes conquistas! 📚",
  "Seu cérebro está ficando cada vez mais forte! 🧠",
  "O sucesso é a soma de pequenos esforços. Continue! 🎯",
];

const HomePanel = ({ userId, onStartExercise, onContinueStudying }: HomePanelProps) => {
  const [dailyGoal, setDailyGoal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phrase] = useState(() => 
    motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)]
  );

  useEffect(() => {
    fetchDailyGoal();
  }, [userId]);

  const fetchDailyGoal = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Criar meta do dia se não existir
      await supabase.rpc('create_daily_goal_if_not_exists', { p_user_id: userId });

      // Buscar meta do dia
      const { data, error: fetchError } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('goal_date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (data) setDailyGoal(data);
    } catch (err) {
      console.error('Erro ao buscar meta diária:', err);
      setError('Não foi possível carregar a meta diária');
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = dailyGoal 
    ? (dailyGoal.completed_exercises / dailyGoal.target_exercises) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Card Motivacional Grande */}
      <Card className="p-8 bg-gradient-primary text-white shadow-glow relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8" />
            <h2 className="text-3xl font-bold">Bem-vindo de volta!</h2>
          </div>
          
          <p className="text-xl text-white/90 font-medium">{phrase}</p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              onClick={onContinueStudying}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 text-lg font-bold py-6 px-8 shadow-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Continuar Estudando
            </Button>
            <Button
              onClick={onStartExercise}
              size="lg"
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 text-lg font-semibold py-6 px-8"
            >
              <Dumbbell className="w-5 h-5 mr-2" />
              Novo Exercício
            </Button>
          </div>
        </div>
      </Card>

      {/* Meta Diária */}
      {loading ? (
        <Card className="p-6 bg-gradient-card shadow-md">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </Card>
      ) : error ? (
        <Card className="p-6 bg-destructive/10 border-destructive/20 shadow-md">
          <p className="text-sm text-destructive text-center">{error}</p>
        </Card>
      ) : dailyGoal && (
        <Card className="p-6 bg-gradient-card shadow-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Meta Diária</h3>
                  <p className="text-sm text-muted-foreground">
                    {dailyGoal.completed_exercises} de {dailyGoal.target_exercises} exercícios
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-secondary">{Math.round(progressPercentage)}%</p>
                <p className="text-xs text-muted-foreground">concluído</p>
              </div>
            </div>
            
            <Progress value={progressPercentage} className="h-3" />
            
            {dailyGoal.is_completed && (
              <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3">
                <p className="text-sm font-medium text-secondary text-center">
                  🎉 Meta diária concluída! +{dailyGoal.xp_reward} XP
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default HomePanel;

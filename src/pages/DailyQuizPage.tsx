import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy, Sparkles, Star, Loader2, Settings } from "lucide-react";
import QuizQuestion from "@/components/QuizQuestion";
import { useDailyQuiz } from "@/hooks/useDailyQuiz";
import { motion, AnimatePresence } from "framer-motion";

const DailyQuizPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [rewards, setRewards] = useState<{ xp: number; credits: number } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const {
    preferences,
    todaySession,
    loading,
    generating,
    generateQuiz,
    submitAnswer,
    completeQuiz,
    hasPreferences,
    hasActiveQuiz,
    isQuizCompleted,
  } = useDailyQuiz(userId || "");

  const handleStartQuiz = async () => {
    await generateQuiz();
    setCurrentQuestionIndex(0);
  };

  const handleAnswer = async (answer: number | boolean | string) => {
    return await submitAnswer(currentQuestionIndex, answer);
  };

  const handleNext = async () => {
    if (todaySession && currentQuestionIndex < todaySession.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Quiz finished
      const result = await completeQuiz();
      setRewards(result);
      setShowResults(true);
    }
  };

  if (!userId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Results screen
  if (showResults || isQuizCompleted) {
    const session = todaySession;
    const score = session?.score || 0;
    const total = session?.total_questions || 0;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
        <div className="max-w-lg mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao início
          </Button>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-8 text-center">
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Quiz Concluído! 🎉</h1>
                <p className="text-muted-foreground">
                  Você completou o desafio diário
                </p>
              </div>

              <div className="mb-6">
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  {percentage}%
                </div>
                <p className="text-muted-foreground">
                  {score} de {total} questões corretas
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl">
                  <Sparkles className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">
                    +{rewards?.xp || session?.xp_reward || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">XP ganho</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-xl">
                  <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">
                    +{rewards?.credits || session?.credits_reward || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Créditos</p>
                </div>
              </div>

              {percentage === 100 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-200">
                  <p className="text-green-600 font-medium">
                    🏆 Perfeito! Você acertou todas!
                  </p>
                </div>
              )}

              <Button onClick={() => navigate("/")} className="w-full" size="lg">
                Voltar ao EduKI
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Quiz in progress
  if (hasActiveQuiz && todaySession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sair
            </Button>
            <div className="text-sm font-medium">
              {todaySession.subject} • {todaySession.difficulty}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <QuizQuestion
                question={todaySession.questions[currentQuestionIndex]}
                questionIndex={currentQuestionIndex}
                totalQuestions={todaySession.total_questions}
                onAnswer={handleAnswer}
                onNext={handleNext}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Start screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
      <div className="max-w-lg mx-auto">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Desafio Diário</h1>
          <p className="text-muted-foreground mb-6">
            {hasPreferences && preferences
              ? `${preferences.exercises_per_quiz} questões de ${preferences.favorite_subject} (${preferences.difficulty_level})`
              : "Configure suas preferências para começar"}
          </p>

          {hasPreferences ? (
            <div className="space-y-3">
              <Button
                onClick={handleStartQuiz}
                className="w-full bg-gradient-primary"
                size="lg"
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando Quiz...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Iniciar Quiz
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/quiz-setup")}
                className="w-full"
              >
                <Settings className="w-4 h-4 mr-2" />
                Alterar Configurações
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => navigate("/quiz-setup")}
              className="w-full bg-gradient-primary"
              size="lg"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurar Metas
            </Button>
          )}

          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium mb-3">Recompensas</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-bold text-primary">+50-100 XP</p>
                <p className="text-muted-foreground">Por completar</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-bold text-yellow-600">+1 Crédito</p>
                <p className="text-muted-foreground">100% correto</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DailyQuizPage;

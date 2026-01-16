import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Zap, Trophy, ChevronRight } from "lucide-react";
import { useDailyQuiz } from "@/hooks/useDailyQuiz";
import { useUIPreferences } from "@/hooks/useUIPreferences";

interface DailyQuizBannerProps {
  userId: string;
}

const DailyQuizBanner = ({ userId }: DailyQuizBannerProps) => {
  const navigate = useNavigate();
  const { preferences, todaySession, hasPreferences, isQuizCompleted } = useDailyQuiz(userId);
  const { shouldShowBanner, hideBannerForToday } = useUIPreferences(userId);
  const [isVisible, setIsVisible] = useState(true);

  // Não mostrar se já completou o quiz ou escondeu o banner
  if (!isVisible || !shouldShowBanner() || isQuizCompleted) {
    return null;
  }

  const handleDismiss = async () => {
    setIsVisible(false);
    await hideBannerForToday();
  };

  const handleStart = () => {
    if (hasPreferences) {
      navigate("/daily-quiz");
    } else {
      navigate("/quiz-setup");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 p-4 mb-6 shadow-lg">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full blur-2xl" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-yellow-300 rounded-full blur-3xl" />
      </div>

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="text-white">
            <h3 className="font-bold text-lg flex items-center gap-2">
              Desafio do Dia
              <Trophy className="w-4 h-4 text-yellow-300" />
            </h3>
            <p className="text-sm text-white/90">
              {hasPreferences && preferences
                ? `Complete ${preferences.exercises_per_quiz} exercícios de ${preferences.favorite_subject}!`
                : "Configure seu quiz diário e ganhe recompensas!"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleStart}
            className="bg-white text-purple-600 hover:bg-white/90 font-semibold"
            size="sm"
          >
            {hasPreferences ? "Iniciar" : "Configurar"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress indicator if quiz in progress */}
      {todaySession && !todaySession.is_completed && (
        <div className="relative mt-3">
          <div className="flex items-center justify-between text-xs text-white/80 mb-1">
            <span>Progresso</span>
            <span>{todaySession.answers.length}/{todaySession.total_questions}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{
                width: `${(todaySession.answers.length / todaySession.total_questions) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyQuizBanner;

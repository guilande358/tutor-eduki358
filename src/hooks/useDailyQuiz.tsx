import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "true_false" | "fill_blank";
  question: string;
  options?: string[];
  correctAnswer: number | boolean | string;
  explanation: string;
}

export interface QuizPreferences {
  favorite_subject: string;
  difficulty_level: string;
  exercises_per_quiz: number;
  question_types: string[];
}

export interface QuizSession {
  id: string;
  quiz_date: string;
  subject: string;
  difficulty: string;
  questions: QuizQuestion[];
  answers: (number | boolean | string)[];
  score: number;
  total_questions: number;
  is_completed: boolean;
  xp_reward: number;
  credits_reward: number;
}

export const useDailyQuiz = (userId: string) => {
  const [preferences, setPreferences] = useState<QuizPreferences | null>(null);
  const [todaySession, setTodaySession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const fetchPreferences = useCallback(async () => {
    const { data, error } = await supabase
      .from("user_quiz_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching quiz preferences:", error);
      return null;
    }

    if (data) {
      setPreferences({
        favorite_subject: data.favorite_subject,
        difficulty_level: data.difficulty_level,
        exercises_per_quiz: data.exercises_per_quiz,
        question_types: data.question_types || ["multiple_choice"],
      });
    }
    return data;
  }, [userId]);

  const fetchTodaySession = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    
    const { data, error } = await supabase
      .from("daily_quiz_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("quiz_date", today)
      .maybeSingle();

    if (error) {
      console.error("Error fetching today's session:", error);
      return null;
    }

    if (data) {
      setTodaySession({
        id: data.id,
        quiz_date: data.quiz_date,
        subject: data.subject,
        difficulty: data.difficulty,
        questions: (data.questions as unknown) as QuizQuestion[],
        answers: (data.answers as unknown) as (number | boolean | string)[],
        score: data.score || 0,
        total_questions: data.total_questions,
        is_completed: data.is_completed || false,
        xp_reward: data.xp_reward || 0,
        credits_reward: data.credits_reward || 0,
      });
    }
    return data;
  }, [userId]);

  const savePreferences = async (newPrefs: QuizPreferences) => {
    const { error } = await supabase
      .from("user_quiz_preferences")
      .upsert({
        user_id: userId,
        ...newPrefs,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      toast({
        title: "Erro ao salvar preferências",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    setPreferences(newPrefs);
    toast({
      title: "Preferências salvas! ✅",
      description: "Seu quiz diário será personalizado",
    });
    return true;
  };

  const generateQuiz = async () => {
    if (!preferences) {
      toast({
        title: "Configure suas preferências",
        description: "Defina sua matéria favorita primeiro",
        variant: "destructive",
      });
      return null;
    }

    setGenerating(true);

    try {
      // Buscar histórico de erros para adaptar dificuldade
      const { data: wrongAnswers } = await supabase
        .from("wrong_answers")
        .select("subject, topic, difficulty")
        .eq("user_id", userId)
        .eq("subject", preferences.favorite_subject)
        .order("created_at", { ascending: false })
        .limit(20);

      // Chamar edge function para gerar quiz
      const { data, error } = await supabase.functions.invoke("generate-daily-quiz", {
        body: {
          subject: preferences.favorite_subject,
          difficulty: preferences.difficulty_level,
          questionCount: preferences.exercises_per_quiz,
          questionTypes: preferences.question_types,
          weakTopics: wrongAnswers?.map((w) => w.topic) || [],
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      // Salvar sessão no banco
      const today = new Date().toISOString().split("T")[0];
      const { data: sessionData, error: sessionError } = await supabase
        .from("daily_quiz_sessions")
        .upsert({
          user_id: userId,
          quiz_date: today,
          subject: preferences.favorite_subject,
          difficulty: preferences.difficulty_level,
          questions: data.questions,
          total_questions: data.questions.length,
          answers: [],
          score: 0,
          is_completed: false,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const session: QuizSession = {
        id: sessionData.id,
        quiz_date: sessionData.quiz_date,
        subject: sessionData.subject,
        difficulty: sessionData.difficulty,
        questions: data.questions,
        answers: [],
        score: 0,
        total_questions: data.questions.length,
        is_completed: false,
        xp_reward: 0,
        credits_reward: 0,
      };

      setTodaySession(session);
      return session;
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      toast({
        title: "Erro ao gerar quiz",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const submitAnswer = async (questionIndex: number, answer: number | boolean | string) => {
    if (!todaySession) return;

    const newAnswers = [...todaySession.answers];
    newAnswers[questionIndex] = answer;

    const question = todaySession.questions[questionIndex];
    const isCorrect = question.correctAnswer === answer;
    const newScore = isCorrect ? todaySession.score + 1 : todaySession.score;

    await supabase
      .from("daily_quiz_sessions")
      .update({
        answers: newAnswers,
        score: newScore,
      })
      .eq("id", todaySession.id);

    // Se errou, salvar em wrong_answers
    if (!isCorrect && question.type === "multiple_choice") {
      await supabase.from("wrong_answers").insert({
        user_id: userId,
        question: question.question,
        options: question.options || [],
        correct_answer: question.correctAnswer as number,
        user_answer: answer as number,
        subject: todaySession.subject,
        topic: todaySession.subject,
        difficulty: todaySession.difficulty,
        explanation: question.explanation,
      });
    }

    setTodaySession((prev) =>
      prev
        ? {
            ...prev,
            answers: newAnswers,
            score: newScore,
          }
        : null
    );

    return isCorrect;
  };

  const completeQuiz = async () => {
    if (!todaySession) return null;

    // Calcular recompensas
    const baseXP = 50;
    const bonusXP = todaySession.score * 10;
    const totalXP = baseXP + bonusXP;
    const creditsReward = todaySession.score === todaySession.total_questions ? 1 : 0;

    // Atualizar sessão
    await supabase
      .from("daily_quiz_sessions")
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        xp_reward: totalXP,
        credits_reward: creditsReward,
      })
      .eq("id", todaySession.id);

    // Adicionar XP ao usuário
    const { data: progress } = await supabase
      .from("user_progress")
      .select("xp, credits, daily_streak")
      .eq("user_id", userId)
      .maybeSingle();

    if (progress) {
      await supabase
        .from("user_progress")
        .update({
          xp: (progress.xp || 0) + totalXP,
          credits: (progress.credits || 0) + creditsReward,
        })
        .eq("user_id", userId);
    }

    setTodaySession((prev) =>
      prev
        ? {
            ...prev,
            is_completed: true,
            xp_reward: totalXP,
            credits_reward: creditsReward,
          }
        : null
    );

    return { xp: totalXP, credits: creditsReward };
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchPreferences();
      await fetchTodaySession();
      setLoading(false);
    };
    init();
  }, [userId, fetchPreferences, fetchTodaySession]);

  return {
    preferences,
    todaySession,
    loading,
    generating,
    savePreferences,
    generateQuiz,
    submitAnswer,
    completeQuiz,
    hasPreferences: !!preferences,
    hasActiveQuiz: !!todaySession && !todaySession.is_completed,
    isQuizCompleted: todaySession?.is_completed || false,
    refetch: async () => {
      await fetchPreferences();
      await fetchTodaySession();
    },
  };
};

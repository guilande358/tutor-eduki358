import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: string;
}

const ACHIEVEMENTS: Achievement[] = [
  // Conquistas de início
  {
    id: "first_chat",
    title: "Primeira Conversa",
    description: "Iniciou sua primeira conversa com o tutor",
    icon: "💬",
    xp_reward: 10,
    category: "inicio"
  },
  {
    id: "first_exercise",
    title: "Primeiro Exercício",
    description: "Completou seu primeiro exercício",
    icon: "📝",
    xp_reward: 20,
    category: "exercicios"
  },
  
  // Conquistas de exercícios
  {
    id: "exercises_5",
    title: "Praticante Dedicado",
    description: "Completou 5 exercícios",
    icon: "🎯",
    xp_reward: 50,
    category: "exercicios"
  },
  {
    id: "exercises_10",
    title: "Mestre dos Exercícios",
    description: "Completou 10 exercícios",
    icon: "🏆",
    xp_reward: 100,
    category: "exercicios"
  },
  {
    id: "exercises_25",
    title: "Incansável",
    description: "Completou 25 exercícios",
    icon: "⭐",
    xp_reward: 200,
    category: "exercicios"
  },
  
  // Conquistas de streak
  {
    id: "streak_3",
    title: "Consistente",
    description: "Manteve uma sequência de 3 dias",
    icon: "🔥",
    xp_reward: 30,
    category: "streak"
  },
  {
    id: "streak_7",
    title: "Semana Completa",
    description: "Manteve uma sequência de 7 dias",
    icon: "🌟",
    xp_reward: 70,
    category: "streak"
  },
  {
    id: "streak_14",
    title: "Duas Semanas Fortes",
    description: "Manteve uma sequência de 14 dias",
    icon: "💪",
    xp_reward: 150,
    category: "streak"
  },
  {
    id: "streak_30",
    title: "Mês Perfeito",
    description: "Manteve uma sequência de 30 dias",
    icon: "👑",
    xp_reward: 300,
    category: "streak"
  },
  
  // Conquistas de KI
  {
    id: "ki_20",
    title: "Iniciante Completo",
    description: "Alcançou KI nível 20",
    icon: "🌱",
    xp_reward: 50,
    category: "ki"
  },
  {
    id: "ki_50",
    title: "Intermediário",
    description: "Alcançou KI nível 50",
    icon: "🌿",
    xp_reward: 100,
    category: "ki"
  },
  {
    id: "ki_80",
    title: "Avançado",
    description: "Alcançou KI nível 80",
    icon: "🌳",
    xp_reward: 200,
    category: "ki"
  },
  {
    id: "ki_100",
    title: "Mestre Supremo",
    description: "Alcançou KI nível 100",
    icon: "🎓",
    xp_reward: 500,
    category: "ki"
  },
  
  // Conquistas de XP
  {
    id: "xp_100",
    title: "Primeira Centena",
    description: "Alcançou 100 XP",
    icon: "⚡",
    xp_reward: 25,
    category: "xp"
  },
  {
    id: "xp_500",
    title: "Meio Milhar",
    description: "Alcançou 500 XP",
    icon: "💫",
    xp_reward: 50,
    category: "xp"
  },
  {
    id: "xp_1000",
    title: "Milhar",
    description: "Alcançou 1000 XP",
    icon: "🌟",
    xp_reward: 100,
    category: "xp"
  },
  
  // Conquistas especiais
  {
    id: "perfect_score",
    title: "Perfeição",
    description: "Tirou nota 100 em um exercício",
    icon: "💯",
    xp_reward: 75,
    category: "especial"
  },
  {
    id: "night_owl",
    title: "Coruja Noturna",
    description: "Estudou depois da meia-noite",
    icon: "🦉",
    xp_reward: 30,
    category: "especial"
  },
  {
    id: "early_bird",
    title: "Madrugador",
    description: "Estudou antes das 6h da manhã",
    icon: "🐦",
    xp_reward: 30,
    category: "especial"
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extrair o token JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user');
    }

    const userId = user.id;
    console.log('Checking achievements for user:', userId);

    // Buscar dados do usuário
    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: completedExercises } = await supabase
      .from('completed_exercises')
      .select('*')
      .eq('user_id', userId);

    const { data: chatMessages } = await supabase
      .from('chat_messages')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('role', 'user');

    const { data: existingAchievements } = await supabase
      .from('achievements')
      .select('title')
      .eq('user_id', userId);

    const earnedTitles = new Set(existingAchievements?.map(a => a.title) || []);
    const newAchievements: Achievement[] = [];

    // Verificar conquistas
    const exerciseCount = completedExercises?.length || 0;
    const hasChat = (chatMessages?.length || 0) > 0;
    const kiLevel = progress?.ki_level || 0;
    const xp = progress?.xp || 0;
    const streak = progress?.daily_streak || 0;
    const hasPerfectScore = completedExercises?.some(e => e.score === 100) || false;

    // Verificar hora de estudo
    const now = new Date();
    const hour = now.getHours();
    const isNightOwl = hour >= 0 && hour < 6;
    const isEarlyBird = hour >= 4 && hour < 7;

    // Verificar cada conquista
    for (const achievement of ACHIEVEMENTS) {
      if (earnedTitles.has(achievement.title)) continue;

      let shouldEarn = false;

      switch (achievement.id) {
        case "first_chat":
          shouldEarn = hasChat;
          break;
        case "first_exercise":
          shouldEarn = exerciseCount >= 1;
          break;
        case "exercises_5":
          shouldEarn = exerciseCount >= 5;
          break;
        case "exercises_10":
          shouldEarn = exerciseCount >= 10;
          break;
        case "exercises_25":
          shouldEarn = exerciseCount >= 25;
          break;
        case "streak_3":
          shouldEarn = streak >= 3;
          break;
        case "streak_7":
          shouldEarn = streak >= 7;
          break;
        case "streak_14":
          shouldEarn = streak >= 14;
          break;
        case "streak_30":
          shouldEarn = streak >= 30;
          break;
        case "ki_20":
          shouldEarn = kiLevel >= 20;
          break;
        case "ki_50":
          shouldEarn = kiLevel >= 50;
          break;
        case "ki_80":
          shouldEarn = kiLevel >= 80;
          break;
        case "ki_100":
          shouldEarn = kiLevel >= 100;
          break;
        case "xp_100":
          shouldEarn = xp >= 100;
          break;
        case "xp_500":
          shouldEarn = xp >= 500;
          break;
        case "xp_1000":
          shouldEarn = xp >= 1000;
          break;
        case "perfect_score":
          shouldEarn = hasPerfectScore;
          break;
        case "night_owl":
          shouldEarn = isNightOwl;
          break;
        case "early_bird":
          shouldEarn = isEarlyBird;
          break;
      }

      if (shouldEarn) {
        newAchievements.push(achievement);
      }
    }

    // Inserir novas conquistas
    if (newAchievements.length > 0) {
      const achievementsToInsert = newAchievements.map(a => ({
        user_id: userId,
        title: a.title,
        description: a.description,
        icon: a.icon,
      }));

      const { error: insertError } = await supabase
        .from('achievements')
        .insert(achievementsToInsert);

      if (insertError) {
        console.error('Error inserting achievements:', insertError);
      } else {
        // Adicionar XP das conquistas
        const totalXpReward = newAchievements.reduce((sum, a) => sum + a.xp_reward, 0);
        if (totalXpReward > 0) {
          await supabase
            .from('user_progress')
            .update({ xp: (progress?.xp || 0) + totalXpReward })
            .eq('user_id', userId);
        }

        console.log(`Awarded ${newAchievements.length} new achievements with ${totalXpReward} XP`);
      }
    }

    return new Response(
      JSON.stringify({ 
        newAchievements: newAchievements.map(a => ({
          title: a.title,
          description: a.description,
          icon: a.icon,
          xp_reward: a.xp_reward,
        })),
        totalXpReward: newAchievements.reduce((sum, a) => sum + a.xp_reward, 0),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-achievements function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

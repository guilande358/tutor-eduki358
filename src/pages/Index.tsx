import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HomePanel from "@/components/HomePanel";
import TutorChat from "@/components/TutorChat";
import ExercisePanel from "@/components/ExercisePanel";
import AchievementsPanel from "@/components/AchievementsPanel";
import WrongAnswersPanel from "@/components/WrongAnswersPanel";
import LivesTimer from "@/components/LivesTimer";
import ProfileDrawer from "@/components/ProfileDrawer";
import { GraduationCap, LogOut, MessageSquare, Dumbbell, Trophy, AlertCircle, Home } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAchievements } from "@/hooks/useAchievements";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [kiLevel, setKiLevel] = useState(0);
  const [currentLives, setCurrentLives] = useState(3);
  const [activeTab, setActiveTab] = useState("home");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Hook para verificar conquistas automaticamente
  useAchievements(user?.id || "");

  useEffect(() => {
    // Aplicar tema salvo
    const applyTheme = async () => {
      if (user) {
        const { data } = await supabase
          .from('user_progress')
          .select('theme')
          .eq('user_id', user.id)
          .single();
        
        if (data?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      }
    };
    applyTheme();

    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, user?.id]);

  useEffect(() => {
    if (user) {
      fetchKiLevel();
    }
  }, [user]);

  const fetchKiLevel = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_progress')
      .select('ki_level, lives')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setKiLevel(data.ki_level);
      setCurrentLives(data.lives || 3);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Até logo! 👋",
      description: "Você foi desconectado com sucesso",
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-xl">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  EduKI
                </h1>
                <p className="text-xs text-muted-foreground">Seu tutor de IA</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ProfileDrawer userId={user.id} />
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Timer de Vidas */}
        {currentLives < 5 && (
          <div className="max-w-4xl mx-auto mb-6">
            <LivesTimer
              userId={user.id}
              currentLives={currentLives}
              onLivesUpdate={fetchKiLevel}
              kiLevel={kiLevel}
            />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-5 h-12">
            <TabsTrigger value="home" className="gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Início</span>
            </TabsTrigger>
            <TabsTrigger value="tutor" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Tutor</span>
            </TabsTrigger>
            <TabsTrigger value="exercises" className="gap-2">
              <Dumbbell className="w-4 h-4" />
              <span className="hidden sm:inline">Exercícios</span>
            </TabsTrigger>
            <TabsTrigger value="wrong-answers" className="gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Meus Erros</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Conquistas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="max-w-4xl mx-auto">
            <HomePanel
              userId={user.id}
              onStartExercise={() => setActiveTab("exercises")}
              onContinueStudying={() => setActiveTab("tutor")}
            />
          </TabsContent>

          <TabsContent value="tutor" className="max-w-4xl mx-auto">
            <TutorChat userId={user.id} kiLevel={kiLevel} />
          </TabsContent>

          <TabsContent value="exercises" className="max-w-4xl mx-auto">
            <ExercisePanel userId={user.id} kiLevel={kiLevel} />
          </TabsContent>

          <TabsContent value="wrong-answers" className="max-w-4xl mx-auto">
            <WrongAnswersPanel userId={user.id} />
          </TabsContent>

          <TabsContent value="achievements" className="max-w-6xl mx-auto">
            <AchievementsPanel userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
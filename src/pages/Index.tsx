import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import ProgressScreen from "@/components/progress/ProgressScreen";
import LearningProfile from "@/components/LearningProfile";
import ProgressDashboard from "@/components/progress/ProgressDashboard";
import DailyChallengeCard from "@/components/progress/DailyChallengeCard";
import StudyRoomPage from "@/components/study-room/StudyRoomPage";
import PremiumSubscription from "@/components/PremiumSubscription";
import NotificationSettings from "@/components/NotificationSettings";
import { 
  GraduationCap, LogOut, MessageSquare, Dumbbell, Trophy, 
  AlertCircle, Home, TrendingUp, Users, User as UserIcon, Crown, Bell
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAchievements } from "@/hooks/useAchievements";
import { useNotifications } from "@/hooks/useNotifications";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState("Estudante");
  const [kiLevel, setKiLevel] = useState(0);
  const [currentLives, setCurrentLives] = useState(3);
  const [activeTab, setActiveTab] = useState("home");
  const [showStudyRoom, setShowStudyRoom] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Hook para verificar conquistas automaticamente
  useAchievements(user?.id || "");

  // Check if coming from study room link
  useEffect(() => {
    const roomCode = searchParams.get("code");
    if (roomCode && user) {
      setShowStudyRoom(true);
    }
  }, [searchParams, user]);

  useEffect(() => {
    // Aplicar tema salvo
    const applyTheme = async () => {
      if (user) {
        const { data } = await supabase
          .from('user_progress')
          .select('theme')
          .eq('user_id', user.id)
          .maybeSingle();
        
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
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    // Fetch progress
    const { data: progress } = await supabase
      .from('user_progress')
      .select('ki_level, lives')
      .eq('user_id', user.id)
      .maybeSingle();

    if (progress) {
      setKiLevel(progress.ki_level || 0);
      setCurrentLives(progress.lives || 3);
    }

    // Fetch profile name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.full_name) {
      setUserName(profile.full_name);
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

  // Show Study Room as full page
  if (showStudyRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-primary rounded-xl">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    EduKI
                  </h1>
                  <p className="text-xs text-muted-foreground">Sala de Estudo</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-4">
          <StudyRoomPage 
            userId={user.id} 
            userName={userName}
            onBack={() => setShowStudyRoom(false)} 
          />
        </main>
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  EduKI
                </h1>
                <p className="text-xs text-muted-foreground">Seu tutor de IA</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowPremium(true)}
                variant="outline"
                size="sm"
                className="gap-2 hidden sm:flex bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border-yellow-500/50 hover:border-yellow-500"
              >
                <Crown className="w-4 h-4 text-yellow-500" />
                Premium
              </Button>
              <Button
                onClick={() => setShowStudyRoom(true)}
                variant="outline"
                size="sm"
                className="gap-2 hidden sm:flex"
              >
                <Users className="w-4 h-4" />
                Sala de Estudo
              </Button>
              <ProfileDrawer userId={user.id} />
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
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
              onLivesUpdate={fetchUserData}
              kiLevel={kiLevel}
            />
          </div>
        )}

        {/* Daily Challenge Card */}
        <div className="max-w-4xl mx-auto mb-6">
          <DailyChallengeCard 
            userId={user.id} 
            onStartChallenge={() => setActiveTab("exercises")} 
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-4 sm:grid-cols-8 h-auto gap-1">
            <TabsTrigger value="home" className="gap-1 text-xs sm:text-sm py-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Início</span>
            </TabsTrigger>
            <TabsTrigger value="tutor" className="gap-1 text-xs sm:text-sm py-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Tutor</span>
            </TabsTrigger>
            <TabsTrigger value="exercises" className="gap-1 text-xs sm:text-sm py-2">
              <Dumbbell className="w-4 h-4" />
              <span className="hidden sm:inline">Exercícios</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-1 text-xs sm:text-sm py-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Progresso</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-1 text-xs sm:text-sm py-2 hidden sm:flex">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="wrong-answers" className="gap-1 text-xs sm:text-sm py-2 hidden sm:flex">
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Erros</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-1 text-xs sm:text-sm py-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Conquistas</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1 text-xs sm:text-sm py-2 hidden sm:flex">
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1 text-xs sm:text-sm py-2 hidden sm:flex">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Alertas</span>
            </TabsTrigger>
          </TabsList>

          {/* Mobile-only button for Study Room */}
          <div className="sm:hidden flex justify-center">
            <Button
              onClick={() => setShowStudyRoom(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              Sala de Estudo
            </Button>
          </div>

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

          <TabsContent value="progress" className="max-w-4xl mx-auto">
            <ProgressScreen userId={user.id} />
          </TabsContent>

          <TabsContent value="dashboard" className="max-w-4xl mx-auto">
            <ProgressDashboard userId={user.id} />
          </TabsContent>

          <TabsContent value="wrong-answers" className="max-w-4xl mx-auto">
            <WrongAnswersPanel userId={user.id} />
          </TabsContent>

          <TabsContent value="achievements" className="max-w-6xl mx-auto">
            <AchievementsPanel userId={user.id} />
          </TabsContent>

          <TabsContent value="profile" className="max-w-4xl mx-auto">
            <LearningProfile userId={user.id} />
          </TabsContent>

          <TabsContent value="notifications" className="max-w-4xl mx-auto">
            <NotificationSettings userId={user.id} />
          </TabsContent>
        </Tabs>

        {/* Premium Modal */}
        {showPremium && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-auto">
            <div className="container mx-auto px-4 py-8 max-w-2xl">
              <PremiumSubscription userId={user.id} onBack={() => setShowPremium(false)} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;

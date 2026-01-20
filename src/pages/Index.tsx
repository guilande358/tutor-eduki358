import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import TutorChat from "@/components/TutorChat";
import ExercisePanel from "@/components/ExercisePanel";
import StudyRoomPage from "@/components/study-room/StudyRoomPage";
import PremiumSubscription from "@/components/PremiumSubscription";
import ProgressScreen from "@/components/progress/ProgressScreen";
import ProgressDashboard from "@/components/progress/ProgressDashboard";
import AchievementsPanel from "@/components/AchievementsPanel";
import WrongAnswersPanel from "@/components/WrongAnswersPanel";
import LearningProfile from "@/components/LearningProfile";
import NotificationSettings from "@/components/NotificationSettings";
import SuggestionsPanel from "@/components/SuggestionsPanel";
import SpacedReview from "@/components/SpacedReview";
import UnityAdsBanner from "@/components/UnityAdsBanner";
import Footer from "@/components/Footer";
import { useUIPreferences } from "@/hooks/useUIPreferences";
import { 
  GraduationCap, Menu, Bell, HelpCircle, Sparkles, 
  Zap, Dumbbell, TrendingUp, ArrowLeft,
  Trophy, AlertCircle, Brain
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAchievements } from "@/hooks/useAchievements";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState("Estudante");
  const [kiLevel, setKiLevel] = useState(0);
  const [showStudyRoom, setShowStudyRoom] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("chat");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Hook para verificar conquistas automaticamente
  useAchievements(user?.id || "");
  
  // UI Preferences for chat mode
  const { chatMode, setChatMode, loading: prefsLoading } = useUIPreferences(user?.id || "");

  // Check if coming from menu or study room link
  useEffect(() => {
    const tab = searchParams.get("tab");
    const roomCode = searchParams.get("code");
    
    if (roomCode && user) {
      setShowStudyRoom(true);
    } else if (tab) {
      // Handle menu navigation
      if (tab === "study-room") {
        setShowStudyRoom(true);
      } else if (tab === "premium") {
        setShowPremium(true);
      } else {
        setActiveTab(tab);
      }
      // Clear the param after handling
      setSearchParams({});
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
      .select('ki_level, lives, xp')
      .eq('user_id', user.id)
      .maybeSingle();

    if (progress) {
      setKiLevel(progress.ki_level || 0);
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

  const handleBackToChat = () => {
    setActiveTab("chat");
    setShowStudyRoom(false);
    setShowPremium(false);
  };

  if (!user) return null;

  // Show Study Room as full page
  if (showStudyRoom) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setShowStudyRoom(false)}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
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

  // Check if viewing a specific section (not chat)
  const isViewingSection = activeTab !== "chat";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Menu / Back Button */}
            {isViewingSection ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToChat}
                className="h-10 w-10"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/menu")}
                className="h-10 w-10"
              >
                <Menu className="w-6 h-6" />
              </Button>
            )}

            {/* Mode Toggle - Pergunta / Imagine (only show in chat mode) */}
            {!isViewingSection && (
              <div className="flex bg-muted rounded-full p-1">
                <Button
                  variant={chatMode === "tutor" ? "default" : "ghost"}
                  size="sm"
                  className={`rounded-full px-4 gap-2 transition-all ${
                    chatMode === "tutor" 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "hover:bg-muted-foreground/10"
                  }`}
                  onClick={() => setChatMode("tutor")}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Pergunta</span>
                </Button>
                <Button
                  variant={chatMode === "casual" ? "default" : "ghost"}
                  size="sm"
                  className={`rounded-full px-4 gap-2 transition-all ${
                    chatMode === "casual" 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "hover:bg-muted-foreground/10"
                  }`}
                  onClick={() => setChatMode("casual")}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Imagine</span>
                </Button>
              </div>
            )}

            {/* Section Title (when viewing section) */}
            {isViewingSection && (
              <h1 className="text-lg font-semibold capitalize">
                {activeTab === "exercises" && "Exercícios"}
                {activeTab === "progress" && "Progresso"}
                {activeTab === "dashboard" && "Dashboard"}
                {activeTab === "achievements" && "Conquistas"}
                {activeTab === "wrong-answers" && "Meus Erros"}
                {activeTab === "profile" && "Perfil"}
                {activeTab === "notifications" && "Notificações"}
                {activeTab === "settings" && "Configurações"}
                {activeTab === "review" && "Revisão Espaçada"}
              </h1>
            )}

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTab("notifications")}
              className="h-10 w-10"
            >
              <Bell className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col container mx-auto px-4 max-w-4xl">
        {/* Chat View (Default) */}
        {activeTab === "chat" && (
          <>
            {/* TutorChat Component with mode prop */}
            <div className="flex-1 py-4">
              <TutorChat 
                userId={user.id} 
                kiLevel={kiLevel} 
                chatMode={chatMode}
                onShowPremium={() => setShowPremium(true)} 
              />
            </div>

            {/* Quick Actions */}
            <div className="pb-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full whitespace-nowrap"
                  onClick={() => navigate("/daily-quiz")}
                >
                  <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                  Quiz Diário
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full whitespace-nowrap"
                  onClick={() => setActiveTab("exercises")}
                >
                  <Dumbbell className="w-4 h-4 mr-2 text-blue-500" />
                  Exercícios
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full whitespace-nowrap"
                  onClick={() => setActiveTab("progress")}
                >
                  <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                  Progresso
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full whitespace-nowrap"
                  onClick={() => setShowStudyRoom(true)}
                >
                  <GraduationCap className="w-4 h-4 mr-2 text-purple-500" />
                  Sala de Estudo
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full whitespace-nowrap"
                  onClick={() => setActiveTab("achievements")}
                >
                  <Trophy className="w-4 h-4 mr-2 text-orange-500" />
                  Conquistas
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full whitespace-nowrap"
                  onClick={() => setActiveTab("wrong-answers")}
                >
                  <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                  Meus Erros
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full whitespace-nowrap"
                  onClick={() => setActiveTab("review")}
                >
                  <Brain className="w-4 h-4 mr-2 text-indigo-500" />
                  Revisão
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Exercises Section */}
        {activeTab === "exercises" && (
          <div className="py-4">
            <ExercisePanel userId={user.id} kiLevel={kiLevel} />
          </div>
        )}

        {/* Progress Section */}
        {activeTab === "progress" && (
          <div className="py-4">
            <ProgressScreen userId={user.id} />
          </div>
        )}

        {/* Dashboard Section */}
        {activeTab === "dashboard" && (
          <div className="py-4">
            <ProgressDashboard userId={user.id} />
          </div>
        )}

        {/* Achievements Section */}
        {activeTab === "achievements" && (
          <div className="py-4">
            <AchievementsPanel userId={user.id} />
          </div>
        )}

        {/* Wrong Answers Section */}
        {activeTab === "wrong-answers" && (
          <div className="py-4">
            <WrongAnswersPanel userId={user.id} />
          </div>
        )}

        {/* Profile Section - Learning Profile */}
        {activeTab === "profile" && (
          <div className="py-4">
            <LearningProfile userId={user.id} />
          </div>
        )}

        {/* Notifications Section */}
        {activeTab === "notifications" && (
          <div className="py-4">
            <NotificationSettings userId={user.id} />
          </div>
        )}

        {/* Settings Section - Suggestions Panel */}
        {activeTab === "settings" && (
          <div className="py-4">
            <SuggestionsPanel userId={user.id} />
          </div>
        )}

        {/* Shop Section - Redirect to Progress with shop tab */}
        {activeTab === "shop" && (
          <div className="py-4">
            <ProgressScreen userId={user.id} />
          </div>
        )}

        {/* Spaced Review Section */}
        {activeTab === "review" && (
          <div className="py-4">
            <SpacedReview userId={user.id} onClose={handleBackToChat} />
          </div>
        )}
      </main>

      {/* Unity Ads Banner for free users */}
      <UnityAdsBanner 
        userId={user.id} 
        position="bottom" 
        onPremiumClick={() => setShowPremium(true)}
      />

      {/* Premium Modal */}
      {showPremium && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-auto">
          <div className="container mx-auto px-4 py-8 max-w-2xl">
            <PremiumSubscription userId={user.id} onBack={() => setShowPremium(false)} />
          </div>
        </div>
      )}

      {/* Footer - add bottom padding for banner */}
      <div className="pb-14">
        <Footer />
      </div>
    </div>
  );
};

export default Index;

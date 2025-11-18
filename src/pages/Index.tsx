import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/Dashboard";
import TutorChat from "@/components/TutorChat";
import ExercisePanel from "@/components/ExercisePanel";
import { GraduationCap, LogOut, MessageSquare, Dumbbell, BarChart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [kiLevel, setKiLevel] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
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
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchKiLevel();
    }
  }, [user]);

  const fetchKiLevel = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_progress')
      .select('ki_level')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setKiLevel(data.ki_level);
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 h-12">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="tutor" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Tutor</span>
            </TabsTrigger>
            <TabsTrigger value="exercises" className="gap-2">
              <Dumbbell className="w-4 h-4" />
              <span className="hidden sm:inline">Exercícios</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard userId={user.id} />
          </TabsContent>

          <TabsContent value="tutor" className="max-w-4xl mx-auto">
            <TutorChat userId={user.id} kiLevel={kiLevel} />
          </TabsContent>

          <TabsContent value="exercises" className="max-w-4xl mx-auto">
            <ExercisePanel userId={user.id} kiLevel={kiLevel} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
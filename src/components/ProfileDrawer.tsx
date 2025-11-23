import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { User, Brain, Zap, Heart, Target, Settings, Moon, Sun, Volume2, Vibrate } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";

interface UserProgress {
  ki_level: number;
  xp: number;
  lives: number;
  daily_streak: number;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  theme: string;
}

interface ProfileDrawerProps {
  userId: string;
}

const ProfileDrawer = ({ userId }: ProfileDrawerProps) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProgress();
  }, [userId]);

  const fetchProgress = async () => {
    const { data } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) setProgress(data);
  };

  const updateSettings = async (field: string, value: any) => {
    await supabase
      .from('user_progress')
      .update({ [field]: value })
      .eq('user_id', userId);

    setProgress(prev => prev ? { ...prev, [field]: value } : null);

    if (field === 'theme') {
      document.documentElement.classList.toggle('dark', value === 'dark');
      toast({
        title: value === 'dark' ? "Modo escuro ativado 🌙" : "Modo claro ativado ☀️",
        description: "Tema alterado com sucesso",
      });
    }
  };

  if (!progress) return null;

  const getKILevel = (ki: number) => {
    if (ki <= 20) return { label: "Iniciante", color: "bg-muted" };
    if (ki <= 50) return { label: "Intermediário", color: "bg-primary" };
    if (ki <= 80) return { label: "Avançado", color: "bg-secondary" };
    return { label: "Mestre", color: "bg-accent" };
  };

  const kiInfo = getKILevel(progress.ki_level);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <User className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Meu Perfil
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Stats Cards */}
          <Card className="p-4 bg-gradient-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Nível KI</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-bold">{progress.ki_level}</p>
                  <Badge variant="secondary" className={kiInfo.color}>
                    {kiInfo.label}
                  </Badge>
                </div>
              </div>
            </div>
            <Progress value={progress.ki_level} className="h-2" />
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-gradient-card">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-accent" />
                <p className="text-xs text-muted-foreground">XP</p>
              </div>
              <p className="text-2xl font-bold">{progress.xp}</p>
            </Card>

            <Card className="p-4 bg-gradient-card">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-secondary" />
                <p className="text-xs text-muted-foreground">Sequência</p>
              </div>
              <p className="text-2xl font-bold">{progress.daily_streak}</p>
            </Card>
          </div>

          <Card className="p-4 bg-gradient-card">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-destructive" />
              <p className="text-xs text-muted-foreground">Vidas</p>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-6 h-6 ${
                    i < progress.lives
                      ? "fill-destructive text-destructive"
                      : "text-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
          </Card>

          {/* Configurações */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5" />
              <h3 className="font-semibold">Configurações</h3>
            </div>

            <div className="space-y-4">
              {/* Tema */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {progress.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  <Label htmlFor="theme">Modo Escuro</Label>
                </div>
                <Switch
                  id="theme"
                  checked={progress.theme === 'dark'}
                  onCheckedChange={(checked) => updateSettings('theme', checked ? 'dark' : 'light')}
                />
              </div>

              {/* Sons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  <Label htmlFor="sound">Sons</Label>
                </div>
                <Switch
                  id="sound"
                  checked={progress.sound_enabled}
                  onCheckedChange={(checked) => updateSettings('sound_enabled', checked)}
                />
              </div>

              {/* Vibração */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Vibrate className="w-4 h-4" />
                  <Label htmlFor="vibration">Vibração</Label>
                </div>
                <Switch
                  id="vibration"
                  checked={progress.vibration_enabled}
                  onCheckedChange={(checked) => updateSettings('vibration_enabled', checked)}
                />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProfileDrawer;

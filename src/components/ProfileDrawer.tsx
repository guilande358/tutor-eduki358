import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Brain, Zap, Coins, Target, Settings, Moon, Sun, Volume2, Vibrate, Languages, PlayCircle, BookOpen, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCredits } from "@/hooks/useCredits";
import { useUnityAds } from "@/hooks/useUnityAds";

interface UserProgress {
  ki_level: number;
  xp: number;
  lives: number;
  daily_streak: number;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  theme: string;
  language: string;
}

interface ProfileDrawerProps {
  userId: string;
}

const ProfileDrawer = ({ userId }: ProfileDrawerProps) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  // Credits and ads hooks
  const { credits, maxCredits, isPremium, addCredits, refetch: refetchCredits } = useCredits(userId);
  const { isAdReady, showRewardedAd, claimReward } = useUnityAds(userId);

  useEffect(() => {
    fetchProgress();
  }, [userId]);

  useEffect(() => {
    if (progress?.language) {
      i18n.changeLanguage(progress.language);
    }
  }, [progress?.language]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (data) setProgress(data);
    } catch (err) {
      console.error('Erro ao buscar progresso:', err);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seu progresso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

    if (field === 'language') {
      i18n.changeLanguage(value);
      localStorage.setItem('language', value);
      toast({
        title: t('common.success'),
        description: t('profile.language'),
      });
    }
  };

  const handleWatchAd = async () => {
    setIsWatchingAd(true);
    try {
      const result = await showRewardedAd();
      if (result.success && result.rewarded) {
        await claimReward("credits");
        refetchCredits();
        fetchProgress();
      }
    } finally {
      setIsWatchingAd(false);
    }
  };

  const handleConvertXP = async () => {
    if (!progress || progress.xp < 1000) {
      toast({
        title: "XP insuficiente",
        description: "Você precisa de pelo menos 1000 XP",
        variant: "destructive",
      });
      return;
    }

    try {
      // Deduct 1000 XP and add 15 credits
      await supabase
        .from('user_progress')
        .update({ 
          xp: progress.xp - 1000,
          credits: credits + 15 
        })
        .eq('user_id', userId);

      toast({
        title: "Conversão realizada! 🎉",
        description: "1000 XP → 15 créditos",
      });
      refetchCredits();
      fetchProgress();
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível converter XP",
        variant: "destructive",
      });
    }
  };

  const getKILevel = (ki: number) => {
    if (ki <= 20) return { label: "Iniciante", color: "bg-muted" };
    if (ki <= 50) return { label: "Intermediário", color: "bg-primary" };
    if (ki <= 80) return { label: "Avançado", color: "bg-secondary" };
    return { label: "Mestre", color: "bg-accent" };
  };

  const kiInfo = progress ? getKILevel(progress.ki_level) : { label: "Iniciante", color: "bg-muted" };

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
            {t('profile.title')}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {loading ? (
            <div className="space-y-4">
              <div className="h-24 bg-muted rounded-lg animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 bg-muted rounded-lg animate-pulse" />
                <div className="h-20 bg-muted rounded-lg animate-pulse" />
              </div>
              <div className="h-20 bg-muted rounded-lg animate-pulse" />
            </div>
          ) : !progress ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Não foi possível carregar os dados</p>
            </div>
          ) : (
            <>
              {/* KI Level Card */}
              <Card className="p-4 bg-gradient-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t('profile.kiLevel')}</p>
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

              {/* XP and Streak */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 bg-gradient-card">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-accent" />
                    <p className="text-xs text-muted-foreground">{t('profile.xp')}</p>
                  </div>
                  <p className="text-2xl font-bold">{progress.xp}</p>
                </Card>

                <Card className="p-4 bg-gradient-card">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-secondary" />
                    <p className="text-xs text-muted-foreground">{t('profile.streak')}</p>
                  </div>
                  <p className="text-2xl font-bold">{progress.daily_streak}</p>
                </Card>
              </div>

              {/* Credits Section */}
              <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <p className="font-semibold">Créditos</p>
                  {isPremium && (
                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                      <Sparkles className="w-3 h-3 mr-1" /> Premium
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-amber-500">{credits}</span>
                    <span className="text-sm text-muted-foreground">/ {maxCredits} máx</span>
                  </div>
                  <Progress value={(credits / maxCredits) * 100} className="h-2" />
                  
                  {!isPremium && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs text-muted-foreground">Ganhar mais créditos:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          onClick={handleWatchAd}
                          disabled={isWatchingAd || !isAdReady}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        >
                          {isWatchingAd ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <PlayCircle className="w-4 h-4 mr-1" />
                          )}
                          Vídeo (+2)
                        </Button>
                        
                        {progress.xp >= 1000 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleConvertXP}
                            className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
                          >
                            <Sparkles className="w-4 h-4 mr-1" />
                            XP (+15)
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Separator />

              {/* Configurações */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5" />
                  <h3 className="font-semibold">{t('profile.settings')}</h3>
                </div>

                <div className="space-y-4">
                  {/* Tema */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {progress.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      <Label htmlFor="theme">{t('profile.darkMode')}</Label>
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
                      <Label htmlFor="sound">{t('profile.sound')}</Label>
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
                      <Label htmlFor="vibration">{t('profile.vibration')}</Label>
                    </div>
                    <Switch
                      id="vibration"
                      checked={progress.vibration_enabled}
                      onCheckedChange={(checked) => updateSettings('vibration_enabled', checked)}
                    />
                  </div>

                  {/* Idioma */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Languages className="w-4 h-4" />
                      <Label htmlFor="language">{t('profile.language')}</Label>
                    </div>
                    <Select
                      value={progress.language || 'pt'}
                      onValueChange={(value) => updateSettings('language', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt">{t('languages.pt')}</SelectItem>
                        <SelectItem value="en">{t('languages.en')}</SelectItem>
                        <SelectItem value="es">{t('languages.es')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProfileDrawer;

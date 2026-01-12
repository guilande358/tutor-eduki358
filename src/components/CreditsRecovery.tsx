import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Coins, PlayCircle, BookOpen, Gift, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MicroLessonPanel from "./MicroLessonPanel";
import { useUnityAds } from "@/hooks/useUnityAds";
import { useCredits } from "@/hooks/useCredits";

interface CreditsRecoveryProps {
  userId: string;
  kiLevel: number;
  onCreditsUpdate: () => void;
}

const CreditsRecovery = ({ userId, kiLevel, onCreditsUpdate }: CreditsRecoveryProps) => {
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [showMicroLesson, setShowMicroLesson] = useState(false);
  const { toast } = useToast();
  
  const { 
    isAdReady, 
    isLoading: adLoading, 
    showRewardedAd, 
    claimReward,
    adStats 
  } = useUnityAds(userId);

  const {
    credits,
    maxCredits,
    hasCredits,
    isPremium,
    addCredits,
    refetch: refetchCredits,
  } = useCredits(userId);

  const handleWatchAd = async () => {
    const result = await showRewardedAd();
    if (result.success && result.rewarded) {
      setShowRewardDialog(true);
    }
  };

  const handleClaimReward = async (type: "credits" | "xp") => {
    if (type === "credits") {
      await claimReward("credits");
    } else {
      await claimReward("xp");
    }
    setShowRewardDialog(false);
    refetchCredits();
    onCreditsUpdate();
  };

  const handleMicroLesson = () => {
    setShowMicroLesson(true);
  };

  const handleMicroLessonComplete = async () => {
    setShowMicroLesson(false);
    await addCredits(1);
    refetchCredits();
    onCreditsUpdate();
    toast({
      title: "Micro-aula concluída! 🎓",
      description: "+1 crédito ganho",
    });
  };

  // If user has enough credits or is premium, don't show
  if (hasCredits || isPremium) {
    return null;
  }

  if (showMicroLesson) {
    return (
      <MicroLessonPanel
        userId={userId}
        kiLevel={kiLevel}
        onClose={() => setShowMicroLesson(false)}
        onComplete={handleMicroLessonComplete}
      />
    );
  }

  return (
    <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 shadow-xl">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Coins className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Créditos Esgotados</h3>
              <p className="text-sm text-slate-400">
                Ganhe mais créditos para continuar
              </p>
            </div>
          </div>
        </div>

        {/* Credits display */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Créditos disponíveis</span>
            <span className="font-bold text-amber-400">{credits}/{maxCredits}</span>
          </div>
          <Progress value={(credits / maxCredits) * 100} className="h-2" />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-300">
            Vídeos assistidos hoje: <span className="font-bold text-cyan-400">{adStats.todayWatched}</span>
          </span>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <p className="text-sm text-slate-300">Ganhe créditos rapidamente:</p>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleWatchAd}
              disabled={adLoading || !isAdReady}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {adLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <PlayCircle className="w-5 h-5 mr-2" />
              )}
              Vídeo (+2)
            </Button>

            <Button
              onClick={handleMicroLesson}
              variant="outline"
              className="border-cyan-600 text-cyan-400 hover:bg-cyan-950/30"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Micro-aula (+1)
            </Button>
          </div>
        </div>
      </div>

      {/* Reward choice dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Gift className="w-6 h-6 text-amber-400" />
              Escolha sua recompensa!
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Você completou o anúncio com sucesso.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Button
              onClick={() => handleClaimReward("credits")}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Coins className="mr-2 h-5 w-5" /> +2 Créditos
            </Button>
            <Button
              onClick={() => handleClaimReward("xp")}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
            >
              <Sparkles className="mr-2 h-5 w-5" /> +50 XP
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CreditsRecovery;

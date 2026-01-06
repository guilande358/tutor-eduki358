import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Coins, PlayCircle, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { Capacitor } from "@capacitor/core";

interface ConvertXPCreditsProps {
  userId: string;
  xp: number;
  onConversionComplete: () => void;
}

const UNITY_GAME_ID = '5993995';
const UNITY_PLACEMENT_ID = 'Rewarded_Android';

const ConvertXPCredits = ({ userId, xp, onConversionComplete }: ConvertXPCreditsProps) => {
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();
  const { addCredits } = useCredits(userId);
  const isNative = Capacitor.isNativePlatform();

  const canConvert = xp >= 1000;

  const handleConvert = async () => {
    if (!canConvert) return;

    setIsConverting(true);

    try {
      if (isNative) {
        const { UnityAds } = await import('capacitor-unity-ads');
        
        // Tentar carregar e mostrar anúncio
        await UnityAds.loadRewardedVideo({ placementId: UNITY_PLACEMENT_ID });
        const result = await UnityAds.showRewardedVideo();

        if (!result.reward) {
          toast({
            title: "Anúncio não completado",
            description: "Assista até o final para converter XP",
            variant: "destructive",
          });
          setIsConverting(false);
          return;
        }
      } else {
        // Web - simular com timeout (Unity Web SDK não funciona bem)
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Converter: -1000 XP, +15 créditos
      const newXP = xp - 1000;
      
      await supabase
        .from('user_progress')
        .update({ xp: newXP })
        .eq('user_id', userId);

      await addCredits(15);

      // Registrar conversão
      await supabase.from('ad_impressions').insert({
        user_id: userId,
        ad_type: 'rewarded',
        placement_id: UNITY_PLACEMENT_ID,
        reward_type: 'xp_conversion',
        reward_claimed: true,
      });

      toast({
        title: "Conversão realizada! 🎉",
        description: "1000 XP convertidos em +15 créditos!",
      });

      onConversionComplete();
    } catch (error) {
      console.error('Erro na conversão:', error);
      toast({
        title: "Erro na conversão",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  if (!canConvert) return null;

  return (
    <Card className="p-4 bg-gradient-to-r from-accent/10 to-primary/10 border-accent/30">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Converter XP em Créditos</h4>
            <p className="text-xs text-muted-foreground">
              Tens {xp.toLocaleString()} XP disponíveis
            </p>
          </div>
        </div>

        <Button
          onClick={handleConvert}
          disabled={isConverting}
          size="sm"
          className="gap-2 bg-accent hover:bg-accent/90"
        >
          {isConverting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Convertendo...
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4" />
              1000 XP
              <ArrowRight className="w-3 h-3" />
              <Coins className="w-4 h-4" />
              +15
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Assista um anúncio para converter 1000 XP em 15 créditos
      </p>
    </Card>
  );
};

export default ConvertXPCredits;

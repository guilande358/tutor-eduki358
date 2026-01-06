import { Coins, Crown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCredits } from "@/hooks/useCredits";

interface CreditsDisplayProps {
  userId: string;
  compact?: boolean;
}

const CreditsDisplay = ({ userId, compact = false }: CreditsDisplayProps) => {
  const { credits, isPremium, loading, maxCredits } = useCredits(userId);

  if (loading) {
    return (
      <Badge variant="outline" className="animate-pulse">
        <Coins className="w-3 h-3 mr-1" />
        ...
      </Badge>
    );
  }

  if (isPremium) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 gap-1">
              <Crown className="w-3 h-3" />
              {!compact && <span>Premium</span>}
              <Sparkles className="w-3 h-3" />
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Créditos ilimitados como usuário Premium! 🎉</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const percentage = (credits / maxCredits) * 100;
  const isLow = credits <= 5;
  const isEmpty = credits === 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`gap-1 transition-colors ${
              isEmpty 
                ? "border-destructive text-destructive bg-destructive/10" 
                : isLow 
                  ? "border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10" 
                  : "border-primary/50 text-primary"
            }`}
          >
            <Coins className="w-3 h-3" />
            <span className="font-semibold">{credits}</span>
            {!compact && <span className="text-muted-foreground">/ {maxCredits}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Créditos: {credits}/{maxCredits}</p>
            <p className="text-xs text-muted-foreground">
              {isEmpty 
                ? "Acabaram seus créditos! 😔" 
                : isLow 
                  ? "Poucos créditos restantes" 
                  : "Cada pergunta ao tutor usa 1 crédito"}
            </p>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2">
              <div 
                className={`h-1.5 rounded-full transition-all ${
                  isEmpty ? "bg-destructive" : isLow ? "bg-yellow-500" : "bg-primary"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CreditsDisplay;

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Crown, PlayCircle, Sparkles } from "lucide-react";

interface NoCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWatchAd: () => void;
  onConvertXP: () => void;
  onViewPremium: () => void;
  xp: number;
}

const NoCreditsDialog = ({
  open,
  onOpenChange,
  onWatchAd,
  onConvertXP,
  onViewPremium,
  xp,
}: NoCreditsDialogProps) => {
  const canConvertXP = xp >= 1000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Coins className="w-6 h-6 text-muted-foreground" />
            Créditos esgotados
          </DialogTitle>
          <DialogDescription className="text-center">
            Acabaram os teus créditos deste mês 😔
            <br />
            Mas não te preocupes! Tens opções para continuar:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <Button
            onClick={() => {
              onWatchAd();
              onOpenChange(false);
            }}
            variant="outline"
            className="w-full h-14 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <PlayCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium">Assistir Anúncio</p>
                <p className="text-xs text-muted-foreground">Ganhe +2 créditos</p>
              </div>
            </div>
            <span className="text-primary font-bold">+2</span>
          </Button>

          {canConvertXP && (
            <Button
              onClick={() => {
                onConvertXP();
                onOpenChange(false);
              }}
              variant="outline"
              className="w-full h-14 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Converter XP</p>
                  <p className="text-xs text-muted-foreground">
                    Trocar 1000 XP por créditos
                  </p>
                </div>
              </div>
              <span className="text-accent font-bold">+15</span>
            </Button>
          )}

          <Button
            onClick={() => {
              onViewPremium();
              onOpenChange(false);
            }}
            className="w-full h-14 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
          >
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">Assinar Premium</p>
                <p className="text-xs opacity-80">Créditos ilimitados + sem anúncios</p>
              </div>
            </div>
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Os créditos gratuitos são renovados todo mês (10/dia, máx 50/mês)
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default NoCreditsDialog;

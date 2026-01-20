import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

interface UnityAdsBannerProps {
  userId: string;
  position?: "top" | "bottom";
  onPremiumClick?: () => void;
}

const UnityAdsBanner = ({ userId, position = "bottom", onPremiumClick }: UnityAdsBannerProps) => {
  const [isPremium, setIsPremium] = useState(true); // Default to true to hide banner initially
  const [isVisible, setIsVisible] = useState(false);

  // Check if user is premium
  useEffect(() => {
    const checkPremium = async () => {
      const { data } = await supabase
        .from("user_progress")
        .select("is_premium")
        .eq("user_id", userId)
        .maybeSingle();

      const premium = data?.is_premium ?? false;
      setIsPremium(premium);
      setIsVisible(!premium);
    };

    checkPremium();

    // Subscribe to changes
    const channel = supabase
      .channel(`premium-check-banner-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_progress",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const premium = (payload.new as any).is_premium ?? false;
          setIsPremium(premium);
          setIsVisible(!premium);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Don't render anything for premium users
  if (isPremium || !isVisible) return null;

  return (
    <div
      className={`fixed left-0 right-0 z-40 flex items-center justify-center bg-gradient-to-r from-muted/95 to-muted/90 backdrop-blur-sm border-t border-border/50 ${
        position === "top" ? "top-0 border-b" : "bottom-0 border-t"
      }`}
      style={{ height: "56px", paddingBottom: position === "bottom" ? "env(safe-area-inset-bottom)" : undefined }}
      role="banner"
      aria-label="Anúncio"
    >
      <div className="flex items-center gap-3 px-4 w-full max-w-md justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
            📢 AD
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Anúncio patrocinado
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1.5 text-primary hover:text-primary/80"
          onClick={onPremiumClick}
        >
          <Crown className="w-3.5 h-3.5" />
          Remover anúncios
        </Button>
      </div>
    </div>
  );
};

export default UnityAdsBanner;

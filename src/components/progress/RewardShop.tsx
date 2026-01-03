import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Star, Heart, Lightbulb, Palette, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

interface RewardItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_cost: number;
  reward_type: string;
  reward_data: Record<string, unknown>;
}

interface RewardShopProps {
  userId: string;
  userXp: number;
  onPurchase: () => void;
}

const RewardShop = ({ userId, userXp, onPurchase }: RewardShopProps) => {
  const [items, setItems] = useState<RewardItem[]>([]);
  const [ownedRewards, setOwnedRewards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadShopItems();
    loadOwnedRewards();
  }, [userId]);

  const loadShopItems = async () => {
    const { data } = await supabase
      .from("reward_shop")
      .select("*")
      .eq("is_active", true)
      .order("xp_cost");

    if (data) {
      setItems(data as RewardItem[]);
    }
    setLoading(false);
  };

  const loadOwnedRewards = async () => {
    const { data } = await supabase
      .from("user_rewards")
      .select("reward_id")
      .eq("user_id", userId);

    if (data) {
      setOwnedRewards(new Set(data.map((r) => r.reward_id).filter(Boolean) as string[]));
    }
  };

  const purchaseItem = async (item: RewardItem) => {
    if (userXp < item.xp_cost) {
      toast({
        title: "XP Insuficiente",
        description: `Você precisa de ${item.xp_cost - userXp} XP a mais`,
        variant: "destructive",
      });
      return;
    }

    setPurchasing(item.id);
    try {
      // Deduzir XP
      const { data: current } = await supabase
        .from("user_progress")
        .select("xp, lives")
        .eq("user_id", userId)
        .maybeSingle();

      const newXp = (current?.xp || 0) - item.xp_cost;

      // Aplicar recompensa
      let updateData: Record<string, unknown> = { xp: newXp };
      
      if (item.reward_type === "life") {
        const livesToAdd = (item.reward_data as { lives?: number }).lives || 1;
        updateData.lives = Math.min((current?.lives || 0) + livesToAdd, 5);
      }

      await supabase
        .from("user_progress")
        .update(updateData)
        .eq("user_id", userId);

      // Registrar compra (exceto vidas que são consumíveis)
      if (item.reward_type !== "life") {
        await supabase.from("user_rewards").insert({
          user_id: userId,
          reward_type: item.reward_type,
          reward_id: item.id,
        });
        setOwnedRewards((prev) => new Set([...prev, item.id]));
      }

      toast({
        title: "Compra realizada! 🎉",
        description: `Você adquiriu: ${item.name}`,
      });

      onPurchase();
    } catch (error) {
      console.error("Erro ao comprar item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível concluir a compra",
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "theme":
        return <Palette className="w-4 h-4" />;
      case "life":
        return <Heart className="w-4 h-4" />;
      case "hint":
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const categories = [
    { id: "all", label: "Todos", icon: "🛒" },
    { id: "theme", label: "Temas", icon: "🎨" },
    { id: "life", label: "Vidas", icon: "❤️" },
    { id: "hint", label: "Dicas", icon: "💡" },
  ];

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Loja de Recompensas</h2>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Star className="w-4 h-4 mr-1 text-yellow-500" />
          {userXp} XP
        </Badge>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid grid-cols-4 mb-4">
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.icon} {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id}>
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items
                  .filter((item) => cat.id === "all" || item.reward_type === cat.id)
                  .map((item) => {
                    const isOwned = ownedRewards.has(item.id);
                    const canAfford = userXp >= item.xp_cost;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card
                          className={`p-4 ${
                            isOwned
                              ? "bg-green-500/10 border-green-500/30"
                              : canAfford
                              ? "hover:border-primary/50"
                              : "opacity-60"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="text-4xl">{item.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{item.name}</h3>
                                {isOwned && (
                                  <Badge variant="outline" className="text-green-500 border-green-500">
                                    <Check className="w-3 h-3 mr-1" />
                                    Adquirido
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {item.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <Badge
                                  variant={canAfford ? "default" : "secondary"}
                                  className="gap-1"
                                >
                                  <Star className="w-3 h-3" />
                                  {item.xp_cost} XP
                                </Badge>
                                {!isOwned && (
                                  <Button
                                    size="sm"
                                    onClick={() => purchaseItem(item)}
                                    disabled={!canAfford || purchasing === item.id}
                                  >
                                    {purchasing === item.id ? "..." : "Comprar"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
};

export default RewardShop;

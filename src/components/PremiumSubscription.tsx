import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
  Crown,
  Heart,
  Zap,
  BarChart3,
  Palette,
  Users,
  Shield,
  Check,
  Star,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

interface PremiumSubscriptionProps {
  userId: string;
  onBack: () => void;
}

const PREMIUM_BENEFITS = [
  {
    icon: Heart,
    title: "Vidas Ilimitadas",
    description: "Nunca mais espere para continuar estudando",
    color: "text-red-500",
  },
  {
    icon: Zap,
    title: "Sem Anúncios",
    description: "Experiência de estudo sem interrupções",
    color: "text-yellow-500",
  },
  {
    icon: BarChart3,
    title: "Relatórios Avançados",
    description: "Insights detalhados do seu progresso",
    color: "text-blue-500",
  },
  {
    icon: Palette,
    title: "Temas Exclusivos",
    description: "Personalize o EduKI do seu jeito",
    color: "text-purple-500",
  },
  {
    icon: Users,
    title: "Prioridade na Sala",
    description: "Acesso preferencial às salas de estudo",
    color: "text-green-500",
  },
  {
    icon: Shield,
    title: "Suporte Prioritário",
    description: "Atendimento VIP para suas dúvidas",
    color: "text-orange-500",
  },
];

const PLANS = [
  {
    id: "monthly",
    name: "Mensal",
    price: 19.9,
    period: "/mês",
    savings: null,
    popular: false,
  },
  {
    id: "yearly",
    name: "Anual",
    price: 9.9,
    period: "/mês",
    savings: "Economize 50%",
    popular: true,
    totalPrice: 118.8,
  },
  {
    id: "lifetime",
    name: "Vitalício",
    price: 199.9,
    period: "único",
    savings: "Melhor valor",
    popular: false,
  },
];

const PremiumSubscription = ({ userId, onBack }: PremiumSubscriptionProps) => {
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [isLoading, setIsLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkSubscription();
  }, [userId]);

  const checkSubscription = async () => {
    const { data: progress } = await supabase
      .from("user_progress")
      .select("is_premium, premium_expires_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (progress?.is_premium) {
      setIsPremium(true);
      
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();
      
      setSubscription(sub);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    
    try {
      const plan = PLANS.find(p => p.id === selectedPlan);
      const expiresAt = selectedPlan === "lifetime" 
        ? new Date(2099, 11, 31).toISOString()
        : selectedPlan === "yearly"
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Create subscription record
      await supabase.from("user_subscriptions").insert({
        user_id: userId,
        plan_type: selectedPlan,
        expires_at: expiresAt,
        is_active: true,
        payment_provider: "demo", // Replace with actual payment provider
      });

      // Update user progress
      await supabase
        .from("user_progress")
        .update({
          is_premium: true,
          premium_expires_at: expiresAt,
          lives: 999, // Unlimited lives
        })
        .eq("user_id", userId);

      setIsPremium(true);
      toast({
        title: "Bem-vindo ao EduKI Premium! 👑",
        description: `Plano ${plan?.name} ativado com sucesso!`,
      });
    } catch (error) {
      console.error("Erro ao assinar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a assinatura",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isPremium) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Você é Premium! 👑</h2>
          <p className="text-muted-foreground">
            Aproveite todos os benefícios exclusivos do EduKI Premium
          </p>
        </motion.div>

        <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <h3 className="font-semibold mb-4">Seus Benefícios Ativos</h3>
          <div className="grid gap-3">
            {PREMIUM_BENEFITS.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <span>{benefit.title}</span>
              </div>
            ))}
          </div>
        </Card>

        {subscription && (
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">
              Plano: <span className="font-medium">{subscription.plan_type}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Válido até:{" "}
              <span className="font-medium">
                {new Date(subscription.expires_at).toLocaleDateString("pt-BR")}
              </span>
            </p>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="relative inline-block">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          EduKI Premium
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Desbloqueie todo o potencial do EduKI e acelere seu aprendizado
        </p>
      </motion.div>

      {/* Benefits */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {PREMIUM_BENEFITS.map((benefit, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 h-full hover:shadow-lg transition-shadow">
              <benefit.icon className={`w-8 h-8 ${benefit.color} mb-2`} />
              <h3 className="font-semibold text-sm">{benefit.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {benefit.description}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pricing Plans */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-center">Escolha seu plano</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card
                className={`p-6 cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? "border-2 border-primary bg-primary/5 shadow-lg"
                    : "hover:border-primary/50"
                } ${plan.popular ? "relative" : ""}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500">
                    <Star className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                )}
                <div className="text-center space-y-2">
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="text-4xl font-bold">{plan.price.toFixed(2).replace(".", ",")}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  {plan.totalPrice && (
                    <p className="text-xs text-muted-foreground">
                      Total: R$ {plan.totalPrice.toFixed(2).replace(".", ",")}
                    </p>
                  )}
                  {plan.savings && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                      {plan.savings}
                    </Badge>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="w-full h-14 text-lg bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
        >
          {isLoading ? (
            "Processando..."
          ) : (
            <>
              <Crown className="w-5 h-5 mr-2" />
              Assinar Agora
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Cancele quando quiser. Garantia de 7 dias.
        </p>
      </motion.div>

      {/* Testimonial */}
      <Card className="p-4 bg-muted/50">
        <p className="text-sm italic text-center">
          "O EduKI Premium transformou minha forma de estudar. Vidas ilimitadas e sem
          anúncios fizeram toda a diferença!"
        </p>
        <p className="text-xs text-muted-foreground text-center mt-2">
          — Maria, estudante Premium
        </p>
      </Card>
    </div>
  );
};

export default PremiumSubscription;

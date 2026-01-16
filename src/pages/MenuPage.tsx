import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Trophy,
  ShoppingBag,
  Settings,
  Zap,
  AlertCircle,
  User,
  Bell,
  GraduationCap,
  BarChart3,
  Crown,
  ChevronRight,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  route?: string;
  action?: string;
  badge?: string;
  gradient?: string;
}

const MenuPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const menuItems: MenuItem[] = [
    {
      id: "daily-quiz",
      label: "Desafios Diários",
      description: "Complete o quiz do dia e ganhe recompensas",
      icon: <Zap className="w-6 h-6" />,
      route: "/daily-quiz",
      badge: "Novo",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      id: "progress",
      label: "Meu Progresso",
      description: "Veja seu desempenho e estatísticas",
      icon: <TrendingUp className="w-6 h-6" />,
      action: "progress",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "dashboard",
      label: "Dashboard",
      description: "Análise detalhada do seu aprendizado",
      icon: <BarChart3 className="w-6 h-6" />,
      action: "dashboard",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      id: "study-room",
      label: "Sala de Estudo",
      description: "Estude com amigos em tempo real",
      icon: <Users className="w-6 h-6" />,
      action: "study-room",
      gradient: "from-orange-500 to-amber-500",
    },
    {
      id: "achievements",
      label: "Conquistas",
      description: "Veja suas conquistas e badges",
      icon: <Trophy className="w-6 h-6" />,
      action: "achievements",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      id: "wrong-answers",
      label: "Erros Anteriores",
      description: "Revise questões que você errou",
      icon: <AlertCircle className="w-6 h-6" />,
      action: "wrong-answers",
      gradient: "from-red-500 to-pink-500",
    },
    {
      id: "shop",
      label: "Loja de Recompensas",
      description: "Troque XP por itens especiais",
      icon: <ShoppingBag className="w-6 h-6" />,
      action: "shop",
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      id: "premium",
      label: "Premium",
      description: "Desbloqueie recursos ilimitados",
      icon: <Crown className="w-6 h-6" />,
      action: "premium",
      badge: "⭐",
      gradient: "from-yellow-400 to-yellow-600",
    },
    {
      id: "profile",
      label: "Perfil de Aprendizagem",
      description: "Configure suas preferências",
      icon: <User className="w-6 h-6" />,
      action: "profile",
      gradient: "from-teal-500 to-cyan-500",
    },
    {
      id: "notifications",
      label: "Notificações",
      description: "Gerencie seus alertas",
      icon: <Bell className="w-6 h-6" />,
      action: "notifications",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      id: "settings",
      label: "Configurações",
      description: "Ajuste o app ao seu gosto",
      icon: <Settings className="w-6 h-6" />,
      action: "settings",
      gradient: "from-gray-500 to-slate-500",
    },
  ];

  const handleItemClick = (item: MenuItem) => {
    if (item.route) {
      navigate(item.route);
    } else if (item.action) {
      // Navigate back to index with action param
      navigate(`/?tab=${item.action}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-primary rounded-xl">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Menu</h1>
                <p className="text-xs text-muted-foreground">Explore o EduKI</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Menu Items */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-3">
          {menuItems.map((item) => (
            <Card
              key={item.id}
              className="p-4 cursor-pointer hover:shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
              onClick={() => handleItemClick(item)}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br ${item.gradient} text-white`}
                >
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{item.label}</h3>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 p-4 bg-muted/50 rounded-xl">
          <p className="text-center text-sm text-muted-foreground">
            EduKI v2.0 • Seu tutor de IA personalizado 🎓
          </p>
        </div>
      </main>
    </div>
  );
};

export default MenuPage;

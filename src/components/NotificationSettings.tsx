import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, BellOff, Flame, Target, BookOpen, Clock } from "lucide-react";

interface NotificationSettingsProps {
  userId: string;
}

const NotificationSettings = ({ userId }: NotificationSettingsProps) => {
  const {
    settings,
    permissionStatus,
    isLoading,
    requestPermission,
    updateSettings,
  } = useNotifications(userId);

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Notificações Push</h3>
        </div>
        <Badge variant={permissionStatus === "granted" ? "default" : "secondary"}>
          {permissionStatus === "granted" ? "Ativado" : "Desativado"}
        </Badge>
      </div>

      {permissionStatus !== "granted" && (
        <Button onClick={requestPermission} className="w-full gap-2">
          <Bell className="w-4 h-4" />
          Ativar Notificações
        </Button>
      )}

      {permissionStatus === "denied" && (
        <p className="text-sm text-muted-foreground text-center">
          As notificações estão bloqueadas. Habilite nas configurações do navegador.
        </p>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <Label htmlFor="streak-reminders" className="font-medium">
                Lembretes de Streak
              </Label>
              <p className="text-xs text-muted-foreground">
                Aviso para não perder sua sequência
              </p>
            </div>
          </div>
          <Switch
            id="streak-reminders"
            checked={settings.streak_reminders}
            onCheckedChange={(checked) =>
              updateSettings({ streak_reminders: checked })
            }
            disabled={isLoading || permissionStatus !== "granted"}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Target className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <Label htmlFor="challenge-reminders" className="font-medium">
                Desafios Diários
              </Label>
              <p className="text-xs text-muted-foreground">
                Lembrete do desafio do dia
              </p>
            </div>
          </div>
          <Switch
            id="challenge-reminders"
            checked={settings.daily_challenge_reminders}
            onCheckedChange={(checked) =>
              updateSettings({ daily_challenge_reminders: checked })
            }
            disabled={isLoading || permissionStatus !== "granted"}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <BookOpen className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <Label htmlFor="study-reminders" className="font-medium">
                Lembretes de Estudo
              </Label>
              <p className="text-xs text-muted-foreground">
                Sugestões para estudar
              </p>
            </div>
          </div>
          <Switch
            id="study-reminders"
            checked={settings.study_reminders}
            onCheckedChange={(checked) =>
              updateSettings({ study_reminders: checked })
            }
            disabled={isLoading || permissionStatus !== "granted"}
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Clock className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <Label htmlFor="reminder-time" className="font-medium">
                Horário do Lembrete
              </Label>
              <p className="text-xs text-muted-foreground">
                Quando você quer ser lembrado
              </p>
            </div>
          </div>
          <Input
            id="reminder-time"
            type="time"
            value={settings.reminder_time}
            onChange={(e) => updateSettings({ reminder_time: e.target.value })}
            className="w-28"
            disabled={isLoading || permissionStatus !== "granted"}
          />
        </div>
      </div>

      {permissionStatus === "granted" && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => {
            new Notification("Teste de Notificação 🔔", {
              body: "As notificações estão funcionando!",
              icon: "/icon-192x192.png",
            });
          }}
        >
          <Bell className="w-4 h-4" />
          Testar Notificação
        </Button>
      )}
    </Card>
  );
};

export default NotificationSettings;

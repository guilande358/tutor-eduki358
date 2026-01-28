import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

interface NotificationSettings {
  push_enabled: boolean;
  streak_reminders: boolean;
  daily_challenge_reminders: boolean;
  study_reminders: boolean;
  reminder_time: string;
}

export const useNotifications = (userId: string) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    push_enabled: true,
    streak_reminders: true,
    daily_challenge_reminders: true,
    study_reminders: true,
    reminder_time: "18:00",
  });
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "default">("default");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkPermissionStatus();
    loadSettings();
  }, [userId]);

  const checkPermissionStatus = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await LocalNotifications.checkPermissions();
        setPermissionStatus(result.display === "granted" ? "granted" : result.display === "denied" ? "denied" : "default");
      } catch (error) {
        console.error("Error checking notification permissions:", error);
      }
    } else if ("Notification" in window) {
      setPermissionStatus(Notification.permission as "granted" | "denied" | "default");
    }
  };

  const loadSettings = async () => {
    const { data } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setSettings({
        push_enabled: data.push_enabled ?? true,
        streak_reminders: data.streak_reminders ?? true,
        daily_challenge_reminders: data.daily_challenge_reminders ?? true,
        study_reminders: data.study_reminders ?? true,
        reminder_time: data.reminder_time ?? "18:00",
      });
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    // Native platform - use Capacitor Local Notifications
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await LocalNotifications.requestPermissions();
        const granted = result.display === "granted";
        setPermissionStatus(granted ? "granted" : "denied");
        
        if (granted) {
          toast({
            title: "Notificações ativadas! 🔔",
            description: "Você receberá lembretes para manter seu streak",
          });
        } else {
          toast({
            title: "Notificações bloqueadas",
            description: "Habilite nas configurações do dispositivo",
            variant: "destructive",
          });
        }
        return granted;
      } catch (error) {
        console.error("Error requesting native notification permission:", error);
        toast({
          title: "Erro ao ativar notificações",
          description: "Tente novamente mais tarde",
          variant: "destructive",
        });
        return false;
      }
    }

    // Web platform - use Web Notifications API
    if (!("Notification" in window)) {
      toast({
        title: "Notificações não suportadas",
        description: "Este dispositivo não suporta notificações",
        variant: "destructive",
      });
      return false;
    }

    if (Notification.permission === "granted") {
      setPermissionStatus("granted");
      return true;
    }

    if (Notification.permission === "denied") {
      toast({
        title: "Notificações bloqueadas",
        description: "Habilite nas configurações do navegador",
        variant: "destructive",
      });
      setPermissionStatus("denied");
      return false;
    }

    const permission = await Notification.requestPermission();
    setPermissionStatus(permission as "granted" | "denied" | "default");
    
    if (permission === "granted") {
      toast({
        title: "Notificações ativadas! 🔔",
        description: "Você receberá lembretes para manter seu streak",
      });
      return true;
    }

    return false;
  };

  const subscribeToPush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push notifications not supported");
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
        });
      }

      await supabase
        .from("notification_settings")
        .upsert([{
          user_id: userId,
          push_subscription: subscription.toJSON() as any,
          push_enabled: true,
        }]);

      return subscription;
    } catch (error) {
      console.error("Error subscribing to push:", error);
      return null;
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    setIsLoading(true);
    
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      await supabase
        .from("notification_settings")
        .upsert([{
          user_id: userId,
          push_enabled: updatedSettings.push_enabled,
          streak_reminders: updatedSettings.streak_reminders,
          daily_challenge_reminders: updatedSettings.daily_challenge_reminders,
          study_reminders: updatedSettings.study_reminders,
          reminder_time: updatedSettings.reminder_time,
        }]);

      toast({
        title: "Configurações salvas! ✓",
        description: "Suas preferências de notificação foram atualizadas",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showLocalNotification = useCallback(async (title: string, body?: string, options?: { tag?: string }) => {
    if (!settings.push_enabled) return;

    // Native platform
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now(),
              title,
              body: body || "",
              schedule: { at: new Date(Date.now() + 100) },
              smallIcon: "ic_stat_notification",
              iconColor: "#3B82F6",
            },
          ],
        });
      } catch (error) {
        console.error("Error showing local notification:", error);
      }
      return;
    }

    // Web platform
    if (Notification.permission === "granted") {
      new Notification(title, {
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        body,
        tag: options?.tag,
      });
    }
  }, [settings.push_enabled]);

  const scheduleStreakReminder = useCallback(async () => {
    if (!settings.streak_reminders) return;
    
    const [hours, minutes] = settings.reminder_time.split(":").map(Number);
    
    // Native platform - schedule via Capacitor
    if (Capacitor.isNativePlatform()) {
      try {
        const now = new Date();
        const reminderTime = new Date(now);
        reminderTime.setHours(hours, minutes, 0, 0);
        
        if (now > reminderTime) {
          reminderTime.setDate(reminderTime.getDate() + 1);
        }

        await LocalNotifications.schedule({
          notifications: [
            {
              id: 1001,
              title: "🔥 Mantenha seu streak!",
              body: "Não perca sua sequência de estudos hoje!",
              schedule: { at: reminderTime, repeats: true, every: "day" },
              smallIcon: "ic_stat_notification",
              iconColor: "#F59E0B",
            },
          ],
        });
      } catch (error) {
        console.error("Error scheduling streak reminder:", error);
      }
      return;
    }

    // Web fallback with setTimeout
    const now = new Date();
    const reminderTime = new Date(now);
    reminderTime.setHours(hours, minutes, 0, 0);

    if (now > reminderTime) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    setTimeout(async () => {
      const { data: progress } = await supabase
        .from("user_progress")
        .select("last_study_date, daily_streak")
        .eq("user_id", userId)
        .maybeSingle();

      const today = new Date().toISOString().split("T")[0];
      
      if (progress?.last_study_date !== today) {
        showLocalNotification(
          "🔥 Mantenha seu streak!",
          `Você tem uma sequência de ${progress?.daily_streak || 0} dias! Não perca agora!`,
          { tag: "streak-reminder" }
        );
      }
    }, Math.min(timeUntilReminder, 2147483647));
  }, [settings, userId, showLocalNotification]);

  const sendDailyChallengeReminder = useCallback(() => {
    if (!settings.daily_challenge_reminders) return;
    
    showLocalNotification(
      "🎯 Desafio diário disponível!",
      "Complete o desafio de hoje e ganhe XP extra!",
      { tag: "daily-challenge" }
    );
  }, [settings.daily_challenge_reminders, showLocalNotification]);

  return {
    settings,
    permissionStatus,
    isLoading,
    requestPermission,
    subscribeToPush,
    updateSettings,
    showLocalNotification,
    scheduleStreakReminder,
    sendDailyChallengeReminder,
  };
};
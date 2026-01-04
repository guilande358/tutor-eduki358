import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
    loadSettings();
  }, [userId]);

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
    if (!("Notification" in window)) {
      toast({
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações push",
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
    setPermissionStatus(permission);
    
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
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe to push notifications
        // Note: In production, you'd need a VAPID key from your push service
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          // applicationServerKey: VAPID_PUBLIC_KEY // Add your VAPID key here
        });
      }

      // Save subscription to database
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

  const showLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (Notification.permission === "granted" && settings.push_enabled) {
      new Notification(title, {
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        ...options,
      });
    }
  }, [settings.push_enabled]);

  const scheduleStreakReminder = useCallback(() => {
    if (!settings.streak_reminders) return;
    
    // Check at reminder time if user hasn't studied today
    const now = new Date();
    const [hours, minutes] = settings.reminder_time.split(":").map(Number);
    const reminderTime = new Date(now);
    reminderTime.setHours(hours, minutes, 0, 0);

    if (now > reminderTime) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    setTimeout(async () => {
      // Check if user studied today
      const { data: progress } = await supabase
        .from("user_progress")
        .select("last_study_date, daily_streak")
        .eq("user_id", userId)
        .maybeSingle();

      const today = new Date().toISOString().split("T")[0];
      
      if (progress?.last_study_date !== today) {
        showLocalNotification("🔥 Mantenha seu streak!", {
          body: `Você tem uma sequência de ${progress?.daily_streak || 0} dias! Não perca agora!`,
          tag: "streak-reminder",
        });
      }
    }, Math.min(timeUntilReminder, 2147483647)); // Max setTimeout value
  }, [settings, userId, showLocalNotification]);

  const sendDailyChallengeReminder = useCallback(() => {
    if (!settings.daily_challenge_reminders) return;
    
    showLocalNotification("🎯 Desafio diário disponível!", {
      body: "Complete o desafio de hoje e ganhe XP extra!",
      tag: "daily-challenge",
    });
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

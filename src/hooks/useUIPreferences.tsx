import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UIPreferences {
  hide_daily_banner: boolean;
  banner_hidden_until: string | null;
  chat_mode: "tutor" | "casual";
}

export const useUIPreferences = (userId: string) => {
  const [preferences, setPreferences] = useState<UIPreferences>({
    hide_daily_banner: false,
    banner_hidden_until: null,
    chat_mode: "tutor",
  });
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    const { data, error } = await supabase
      .from("user_ui_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching UI preferences:", error);
      return;
    }

    if (data) {
      setPreferences({
        hide_daily_banner: data.hide_daily_banner || false,
        banner_hidden_until: data.banner_hidden_until,
        chat_mode: (data.chat_mode as "tutor" | "casual") || "tutor",
      });
    }
    setLoading(false);
  }, [userId]);

  const updatePreference = async <K extends keyof UIPreferences>(
    key: K,
    value: UIPreferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    const { error } = await supabase
      .from("user_ui_preferences")
      .upsert({
        user_id: userId,
        ...newPreferences,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Error updating UI preference:", error);
      // Revert on error
      setPreferences(preferences);
    }
  };

  const hideBannerForToday = async () => {
    const today = new Date().toISOString().split("T")[0];
    await updatePreference("banner_hidden_until", today);
    await updatePreference("hide_daily_banner", true);
  };

  const setChatMode = async (mode: "tutor" | "casual") => {
    await updatePreference("chat_mode", mode);
  };

  const shouldShowBanner = () => {
    if (!preferences.hide_daily_banner) return true;
    
    const today = new Date().toISOString().split("T")[0];
    if (preferences.banner_hidden_until && preferences.banner_hidden_until < today) {
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    hideBannerForToday,
    setChatMode,
    shouldShowBanner,
    chatMode: preferences.chat_mode,
  };
};

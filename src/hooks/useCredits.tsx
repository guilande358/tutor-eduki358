import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CreditsData {
  credits: number;
  creditsUsedThisMonth: number;
  lastCreditsReset: string;
  creditsReceivedToday: number;
  lastDailyCreditDate: string;
  isPremium: boolean;
}

const MAX_MONTHLY_CREDITS = 50;
const DAILY_CREDITS = 10;

export const useCredits = (userId: string) => {
  const [creditsData, setCreditsData] = useState<CreditsData>({
    credits: 10,
    creditsUsedThisMonth: 0,
    lastCreditsReset: new Date().toISOString().split('T')[0],
    creditsReceivedToday: 10,
    lastDailyCreditDate: new Date().toISOString().split('T')[0],
    isPremium: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('credits, credits_used_this_month, last_credits_reset, credits_received_today, last_daily_credit_date, is_premium')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().toISOString().slice(0, 7);
        const lastResetMonth = data.last_credits_reset ? data.last_credits_reset.slice(0, 7) : currentMonth;

        let needsUpdate = false;
        let updatedData: any = {};

        // Reset mensal
        if (currentMonth !== lastResetMonth) {
          updatedData.credits_used_this_month = 0;
          updatedData.last_credits_reset = today;
          updatedData.credits_received_today = 0;
          updatedData.last_daily_credit_date = today;
          needsUpdate = true;
        }

        // Créditos diários
        const lastDailyDate = data.last_daily_credit_date || today;
        if (lastDailyDate !== today) {
          const totalReceivedThisMonth = data.credits_used_this_month || 0;
          const canReceiveToday = Math.min(DAILY_CREDITS, MAX_MONTHLY_CREDITS - totalReceivedThisMonth);
          
          if (canReceiveToday > 0) {
            updatedData.credits = (data.credits || 0) + canReceiveToday;
            updatedData.credits_received_today = canReceiveToday;
            updatedData.last_daily_credit_date = today;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          await supabase
            .from('user_progress')
            .update(updatedData)
            .eq('user_id', userId);

          // Refetch after update
          const { data: refreshed } = await supabase
            .from('user_progress')
            .select('credits, credits_used_this_month, last_credits_reset, credits_received_today, last_daily_credit_date, is_premium')
            .eq('user_id', userId)
            .maybeSingle();

          if (refreshed) {
            setCreditsData({
              credits: refreshed.credits ?? 10,
              creditsUsedThisMonth: refreshed.credits_used_this_month ?? 0,
              lastCreditsReset: refreshed.last_credits_reset ?? today,
              creditsReceivedToday: refreshed.credits_received_today ?? 10,
              lastDailyCreditDate: refreshed.last_daily_credit_date ?? today,
              isPremium: refreshed.is_premium ?? false,
            });
          }
        } else {
          setCreditsData({
            credits: data.credits ?? 10,
            creditsUsedThisMonth: data.credits_used_this_month ?? 0,
            lastCreditsReset: data.last_credits_reset ?? today,
            creditsReceivedToday: data.credits_received_today ?? 10,
            lastDailyCreditDate: data.last_daily_credit_date ?? today,
            isPremium: data.is_premium ?? false,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar créditos:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Real-time subscription for automatic updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`credits-realtime-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          setCreditsData(prev => ({
            ...prev,
            credits: newData.credits ?? prev.credits,
            creditsUsedThisMonth: newData.credits_used_this_month ?? prev.creditsUsedThisMonth,
            isPremium: newData.is_premium ?? prev.isPremium,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const useCredit = async (): Promise<boolean> => {
    if (creditsData.isPremium) return true;
    if (creditsData.credits <= 0) return false;

    try {
      const newCredits = creditsData.credits - 1;
      const newUsed = creditsData.creditsUsedThisMonth + 1;

      await supabase
        .from('user_progress')
        .update({
          credits: newCredits,
          credits_used_this_month: newUsed,
        })
        .eq('user_id', userId);

      setCreditsData(prev => ({
        ...prev,
        credits: newCredits,
        creditsUsedThisMonth: newUsed,
      }));

      return true;
    } catch (error) {
      console.error('Erro ao usar crédito:', error);
      return false;
    }
  };

  const addCredits = async (amount: number): Promise<boolean> => {
    try {
      const newCredits = creditsData.credits + amount;

      await supabase
        .from('user_progress')
        .update({ credits: newCredits })
        .eq('user_id', userId);

      setCreditsData(prev => ({
        ...prev,
        credits: newCredits,
      }));

      return true;
    } catch (error) {
      console.error('Erro ao adicionar créditos:', error);
      return false;
    }
  };

  const hasCredits = creditsData.isPremium || creditsData.credits > 0;
  const remainingCredits = creditsData.credits;
  const maxCredits = MAX_MONTHLY_CREDITS;

  return {
    ...creditsData,
    loading,
    hasCredits,
    remainingCredits,
    maxCredits,
    useCredit,
    addCredits,
    refetch: fetchCredits,
  };
};

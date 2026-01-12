import { Capacitor } from "@capacitor/core";
import { useToast } from "@/components/ui/use-toast";

interface ShareData {
  title: string;
  text: string;
  url?: string;
}

export const useNativeShare = () => {
  const { toast } = useToast();

  const share = async (data: ShareData): Promise<{ success: boolean; copied?: boolean }> => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Native platform - use Capacitor Share
        const { Share } = await import("@capacitor/share");
        await Share.share({
          title: data.title,
          text: data.text,
          url: data.url,
          dialogTitle: "Compartilhar",
        });
        return { success: true };
      } else if (navigator.share) {
        // Web Share API
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url,
        });
        return { success: true };
      } else {
        // Fallback - copy to clipboard
        const textToCopy = data.url || data.text;
        await navigator.clipboard.writeText(textToCopy);
        toast({
          title: "Link copiado! 📋",
          description: "Cole onde quiser compartilhar",
        });
        return { success: true, copied: true };
      }
    } catch (error: any) {
      // User cancelled share or error
      if (error?.name !== "AbortError") {
        console.error("Erro ao compartilhar:", error);
        // Fallback to clipboard
        try {
          const textToCopy = data.url || data.text;
          await navigator.clipboard.writeText(textToCopy);
          toast({
            title: "Link copiado! 📋",
            description: "Cole onde quiser compartilhar",
          });
          return { success: true, copied: true };
        } catch {
          toast({
            title: "Erro",
            description: "Não foi possível compartilhar",
            variant: "destructive",
          });
        }
      }
      return { success: false };
    }
  };

  return { share };
};

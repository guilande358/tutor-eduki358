import { Capacitor } from '@capacitor/core';
import { useToast } from '@/components/ui/use-toast';
import { useCallback } from 'react';

export const useNativePermissions = () => {
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();
  
  const requestMediaPermissions = useCallback(async (): Promise<boolean> => {
    try {
      // Request both camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      // Stop tracks immediately after permission check
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: any) {
      console.error('Permission request failed:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast({
          title: "Permissões necessárias",
          description: isNative 
            ? "Ative câmera e microfone nas configurações do app para usar a Sala de Estudo."
            : "Permita o acesso à câmera e microfone para usar a Sala de Estudo.",
          variant: "destructive",
          duration: 8000,
        });
        return false;
      }
      
      if (error.name === 'NotFoundError') {
        toast({
          title: "Dispositivo não encontrado",
          description: "Câmera ou microfone não foram encontrados neste dispositivo.",
          variant: "destructive",
        });
        return false;
      }
      
      return false;
    }
  }, [isNative, toast]);
  
  const showPermissionDeniedMessage = useCallback(() => {
    toast({
      title: "Permissão negada",
      description: isNative 
        ? "Ative câmera e microfone nas configurações do app para usar a Sala de Estudo."
        : "Permissão negada. Habilite nas configurações do navegador.",
      variant: "destructive",
      duration: 6000,
    });
  }, [isNative, toast]);
  
  return {
    isNative,
    requestMediaPermissions,
    showPermissionDeniedMessage,
  };
};

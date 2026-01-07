import { Capacitor } from '@capacitor/core';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import { useToast } from '@/components/ui/use-toast';
import { useCallback } from 'react';

export const useNativePermissions = () => {
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();
  
  const openAppSettings = useCallback(async () => {
    if (!isNative) return;
    
    try {
      const platform = Capacitor.getPlatform();
      if (platform === 'android') {
        await NativeSettings.openAndroid({
          option: AndroidSettings.ApplicationDetails,
        });
      } else if (platform === 'ios') {
        await NativeSettings.openIOS({
          option: IOSSettings.App,
        });
      }
    } catch (error) {
      console.error('Failed to open app settings:', error);
      toast({
        title: "Não foi possível abrir configurações",
        description: "Vá em Configurações > Apps > EduKI > Permissões",
        variant: "destructive",
      });
    }
  }, [isNative, toast]);
  
  const requestMediaPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: any) {
      console.error('Permission request failed:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        if (isNative) {
          toast({
            title: "Permissões necessárias",
            description: "Ative câmera e microfone nas configurações do app.",
            variant: "destructive",
            duration: 8000,
            action: (
              <button
                onClick={openAppSettings}
                className="bg-white text-destructive px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100"
              >
                Abrir Config.
              </button>
            ),
          });
        } else {
          toast({
            title: "Permissões necessárias",
            description: "Permita o acesso à câmera e microfone para usar a Sala de Estudo.",
            variant: "destructive",
            duration: 8000,
          });
        }
        return false;
      }
      
      if (error.name === 'NotFoundError') {
        toast({
          title: "Dispositivo não encontrado",
          description: "Câmera ou microfone não foram encontrados.",
          variant: "destructive",
        });
        return false;
      }
      
      return false;
    }
  }, [isNative, toast, openAppSettings]);
  
  const showPermissionDeniedMessage = useCallback(() => {
    if (isNative) {
      toast({
        title: "Permissão negada",
        description: "Ative câmera e microfone nas configurações do app.",
        variant: "destructive",
        duration: 6000,
        action: (
          <button
            onClick={openAppSettings}
            className="bg-white text-destructive px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100"
          >
            Abrir Config.
          </button>
        ),
      });
    } else {
      toast({
        title: "Permissão negada",
        description: "Habilite nas configurações do navegador.",
        variant: "destructive",
        duration: 6000,
      });
    }
  }, [isNative, toast, openAppSettings]);
  
  return {
    isNative,
    requestMediaPermissions,
    showPermissionDeniedMessage,
    openAppSettings,
  };
};

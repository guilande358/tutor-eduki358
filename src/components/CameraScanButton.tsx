import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, ScanLine, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Capacitor } from "@capacitor/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

interface CameraScanButtonProps {
  onImageCapture: (imageBase64: string) => void;
  disabled?: boolean;
}

const CameraScanButton = ({ onImageCapture, disabled }: CameraScanButtonProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  const handleCapture = async () => {
    setIsProcessing(true);
    setShowDialog(true);

    try {
      let imageData: string | null = null;

      if (isNative) {
        // Use Capacitor Camera
        const { Camera: CapCamera, CameraResultType, CameraSource } = await import("@capacitor/camera");
        
        const photo = await CapCamera.getPhoto({
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera,
          quality: 90,
          allowEditing: false,
          correctOrientation: true,
        });

        if (photo.base64String) {
          imageData = `data:image/${photo.format};base64,${photo.base64String}`;
        }
      } else {
        // Web fallback - file input
        imageData = await captureFromWebInput();
      }

      if (imageData) {
        setPreviewImage(imageData);
        
        // Simulate processing delay with animation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        onImageCapture(imageData);
        toast({
          title: "Imagem capturada! 📸",
          description: "Enviando para análise...",
        });
      }
    } catch (error: any) {
      console.error("Camera error:", error);
      
      if (error.message?.includes("cancelled") || error.message?.includes("canceled")) {
        // User cancelled - no toast needed
      } else {
        toast({
          title: "Erro ao capturar",
          description: error.message || "Não foi possível acessar a câmera",
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setShowDialog(false);
        setPreviewImage(null);
      }, 500);
    }
  };

  const captureFromWebInput = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";

      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          resolve(null);
        }
      };

      input.click();
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCapture}
        disabled={disabled || isProcessing}
        className="gap-2"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
        Scan
      </Button>

      {/* Processing Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-primary animate-pulse" />
              Processando Imagem
            </DialogTitle>
            <DialogDescription>
              Analisando o exercício capturado...
            </DialogDescription>
          </DialogHeader>

          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <AnimatePresence>
              {previewImage ? (
                <motion.img
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scanner animation overlay */}
            {isProcessing && previewImage && (
              <motion.div
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
                initial={{ top: 0 }}
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            )}
          </div>

          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowDialog(false);
                setIsProcessing(false);
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CameraScanButton;

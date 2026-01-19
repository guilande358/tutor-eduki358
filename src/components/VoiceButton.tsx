import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  type: "listen" | "speak";
  isActive: boolean;
  isSupported: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: "sm" | "default" | "icon";
  className?: string;
}

const VoiceButton = ({
  type,
  isActive,
  isSupported,
  onToggle,
  disabled,
  size = "icon",
  className,
}: VoiceButtonProps) => {
  if (!isSupported) return null;

  const isListening = type === "listen";
  
  const Icon = isListening
    ? isActive
      ? MicOff
      : Mic
    : isActive
    ? VolumeX
    : Volume2;

  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size={size}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "transition-all",
        isActive && isListening && "bg-red-500 hover:bg-red-600 animate-pulse",
        isActive && !isListening && "bg-blue-500 hover:bg-blue-600",
        className
      )}
      title={
        isListening
          ? isActive
            ? "Parar de ouvir"
            : "Falar por voz"
          : isActive
          ? "Parar de falar"
          : "Ouvir resposta"
      }
    >
      <Icon className="w-4 h-4" />
    </Button>
  );
};

export default VoiceButton;

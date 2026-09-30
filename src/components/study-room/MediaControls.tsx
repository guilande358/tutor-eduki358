import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { 
  Mic, 
  MicOff, 
  Video,
  VideoOff,
  Circle, 
  Square,
  Send,
  Trash2,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaControlsProps {
  onSendVoiceMessage?: (blob: Blob) => void;
  compact?: boolean;
  isVideoEnabled?: boolean;
  onToggleCamera?: () => void;
  isAudioEnabled?: boolean;
  onToggleMicrophone?: () => void;
}

const MediaControls = ({ 
  onSendVoiceMessage, 
  compact = false,
  isVideoEnabled,
  onToggleCamera,
  isAudioEnabled,
  onToggleMicrophone,
}: MediaControlsProps) => {
  const localDevices = useMediaDevices();
  const audioRef = useRef<HTMLAudioElement>(null);

  const activeVideo = isVideoEnabled !== undefined ? isVideoEnabled : localDevices.mediaState.isVideoEnabled;
  const toggleCam = onToggleCamera || localDevices.toggleCamera;
  const activeAudio = isAudioEnabled !== undefined ? isAudioEnabled : localDevices.mediaState.isAudioEnabled;
  const toggleMic = onToggleMicrophone || localDevices.toggleMicrophone;

  const handleSendVoice = () => {
    if (localDevices.mediaState.recordedBlob && onSendVoiceMessage) {
      onSendVoiceMessage(localDevices.mediaState.recordedBlob);
      localDevices.clearRecording();
    }
  };

  const playRecording = () => {
    if (localDevices.mediaState.recordedBlob && audioRef.current) {
      audioRef.current.src = URL.createObjectURL(localDevices.mediaState.recordedBlob);
      audioRef.current.play();
    }
  };

  return (
    <Card className={cn("p-4", compact && "p-2")}>
      <div className="space-y-4">
        {/* Main Controls - Mic & Camera */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Button
            variant={activeAudio ? "default" : "outline"}
            size={compact ? "sm" : "default"}
            onClick={toggleMic}
            className="gap-2"
          >
            {activeAudio ? (
              <>
                <Mic className="w-4 h-4" />
                {!compact && "Microfone"}
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4" />
                {!compact && "Microfone"}
              </>
            )}
          </Button>

          <Button
            variant={activeVideo ? "default" : "outline"}
            size={compact ? "sm" : "default"}
            onClick={toggleCam}
            className="gap-2"
          >
            {activeVideo ? (
              <>
                <Video className="w-4 h-4" />
                {!compact && "Câmara"}
              </>
            ) : (
              <>
                <VideoOff className="w-4 h-4" />
                {!compact && "Câmara"}
              </>
            )}
          </Button>

          {/* Recording Button */}
          {!localDevices.mediaState.isRecording && !localDevices.mediaState.recordedBlob && (
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              onClick={localDevices.startRecording}
              className="gap-2 text-red-500 hover:text-red-600"
            >
              <Circle className="w-4 h-4 fill-red-500" />
              {!compact && "Gravar"}
            </Button>
          )}

          {localDevices.mediaState.isRecording && (
            <Button
              variant="destructive"
              size={compact ? "sm" : "default"}
              onClick={localDevices.stopRecording}
              className="gap-2 animate-pulse"
            >
              <Square className="w-4 h-4" />
              {!compact && "Parar"}
            </Button>
          )}
        </div>

        {/* Recording Controls */}
        {localDevices.mediaState.recordedBlob && !localDevices.mediaState.isRecording && (
          <div className="flex items-center justify-center gap-2 p-2 bg-muted rounded-lg">
            <audio ref={audioRef} className="hidden" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={playRecording}
              className="gap-1"
            >
              <Play className="w-4 h-4" />
              Ouvir
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={localDevices.clearRecording}
              className="gap-1 text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Apagar
            </Button>

            {onSendVoiceMessage && (
              <Button
                size="sm"
                onClick={handleSendVoice}
                className="gap-1"
              >
                <Send className="w-4 h-4" />
                Enviar
              </Button>
            )}
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              activeAudio ? "bg-green-500" : "bg-muted-foreground"
            )} />
            Áudio {activeAudio ? "ligado" : "desligado"}
          </div>
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              activeVideo ? "bg-green-500" : "bg-muted-foreground"
            )} />
            Câmara {activeVideo ? "ligada" : "desligada"}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MediaControls;

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
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
}

const MediaControls = ({ onSendVoiceMessage, compact = false }: MediaControlsProps) => {
  const {
    mediaState,
    hasPermissions,
    videoRef,
    toggleCamera,
    toggleMicrophone,
    startRecording,
    stopRecording,
    clearRecording,
  } = useMediaDevices();

  const audioRef = useRef<HTMLAudioElement>(null);

  const handleSendVoice = () => {
    if (mediaState.recordedBlob && onSendVoiceMessage) {
      onSendVoiceMessage(mediaState.recordedBlob);
      clearRecording();
    }
  };

  const playRecording = () => {
    if (mediaState.recordedBlob && audioRef.current) {
      audioRef.current.src = URL.createObjectURL(mediaState.recordedBlob);
      audioRef.current.play();
    }
  };

  return (
    <Card className={cn("p-4", compact && "p-2")}>
      <div className="space-y-4">
        {/* Video Preview */}
        {mediaState.isVideoEnabled && (
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-h-48">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <Badge className="absolute top-2 left-2 bg-green-500">
              Ao vivo
            </Badge>
          </div>
        )}

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant={mediaState.isVideoEnabled ? "default" : "outline"}
            size={compact ? "sm" : "default"}
            onClick={toggleCamera}
            className="gap-2"
          >
            {mediaState.isVideoEnabled ? (
              <>
                <Video className="w-4 h-4" />
                {!compact && "Câmera"}
              </>
            ) : (
              <>
                <VideoOff className="w-4 h-4" />
                {!compact && "Câmera"}
              </>
            )}
          </Button>

          <Button
            variant={mediaState.isAudioEnabled ? "default" : "outline"}
            size={compact ? "sm" : "default"}
            onClick={toggleMicrophone}
            className="gap-2"
          >
            {mediaState.isAudioEnabled ? (
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

          {/* Recording Button */}
          {!mediaState.isRecording && !mediaState.recordedBlob && (
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              onClick={startRecording}
              className="gap-2 text-red-500 hover:text-red-600"
            >
              <Circle className="w-4 h-4 fill-red-500" />
              {!compact && "Gravar"}
            </Button>
          )}

          {mediaState.isRecording && (
            <Button
              variant="destructive"
              size={compact ? "sm" : "default"}
              onClick={stopRecording}
              className="gap-2 animate-pulse"
            >
              <Square className="w-4 h-4" />
              {!compact && "Parar"}
            </Button>
          )}
        </div>

        {/* Recording Controls */}
        {mediaState.recordedBlob && !mediaState.isRecording && (
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
              onClick={clearRecording}
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
              mediaState.isVideoEnabled ? "bg-green-500" : "bg-muted-foreground"
            )} />
            Câmera {mediaState.isVideoEnabled ? "ligada" : "desligada"}
          </div>
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              mediaState.isAudioEnabled ? "bg-green-500" : "bg-muted-foreground"
            )} />
            Áudio {mediaState.isAudioEnabled ? "ligado" : "desligado"}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MediaControls;

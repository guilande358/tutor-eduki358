import { useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mic, MicOff, Video, VideoOff } from "lucide-react";

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  participantNames: Map<string, string>;
  localUserId: string;
  localUserName: string;
  isCameraOn: boolean;
  isMicOn: boolean;
}

const VideoGrid = ({
  localStream,
  remoteStreams,
  participantNames,
  localUserId,
  localUserName,
  isCameraOn,
  isMicOn,
}: VideoGridProps) => {
  const totalParticipants = 1 + remoteStreams.size;
  const gridCols = totalParticipants <= 2 ? 2 : totalParticipants <= 4 ? 2 : 3;

  return (
    <div className={`grid gap-2 h-full grid-cols-${gridCols}`}>
      {/* Avatar local (sem vídeo local - apenas indicadores) */}
      <Card className="relative overflow-hidden bg-muted aspect-video">
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-primary text-white text-xl">
              {localUserName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">
            {localUserName} (Você)
          </span>
          <div className="flex gap-1">
            {isMicOn ? (
              <div className="bg-green-500/80 p-1 rounded">
                <Mic className="w-3 h-3 text-white" />
              </div>
            ) : (
              <div className="bg-red-500/80 p-1 rounded">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
            {isCameraOn ? (
              <div className="bg-green-500/80 p-1 rounded">
                <Video className="w-3 h-3 text-white" />
              </div>
            ) : (
              <div className="bg-red-500/80 p-1 rounded">
                <VideoOff className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Vídeos remotos via WebRTC */}
      {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
        <RemoteVideo
          key={peerId}
          stream={stream}
          name={participantNames.get(peerId) || 'Participante'}
        />
      ))}

      {/* Placeholder para grid vazio */}
      {remoteStreams.size === 0 && (
        <Card className="relative overflow-hidden bg-muted/50 aspect-video flex items-center justify-center border-dashed">
          <div className="text-center text-muted-foreground">
            <User className="w-8 h-8 mx-auto mb-2" />
            <p className="text-xs">Aguardando participantes...</p>
          </div>
        </Card>
      )}
    </div>
  );
};

const RemoteVideo = ({ stream, name }: { stream: MediaStream; name: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream.getVideoTracks().some(track => track.enabled);

  return (
    <Card className="relative overflow-hidden bg-muted aspect-video">
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 to-primary/20">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-accent text-white text-xl">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div className="absolute bottom-2 left-2">
        <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">
          {name}
        </span>
      </div>
    </Card>
  );
};

export default VideoGrid;
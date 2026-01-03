import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Bot } from "lucide-react";

interface Participant {
  id: string;
  user_id: string;
  is_tutor_active: boolean;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ParticipantGridProps {
  roomId: string;
  hostUserId: string;
  currentUserId: string;
  isTutorActive: boolean;
}

const ParticipantGrid = ({ roomId, hostUserId, currentUserId, isTutorActive }: ParticipantGridProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    loadParticipants();
    subscribeToParticipants();
  }, [roomId]);

  const loadParticipants = async () => {
    const { data } = await supabase
      .from("room_participants")
      .select("*")
      .eq("room_id", roomId);

    if (data) {
      // Load profiles for participants
      const userIds = data.map((p) => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const participantsWithProfiles = data.map((p) => ({
        ...p,
        profile: profiles?.find((pr) => pr.id === p.user_id),
      }));

      setParticipants(participantsWithProfiles);
    }
  };

  const subscribeToParticipants = () => {
    const channel = supabase
      .channel(`room-participants-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_participants",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Card className="p-3">
      <h4 className="text-sm font-semibold mb-3">
        Participantes ({participants.length + (isTutorActive ? 1 : 0)})
      </h4>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {/* Tutor EduKI (se ativo) */}
        {isTutorActive && (
          <div className="flex flex-col items-center gap-2 p-2 rounded-lg bg-primary/10 border-2 border-primary">
            <div className="relative">
              <Avatar className="w-12 h-12 border-2 border-primary">
                <AvatarFallback className="bg-gradient-primary text-white">
                  <Bot className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium">Tutor EduKI</p>
              <Badge variant="secondary" className="text-[10px] px-1">
                IA
              </Badge>
            </div>
          </div>
        )}

        {/* Participantes */}
        {participants.map((participant) => {
          const isHost = participant.user_id === hostUserId;
          const isCurrentUser = participant.user_id === currentUserId;
          const name = participant.profile?.full_name || "Anônimo";

          return (
            <div
              key={participant.id}
              className={`flex flex-col items-center gap-2 p-2 rounded-lg ${
                isCurrentUser ? "bg-primary/5" : "bg-muted/50"
              }`}
            >
              <div className="relative">
                <Avatar className="w-12 h-12">
                  {participant.profile?.avatar_url && (
                    <AvatarImage src={participant.profile.avatar_url} />
                  )}
                  <AvatarFallback>{getInitials(name)}</AvatarFallback>
                </Avatar>
                {isHost && (
                  <div className="absolute -top-1 -right-1">
                    <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium truncate max-w-[80px]">
                  {isCurrentUser ? "Você" : name}
                </p>
                {isHost && (
                  <Badge variant="secondary" className="text-[10px] px-1">
                    Host
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ParticipantGrid;

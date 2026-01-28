import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Crown, Bot, MessageCircle, PenTool, BookOpen, Brain } from "lucide-react";

interface Participant {
  id: string;
  user_id: string;
  is_tutor_active: boolean;
  joined_at: string;
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

// Activity vignettes based on random selection for demo
const activities = [
  { label: "Resolvendo...", icon: PenTool, color: "text-blue-500" },
  { label: "Estudando", icon: BookOpen, color: "text-green-500" },
  { label: "Pensando", icon: Brain, color: "text-purple-500" },
  { label: "Digitando", icon: MessageCircle, color: "text-orange-500" },
  { label: "Online", icon: null, color: "text-muted-foreground" },
];

const getRandomActivity = (seed: string) => {
  const index = seed.charCodeAt(0) % activities.length;
  return activities[index];
};

const ParticipantGrid = ({ roomId, hostUserId, currentUserId, isTutorActive }: ParticipantGridProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    loadParticipants();
    const cleanup = subscribeToParticipants();
    return cleanup;
  }, [roomId]);

  const loadParticipants = async () => {
    const { data } = await supabase
      .from("room_participants")
      .select("*")
      .eq("room_id", roomId);

    if (data) {
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

  const totalCount = participants.length + (isTutorActive ? 1 : 0);

  return (
    <Card className="p-3">
      <h4 className="text-sm font-semibold mb-3">
        Participantes ({totalCount})
      </h4>

      {/* Horizontal scrollable Messenger-style layout */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-2">
          {/* Tutor EduKI (if active) */}
          {isTutorActive && (
            <div className="flex flex-col items-center gap-1 min-w-[72px]">
              <div className="relative">
                <Avatar className="w-14 h-14 ring-2 ring-primary ring-offset-2 ring-offset-background">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                    <Bot className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
              </div>
              <p className="text-xs font-medium text-center truncate w-full">
                Tutor EduKI
              </p>
              <div className="flex items-center gap-1 text-primary">
                <Brain className="w-3 h-3" />
                <span className="text-[10px]">Ajudando</span>
              </div>
            </div>
          )}

          {/* Human Participants */}
          {participants.map((participant) => {
            const isHost = participant.user_id === hostUserId;
            const isCurrentUser = participant.user_id === currentUserId;
            const name = participant.profile?.full_name || "Anônimo";
            const activity = getRandomActivity(participant.id);

            return (
              <div
                key={participant.id}
                className="flex flex-col items-center gap-1 min-w-[72px]"
              >
                <div className="relative">
                  <Avatar 
                    className={`w-14 h-14 ring-2 ring-offset-2 ring-offset-background ${
                      isHost 
                        ? "ring-yellow-500" 
                        : isCurrentUser 
                        ? "ring-primary/50" 
                        : "ring-muted"
                    }`}
                  >
                    {participant.profile?.avatar_url && (
                      <AvatarImage src={participant.profile.avatar_url} />
                    )}
                    <AvatarFallback className={isCurrentUser ? "bg-primary/10" : ""}>
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Host crown */}
                  {isHost && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  {/* Online indicator */}
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                </div>
                
                <p className="text-xs font-medium text-center truncate w-full">
                  {isCurrentUser ? "Você" : name.split(" ")[0]}
                </p>
                
                {/* Activity vignette */}
                <div className={`flex items-center gap-0.5 ${activity.color}`}>
                  {activity.icon && <activity.icon className="w-2.5 h-2.5" />}
                  <span className="text-[10px]">{activity.label}</span>
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Legend */}
      {participants.length > 0 && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-[10px] text-muted-foreground">Online</span>
          </div>
          <div className="flex items-center gap-1">
            <Crown className="w-3 h-3 text-yellow-500" />
            <span className="text-[10px] text-muted-foreground">Host</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ParticipantGrid;
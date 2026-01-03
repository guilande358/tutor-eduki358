import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Share2, LogOut, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import StudyRoomLobby from "@/components/study-room/StudyRoomLobby";
import Whiteboard from "@/components/study-room/Whiteboard";
import RoomChat from "@/components/study-room/RoomChat";
import ParticipantGrid from "@/components/study-room/ParticipantGrid";
import CallTutorButton from "@/components/study-room/CallTutorButton";
import { motion } from "framer-motion";

interface StudyRoomPageProps {
  userId: string;
  userName: string;
  onBack: () => void;
}

interface Room {
  id: string;
  code: string;
  title: string;
  host_user_id: string;
  mode: string;
}

const StudyRoomPage = ({ userId, userName, onBack }: StudyRoomPageProps) => {
  const [searchParams] = useSearchParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [isTutorActive, setIsTutorActive] = useState(false);
  const [tutorLoading, setTutorLoading] = useState(false);
  const { toast } = useToast();

  const codeFromUrl = searchParams.get("code");

  useEffect(() => {
    if (codeFromUrl) {
      joinRoomByCode(codeFromUrl);
    }
  }, [codeFromUrl]);

  const joinRoomByCode = async (code: string) => {
    const { data, error } = await supabase
      .from("study_rooms")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (data && !error) {
      // Add as participant
      await supabase.from("room_participants").upsert({
        room_id: data.id,
        user_id: userId,
      });
      setRoom(data as Room);
    }
  };

  const handleJoinRoom = (roomId: string, roomCode: string) => {
    // Fetch room details
    supabase
      .from("study_rooms")
      .select("*")
      .eq("id", roomId)
      .single()
      .then(({ data }) => {
        if (data) {
          setRoom(data as Room);
        }
      });
  };

  const leaveRoom = async () => {
    if (!room) return;

    await supabase
      .from("room_participants")
      .delete()
      .eq("room_id", room.id)
      .eq("user_id", userId);

    setRoom(null);
    toast({
      title: "Você saiu da sala",
      description: room.title,
    });
  };

  const copyCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.code);
      toast({ title: "Código copiado!", description: room.code });
    }
  };

  const shareRoom = () => {
    if (room) {
      const url = `${window.location.origin}/study-room?code=${room.code}`;
      if (navigator.share) {
        navigator.share({
          title: `Sala de Estudo: ${room.title}`,
          text: `Entre na minha sala! Código: ${room.code}`,
          url,
        });
      } else {
        navigator.clipboard.writeText(url);
        toast({ title: "Link copiado!" });
      }
    }
  };

  const handleToggleTutor = async (active: boolean) => {
    setIsTutorActive(active);
    
    // Update participant record
    await supabase
      .from("room_participants")
      .update({ is_tutor_active: active })
      .eq("room_id", room?.id)
      .eq("user_id", userId);

    if (active) {
      toast({
        title: "Tutor EduKI ativado! 🤖",
        description: "O tutor agora está disponível para ajudar",
      });
    }
  };

  const handleAskTutor = async (question: string) => {
    if (!room) return;

    setTutorLoading(true);
    try {
      // Send question to chat
      await supabase.from("room_messages").insert({
        room_id: room.id,
        user_id: userId,
        content: `❓ ${question}`,
        content_type: "text",
      });

      // Call AI tutor
      const { data, error } = await supabase.functions.invoke("ai-tutor", {
        body: {
          message: `Estou em uma sala de estudo colaborativa. Por favor, responda de forma clara e didática, usando LaTeX para fórmulas quando necessário: ${question}`,
          userId,
          kiLevel: 50, // Default
        },
      });

      if (data?.response) {
        // Post AI response to chat
        await supabase.from("room_messages").insert({
          room_id: room.id,
          user_id: userId, // Will show as "Tutor" in UI
          content: `🤖 **Tutor EduKI:**\n\n${data.response}`,
          content_type: "latex",
        });
      }
    } catch (error) {
      console.error("Erro ao consultar tutor:", error);
      toast({
        title: "Erro",
        description: "Não foi possível obter resposta do tutor",
        variant: "destructive",
      });
    } finally {
      setTutorLoading(false);
    }
  };

  if (!room) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <StudyRoomLobby userId={userId} onJoinRoom={handleJoinRoom} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-120px)] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {room.title}
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{room.code}</Badge>
              <Badge variant="outline">
                {room.mode === "estudo" ? "📚 Modo Estudo" : "🎮 Modo Casual"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyCode}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={shareRoom}>
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={leaveRoom}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Whiteboard - Takes 2/3 on desktop */}
        <div className="lg:col-span-2 min-h-[300px] lg:min-h-0">
          <Whiteboard roomId={room.id} />
        </div>

        {/* Sidebar - Chat & Participants */}
        <div className="flex flex-col gap-4 min-h-[300px] lg:min-h-0">
          <ParticipantGrid
            roomId={room.id}
            hostUserId={room.host_user_id}
            currentUserId={userId}
            isTutorActive={isTutorActive}
          />
          <div className="flex-1 min-h-[200px]">
            <RoomChat roomId={room.id} userId={userId} userName={userName} />
          </div>
        </div>
      </div>

      {/* Floating Tutor Button */}
      <CallTutorButton
        isTutorActive={isTutorActive}
        onToggleTutor={handleToggleTutor}
        onAskTutor={handleAskTutor}
        loading={tutorLoading}
      />
    </motion.div>
  );
};

export default StudyRoomPage;

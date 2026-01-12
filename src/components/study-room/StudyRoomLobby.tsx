import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Users, Plus, ArrowRight, Copy, Share2, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { useNativeShare } from "@/hooks/useNativeShare";

interface StudyRoomLobbyProps {
  userId: string;
  onJoinRoom: (roomId: string, roomCode: string) => void;
}

const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const StudyRoomLobby = ({ userId, onJoinRoom }: StudyRoomLobbyProps) => {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [roomCode, setRoomCode] = useState("");
  const [roomTitle, setRoomTitle] = useState("Sala de Estudo");
  const [roomMode, setRoomMode] = useState<"estudo" | "casual">("estudo");
  const [loading, setLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<{ id: string; code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { share } = useNativeShare();

  const createRoom = async () => {
    setLoading(true);
    try {
      const code = generateRoomCode();
      
      const { data: room, error } = await supabase
        .from("study_rooms")
        .insert({
          code,
          host_user_id: userId,
          title: roomTitle,
          mode: roomMode,
        })
        .select()
        .single();

      if (error) throw error;

      // Adicionar host como participante
      await supabase.from("room_participants").insert({
        room_id: room.id,
        user_id: userId,
      });

      setCreatedRoom({ id: room.id, code: room.code });
      toast({
        title: "Sala criada! 🎉",
        description: `Código: ${room.code}`,
      });
    } catch (error) {
      console.error("Erro ao criar sala:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a sala",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!roomCode.trim()) {
      toast({
        title: "Código inválido",
        description: "Digite um código de sala válido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: room, error } = await supabase
        .from("study_rooms")
        .select("*")
        .eq("code", roomCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error || !room) {
        toast({
          title: "Sala não encontrada",
          description: "Verifique o código e tente novamente",
          variant: "destructive",
        });
        return;
      }

      // Adicionar como participante
      await supabase.from("room_participants").upsert({
        room_id: room.id,
        user_id: userId,
      });

      onJoinRoom(room.id, room.code);
    } catch (error) {
      console.error("Erro ao entrar na sala:", error);
      toast({
        title: "Erro",
        description: "Não foi possível entrar na sala",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (createdRoom) {
      await navigator.clipboard.writeText(createdRoom.code);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: createdRoom.code,
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareRoom = async () => {
    if (createdRoom) {
      const url = `${window.location.origin}/?code=${createdRoom.code}`;
      await share({
        title: "Sala de Estudo EduKI",
        text: `Entre na minha sala de estudo! Código: ${createdRoom.code}`,
        url,
      });
    }
  };

  if (createdRoom) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="p-8 text-center max-w-md mx-auto">
          <div className="p-4 bg-primary/10 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Sala Criada!</h2>
          <p className="text-muted-foreground mb-6">
            Compartilhe o código com seus amigos
          </p>

          <div className="bg-muted p-6 rounded-xl mb-6">
            <p className="text-4xl font-mono font-bold tracking-widest text-primary">
              {createdRoom.code}
            </p>
          </div>

          <div className="flex gap-3 mb-6">
            <Button onClick={copyCode} variant="outline" className="flex-1 gap-2">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado!" : "Copiar"}
            </Button>
            <Button onClick={shareRoom} variant="outline" className="flex-1 gap-2">
              <Share2 className="w-4 h-4" />
              Compartilhar
            </Button>
          </div>

          <Button
            onClick={() => onJoinRoom(createdRoom.id, createdRoom.code)}
            className="w-full gap-2"
            size="lg"
          >
            Entrar na Sala
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-6 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Sala de Estudo</h2>
            <p className="text-sm text-muted-foreground">
              Estude com amigos em tempo real
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={mode === "create" ? "default" : "outline"}
            onClick={() => setMode("create")}
            className="flex-1 gap-2"
          >
            <Plus className="w-4 h-4" />
            Criar Sala
          </Button>
          <Button
            variant={mode === "join" ? "default" : "outline"}
            onClick={() => setMode("join")}
            className="flex-1 gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            Entrar
          </Button>
        </div>

        {mode === "create" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Sala</Label>
              <Input
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                placeholder="Ex: Matemática - Álgebra"
              />
            </div>

            <div className="space-y-2">
              <Label>Modo</Label>
              <RadioGroup value={roomMode} onValueChange={(v) => setRoomMode(v as "estudo" | "casual")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="estudo" id="estudo" />
                  <Label htmlFor="estudo" className="flex flex-col">
                    <span>Modo Estudo 📚</span>
                    <span className="text-xs text-muted-foreground">
                      Tutor monitora e ajuda automaticamente
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="casual" id="casual" />
                  <Label htmlFor="casual" className="flex flex-col">
                    <span>Modo Casual 🎮</span>
                    <span className="text-xs text-muted-foreground">
                      Tutor disponível quando chamado
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button onClick={createRoom} className="w-full" disabled={loading}>
              {loading ? "Criando..." : "Criar Sala"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Código da Sala</Label>
              <Input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Ex: ABC123"
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
              />
            </div>

            <Button onClick={joinRoom} className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar na Sala"}
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default StudyRoomLobby;

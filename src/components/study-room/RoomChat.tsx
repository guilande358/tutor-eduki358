import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, Bot } from "lucide-react";
import MathRenderer from "@/components/MathRenderer";
import AttachmentButton from "./AttachmentButton";
import CameraScanButton from "./CameraScanButton";

interface RoomChatProps {
  roomId: string;
  userId: string;
  userName: string;
}

interface Message {
  id: string;
  user_id: string;
  content: string;
  content_type: string;
  created_at: string;
}

const RoomChat = ({ roomId, userId, userName }: RoomChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const cleanup = setupRealtimeSubscription();
    return () => {
      cleanup();
    };
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from("room_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data as Message[]);
      const userIds = [...new Set(data.map((m) => m.user_id))];
      loadUserNames(userIds);
    }
  };

  const loadUserNames = async (userIds: string[]) => {
    if (userIds.length === 0) return;

    const { data } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", userIds);

    if (data) {
      const names: Record<string, string> = {};
      data.forEach((p) => {
        names[p.id] = p.name || "Usuário";
      });
      setUserNames((prev) => ({ ...prev, ...names }));
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`room-messages-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          
          if (!userNames[newMsg.user_id]) {
            loadUserNames([newMsg.user_id]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const hasLatex = newMessage.includes("\\") || 
                       newMessage.includes("$") || 
                       newMessage.includes("^") ||
                       newMessage.includes("_");

      await supabase.from("room_messages").insert({
        room_id: roomId,
        user_id: userId,
        content: newMessage,
        content_type: hasLatex ? "latex" : "text",
      });

      setNewMessage("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setLoading(false);
    }
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
    <Card className="flex flex-col h-full">
      <div className="p-3 border-b">
        <h3 className="font-semibold">Chat da Sala</h3>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg) => {
            const isTutor = msg.content.startsWith("🤖");
            const isOwn = !isTutor && msg.user_id === userId;
            const senderName = isTutor ? "Tutor EduKI" : (userNames[msg.user_id] || "Colega");

            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className={
                    isTutor 
                      ? "bg-primary text-primary-foreground font-bold" 
                      : isOwn 
                        ? "bg-primary text-white" 
                        : "bg-muted"
                  }>
                    {isTutor ? <Bot className="w-4 h-4" /> : getInitials(senderName)}
                  </AvatarFallback>
                </Avatar>

                <div className={`max-w-[80%] ${isOwn ? "text-right" : ""}`}>
                  <p className="text-xs text-muted-foreground mb-1 font-medium">
                    {isTutor ? "🤖 Tutor EduKI" : isOwn ? "Você" : senderName}
                  </p>
                  <div
                    className={`p-3 rounded-lg ${
                      isTutor
                        ? "bg-primary/10 border border-primary/20 text-foreground"
                        : isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                    }`}
                  >
                    {msg.content_type === "latex" ? (
                      <MathRenderer content={msg.content} />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {messages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              Nenhuma mensagem ainda. Comece a conversa!
            </p>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t">
        <div className="flex gap-2">
          <AttachmentButton
            onImageSelect={() => {}}
            onFormulaInsert={(formula) => setNewMessage(prev => prev + ` $$${formula}$$ `)}
            disabled={loading}
          />
          <CameraScanButton
            onImageCapture={(_base64) => {
              setNewMessage(prev => prev ? prev + " 📷 [Imagem anexada]" : "📷 Analisar esta imagem de exercício");
            }}
            disabled={loading}
          />
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Digite sua mensagem..."
            disabled={loading}
            className="flex-1"
          />
          <Button 
            type="button"
            onClick={sendMessage} 
            disabled={loading || !newMessage.trim()}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Use fórmulas ou câmara para enviar exercícios
        </p>
      </div>
    </Card>
  );
};

export default RoomChat;

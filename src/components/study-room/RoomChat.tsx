import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import MathRenderer from "@/components/MathRenderer";
import AttachmentButton from "@/components/AttachmentButton";

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
  user_name?: string;
}

const RoomChat = ({ roomId, userId, userName }: RoomChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
  }, [roomId]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from("room_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (data) {
      setMessages(data);
      // Load user names
      const userIds = [...new Set(data.map((m) => m.user_id))];
      loadUserNames(userIds);
    }
  };

  const loadUserNames = async (userIds: string[]) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    if (data) {
      const names: Record<string, string> = {};
      data.forEach((p) => {
        names[p.id] = p.full_name || "Anônimo";
      });
      setUserNames(names);
    }
  };

  const subscribeToMessages = () => {
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
          
          // Load user name if not cached
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
      // Detectar se contém LaTeX
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
            const isOwn = msg.user_id === userId;
            const senderName = userNames[msg.user_id] || "...";

            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className={isOwn ? "bg-primary text-white" : ""}>
                    {getInitials(senderName)}
                  </AvatarFallback>
                </Avatar>

                <div className={`max-w-[80%] ${isOwn ? "text-right" : ""}`}>
                  <p className="text-xs text-muted-foreground mb-1">
                    {isOwn ? "Você" : senderName}
                  </p>
                  <div
                    className={`p-3 rounded-lg ${
                      isOwn
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
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={loading || !newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Use o botão de fórmula para inserir equações
        </p>
      </div>
    </Card>
  );
};

export default RoomChat;

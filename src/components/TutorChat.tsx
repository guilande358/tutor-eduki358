import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Send, Bot, User, Loader2, X, FileImage, Maximize2, Minimize2 } from "lucide-react";
import ConversationDrawer from "@/components/ConversationDrawer";
import MathRenderer from "@/components/MathRenderer";
import CreditsDisplay from "@/components/CreditsDisplay";
import NoCreditsDialog from "@/components/NoCreditsDialog";
import AttachmentButton from "@/components/AttachmentButton";
import { useCredits } from "@/hooks/useCredits";

interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  url?: string;
}

interface TutorChatProps {
  userId: string;
  kiLevel: number;
  onShowPremium?: () => void;
}

const TutorChat = ({ userId, kiLevel, onShowPremium }: TutorChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showNoCreditsDialog, setShowNoCreditsDialog] = useState(false);
  const [userXP, setUserXP] = useState(0);
  
  // Sistema de créditos
  const { hasCredits, useCredit, addCredits, isPremium, refetch: refetchCredits } = useCredits(userId);
  
  // Ref para acessar o viewport interno do ScrollArea (shadcn-ui)
  const viewportRef = useRef<HTMLDivElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadChatHistory();
    loadUserXP();
  }, [userId, currentConversationId]);

  const loadUserXP = async () => {
    const { data } = await supabase
      .from('user_progress')
      .select('xp')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) setUserXP(data.xp || 0);
  };

  // Scroll automático corrigido – vai sempre pro final quando nova mensagem chega
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    if (viewportRef.current) {
      const viewport = viewportRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  };

  const loadChatHistory = async () => {
    try {
      let conversationId = currentConversationId;

      if (!conversationId) {
        const { data: conversations, error: convError } = await supabase
          .from("conversations")
          .select("id")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (convError) throw convError;

        if (conversations && conversations.length > 0) {
          conversationId = conversations[0].id;
          setCurrentConversationId(conversationId);
        } else {
          const { data: newConv, error: createError } = await supabase
            .from("conversations")
            .insert({
              user_id: userId,
              title: "Nova conversa",
            })
            .select()
            .single();

          if (createError) throw createError;
          conversationId = newConv.id;
          setCurrentConversationId(conversationId);
        }
      }

      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", userId)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const messagesWithAttachments = await Promise.all(
          data.map(async (msg) => {
            const { data: attachments } = await supabase
              .from("chat_attachments")
              .select("*")
              .eq("message_id", msg.id);

            const attachmentsWithUrls = await Promise.all(
              (attachments || []).map(async (att) => {
                const { data: urlData } = await supabase.storage
                  .from("chat-attachments")
                  .createSignedUrl(att.file_path, 3600);

                return {
                  ...att,
                  url: urlData?.signedUrl,
                };
              })
            );

            return {
              role: msg.role as "user" | "assistant",
              content: msg.content,
              attachments: attachmentsWithUrls,
            };
          })
        );

        setMessages(messagesWithAttachments);
      } else {
        const welcomeMessage: Message = {
          role: "assistant",
          content: `Olá! 👋 Eu sou o EduKI, seu tutor de IA personalizado! Estou aqui para te ajudar a aprender qualquer coisa.\n\nVejo que você está no nível KI ${kiLevel}. Vou adaptar minhas explicações para o seu nível. O que gostaria de aprender hoje? 📚\n\n💡 Dica: Você pode enviar imagens de exercícios para eu te ajudar!`,
        };
        setMessages([welcomeMessage]);
        await saveMessage(welcomeMessage, conversationId);
      }
    } catch (error: any) {
      console.error("Erro ao carregar histórico:", error);
    }
  };

  const saveMessage = async (message: Message, conversationId?: string) => {
    try {
      const convId = conversationId || currentConversationId;
      if (!convId) return;

      const { error } = await supabase
        .from("chat_messages")
        .insert({
          user_id: userId,
          conversation_id: convId,
          role: message.role,
          content: message.content,
        });

      if (error) throw error;

      if (message.role === "user") {
        const { data: messages } = await supabase
          .from("chat_messages")
          .select("id")
          .eq("conversation_id", convId)
          .eq("role", "user");

        if (messages && messages.length === 1) {
          const title = message.content.length > 40
            ? message.content.substring(0, 40) + "..."
            : message.content;

          await supabase
            .from("conversations")
            .update({ title })
            .eq("id", convId);
        }
      }
    } catch (error: any) {
      console.error("Erro ao salvar mensagem:", error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length !== files.length) {
      toast({
        title: "Apenas imagens",
        description: "Por favor, selecione apenas arquivos de imagem",
        variant: "destructive",
      });
    }

    setSelectedFiles((prev) => [...prev, ...imageFiles].slice(0, 3));
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (messageId: string): Promise<Attachment[]> => {
    if (selectedFiles.length === 0) return [];

    setUploading(true);
    const uploadedAttachments: Attachment[] = [];

    try {
      for (const file of selectedFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `\( {userId}/ \){Date.now()}_\( {Math.random()}. \){fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("chat-attachments")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: attachmentData, error: attachmentError } = await supabase
          .from("chat_attachments")
          .insert({
            message_id: messageId,
            user_id: userId,
            file_name: file.name,
            file_path: fileName,
            file_type: file.type,
            file_size: file.size,
          })
          .select()
          .single();

        if (attachmentError) throw attachmentError;

        const { data: urlData } = await supabase.storage
          .from("chat-attachments")
          .createSignedUrl(fileName, 3600);

        uploadedAttachments.push({
          ...attachmentData,
          url: urlData?.signedUrl,
        });
      }

      setSelectedFiles([]);
      return uploadedAttachments;
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro ao enviar arquivos",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && selectedFiles.length === 0) || loading) return;

    // Verificar créditos antes de enviar (exceto Premium)
    if (!isPremium && !hasCredits) {
      setShowNoCreditsDialog(true);
      return;
    }

    const userMessage: Message = { 
      role: "user", 
      content: input || "📎 Enviou imagens"
    };
    
    setMessages((prev) => [...prev, userMessage]);
    const messageContent = input;
    setInput("");
    setLoading(true);

    const { data: savedMessage } = await supabase
      .from("chat_messages")
      .insert({
        user_id: userId,
        conversation_id: currentConversationId,
        role: userMessage.role,
        content: userMessage.content,
      })
      .select()
      .single();

    let attachments: Attachment[] = [];
    if (savedMessage && selectedFiles.length > 0) {
      attachments = await uploadFiles(savedMessage.id);
      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === prev.length - 1 ? { ...msg, attachments } : msg
        )
      );
    }

    try {
      const messagesForAI = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.attachments && msg.attachments.length > 0
          ? `\( {msg.content}\n\n[Usuário anexou \){msg.attachments.length} imagem(ns). Por favor, considere que o estudante enviou imagens relacionadas à pergunta.]`
          : msg.content,
      }));

      const { data, error } = await supabase.functions.invoke("ai-tutor", {
        body: {
          messages: messagesForAI,
          kiLevel,
          hasAttachments: attachments.length > 0,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Consumir 1 crédito após resposta bem-sucedida
      if (!isPremium) {
        await useCredit();
        refetchCredits();
      }
      
      await saveMessage(assistantMessage);
      
      if (currentConversationId) {
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", currentConversationId);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao conversar com o tutor",
        description: error.message,
        variant: "destructive",
      });
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

  const handleNewConversation = async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: userId,
          title: "Nova conversa",
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentConversationId(data.id);
      setMessages([]);
      
      toast({
        title: "Nova conversa iniciada",
        description: "Comece a conversar com o tutor!",
      });
    } catch (error: any) {
      console.error("Erro ao criar conversa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar uma nova conversa",
        variant: "destructive",
      });
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setMessages([]);
  };

  return (
    <div className={`${isFullScreen ? "fixed inset-0 z-50 bg-background" : ""}`}>
      <Card className={`flex flex-col shadow-lg ${isFullScreen ? "h-screen rounded-none" : "h-[600px]"}`}>
        <div className="p-4 border-b bg-gradient-primary text-white rounded-t-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ConversationDrawer
                userId={userId}
                currentConversationId={currentConversationId}
                onConversationSelect={handleSelectConversation}
                onNewConversation={handleNewConversation}
              />
              <Avatar className="border-2 border-white">
                <AvatarFallback className="bg-white text-primary">
                  <Bot className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">Tutor EduKI</h3>
                <p className="text-xs text-white/80">Sempre pronto para te ajudar</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditsDisplay userId={userId} compact />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="text-white hover:bg-white/20"
              >
                {isFullScreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* ScrollArea corrigido com ref no viewport interno */}
        <ScrollArea className="flex-1 p-4" ref={viewportRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="shrink-0">
                    <AvatarFallback className="bg-primary text-white">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-white"
                      : "bg-muted"
                  }`}
                >
                  <MathRenderer content={message.content} className="text-sm whitespace-pre-wrap" />
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="relative rounded-lg overflow-hidden border-2 border-white/20"
                        >
                          <img
                            src={attachment.url}
                            alt={attachment.file_name}
                            className="max-w-full h-auto max-h-48 object-contain"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <Avatar className="shrink-0">
                    <AvatarFallback className="bg-accent text-white">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <Avatar className="shrink-0">
                  <AvatarFallback className="bg-primary text-white">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl px-4 py-3 bg-muted">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t space-y-3">
          {selectedFiles.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="relative group bg-muted rounded-lg p-2 flex items-center gap-2"
                >
                  <FileImage className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground max-w-[100px] truncate">
                    {file.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 absolute -top-1 -right-1 bg-background rounded-full"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <AttachmentButton
              onImageSelect={(files) => setSelectedFiles(prev => [...prev, ...files].slice(0, 3))}
              onFormulaInsert={(formula) => setInput(prev => prev + ` $$${formula}$$ `)}
              disabled={loading || uploading}
            />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Pergunte qualquer coisa ou envie uma imagem..."
              disabled={loading || uploading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={loading || uploading || (!input.trim() && selectedFiles.length === 0)}
              className="bg-gradient-primary"
            >
              {loading || uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Dialog de créditos esgotados */}
      <NoCreditsDialog
        open={showNoCreditsDialog}
        onOpenChange={setShowNoCreditsDialog}
        onWatchAd={() => {
          // Adicionar +2 créditos via anúncio
          addCredits(2);
          refetchCredits();
          toast({
            title: "Créditos adicionados! 🎉",
            description: "+2 créditos por assistir o anúncio",
          });
        }}
        onConvertXP={() => {
          // Navegar para conversão de XP
          toast({
            title: "Conversão de XP",
            description: "Vá ao perfil para converter XP em créditos",
          });
        }}
        onViewPremium={() => onShowPremium?.()}
        xp={userXP}
      />
    </div>
  );
};

export default TutorChat;

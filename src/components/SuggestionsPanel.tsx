import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Circle, Lightbulb, BookOpen, Dumbbell, Trophy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Suggestion {
  id: string;
  suggestion_type: "study" | "exercise" | "topic" | "achievement";
  title: string;
  description: string;
  priority: number;
  is_completed: boolean;
}

interface SuggestionsPanelProps {
  userId: string;
}

const SuggestionsPanel = ({ userId }: SuggestionsPanelProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSuggestions();
    generateInitialSuggestions();
  }, [userId]);

  const loadSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from("student_suggestions")
        .select("*")
        .eq("user_id", userId)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setSuggestions((data || []) as Suggestion[]);
    } catch (error: any) {
      console.error("Erro ao carregar sugestões:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateInitialSuggestions = async () => {
    try {
      // Verificar se já existem sugestões
      const { data: existing } = await supabase
        .from("student_suggestions")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      if (existing && existing.length > 0) return;

      // Gerar sugestões iniciais
      const initialSuggestions = [
        {
          user_id: userId,
          suggestion_type: "study",
          title: "Comece sua jornada de aprendizado",
          description: "Converse com o tutor EduKI sobre qualquer assunto que você queira aprender!",
          priority: 5,
        },
        {
          user_id: userId,
          suggestion_type: "exercise",
          title: "Pratique com exercícios",
          description: "Resolva exercícios para ganhar XP e subir seu nível KI.",
          priority: 4,
        },
        {
          user_id: userId,
          suggestion_type: "topic",
          title: "Explore novos tópicos",
          description: "Pergunte ao tutor sobre matemática, ciências, história ou qualquer outra matéria.",
          priority: 3,
        },
      ];

      await supabase.from("student_suggestions").insert(initialSuggestions);
      loadSuggestions();
    } catch (error: any) {
      console.error("Erro ao gerar sugestões iniciais:", error);
    }
  };

  const toggleSuggestion = async (id: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from("student_suggestions")
        .update({
          is_completed: !isCompleted,
          completed_at: !isCompleted ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;

      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, is_completed: !isCompleted }
            : s
        )
      );

      toast({
        title: !isCompleted ? "Parabéns! 🎉" : "Sugestão reaberta",
        description: !isCompleted
          ? "Continue assim e você vai longe!"
          : "Você pode completar novamente.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a sugestão",
        variant: "destructive",
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "study":
        return <BookOpen className="w-4 h-4" />;
      case "exercise":
        return <Dumbbell className="w-4 h-4" />;
      case "topic":
        return <Lightbulb className="w-4 h-4" />;
      case "achievement":
        return <Trophy className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "study":
        return "Estudar";
      case "exercise":
        return "Exercício";
      case "topic":
        return "Tópico";
      case "achievement":
        return "Conquista";
      default:
        return type;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return "bg-red-500/10 text-red-500 border-red-500/20";
    if (priority >= 3) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Sugestões para você</h3>
      </div>

      {suggestions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma sugestão no momento</p>
        </div>
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  suggestion.is_completed
                    ? "bg-muted/50 border-muted opacity-60"
                    : "bg-card border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 mt-0.5"
                    onClick={() =>
                      toggleSuggestion(suggestion.id, suggestion.is_completed)
                    }
                  >
                    {suggestion.is_completed ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </Button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`gap-1 ${getPriorityColor(suggestion.priority)}`}
                      >
                        {getIcon(suggestion.suggestion_type)}
                        {getTypeLabel(suggestion.suggestion_type)}
                      </Badge>
                      {suggestion.priority >= 4 && (
                        <Badge variant="outline" className="text-xs">
                          Alta prioridade
                        </Badge>
                      )}
                    </div>
                    <h4
                      className={`font-medium mb-1 ${
                        suggestion.is_completed
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {suggestion.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
};

export default SuggestionsPanel;

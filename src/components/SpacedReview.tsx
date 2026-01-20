import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Brain, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Clock 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MathRenderer from "@/components/MathRenderer";
import { useToast } from "@/components/ui/use-toast";

interface ReviewCard {
  id: string;
  question: string;
  answer: string;
  subject: string;
  difficulty: string;
  createdAt: Date;
  reviewedAt?: Date;
  correctCount: number;
  incorrectCount: number;
}

interface SpacedReviewProps {
  userId: string;
  onClose?: () => void;
}

const SpacedReview = ({ userId, onClose }: SpacedReviewProps) => {
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ reviewed: 0, correct: 0, incorrect: 0 });
  const { toast } = useToast();

  useEffect(() => {
    loadReviewCards();
  }, [userId]);

  const loadReviewCards = async () => {
    setLoading(true);
    try {
      // Get chat messages from last 48 hours that contain questions/answers
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 48);

      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select("id, content, role, created_at")
        .eq("user_id", userId)
        .gte("created_at", cutoffDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Parse messages into review cards
      const reviewCards: ReviewCard[] = [];
      
      if (messages) {
        let currentQuestion = "";
        let currentAnswer = "";

        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i];
          
          if (msg.role === "user") {
            currentQuestion = msg.content;
          } else if (msg.role === "assistant" && currentQuestion) {
            currentAnswer = msg.content;
            
            // Only add if both exist and it looks like an educational interaction
            if (
              currentQuestion.length > 10 && 
              currentAnswer.length > 20 &&
              !currentQuestion.toLowerCase().includes("olá") &&
              !currentQuestion.toLowerCase().includes("oi")
            ) {
              // Determine subject from content
              const subject = detectSubject(currentQuestion + currentAnswer);
              
              reviewCards.push({
                id: msg.id,
                question: currentQuestion,
                answer: truncateText(currentAnswer, 500),
                subject,
                difficulty: "medium",
                createdAt: new Date(msg.created_at),
                correctCount: 0,
                incorrectCount: 0,
              });
            }
            
            currentQuestion = "";
            currentAnswer = "";
          }
        }
      }

      // Limit to 10 cards for review
      setCards(reviewCards.slice(0, 10));
    } catch (error) {
      console.error("Error loading review cards:", error);
      toast({
        title: "Erro ao carregar revisão",
        description: "Não foi possível carregar as perguntas para revisão",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const detectSubject = (text: string): string => {
    const subjects: Record<string, string[]> = {
      "Matemática": ["equação", "número", "soma", "multiplicar", "dividir", "fração", "integral", "derivada", "função"],
      "Física": ["força", "velocidade", "aceleração", "energia", "onda", "luz", "elétron"],
      "Química": ["átomo", "molécula", "reação", "elemento", "composto", "ácido", "base"],
      "Biologia": ["célula", "gene", "dna", "organismo", "espécie", "evolução", "fotossíntese"],
      "História": ["guerra", "revolução", "império", "rei", "rainha", "período", "século"],
      "Geografia": ["país", "continente", "clima", "relevo", "população", "território"],
      "Português": ["verbo", "substantivo", "adjetivo", "conjugação", "gramática", "texto"],
    };

    const lowerText = text.toLowerCase();
    
    for (const [subject, keywords] of Object.entries(subjects)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return subject;
      }
    }
    
    return "Geral";
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const handleAnswer = (correct: boolean) => {
    setStats(prev => ({
      reviewed: prev.reviewed + 1,
      correct: correct ? prev.correct + 1 : prev.correct,
      incorrect: correct ? prev.incorrect : prev.incorrect + 1,
    }));

    // Move to next card
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      toast({
        title: "Revisão concluída! 🎉",
        description: `Você revisou ${stats.reviewed + 1} perguntas`,
      });
    }
  };

  const currentCard = cards[currentIndex];

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary animate-pulse" />
            <CardTitle className="text-lg">Carregando Revisão...</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-8 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (cards.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Revisão Espaçada</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="p-4 rounded-full bg-muted/50 inline-block mb-4">
            <Sparkles className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground mb-4">
            Nenhuma pergunta para revisar ainda.
          </p>
          <p className="text-sm text-muted-foreground/70">
            Continue conversando com o tutor para gerar perguntas de revisão!
          </p>
          {onClose && (
            <Button variant="outline" className="mt-4" onClick={onClose}>
              Voltar
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Revisão do Dia</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {currentIndex + 1}/{cards.length}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={loadReviewCards}
              title="Recarregar"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Progress stats */}
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {stats.reviewed} revisadas
          </span>
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="w-3 h-3" />
            {stats.correct} certas
          </span>
          <span className="flex items-center gap-1 text-red-500">
            <XCircle className="w-3 h-3" />
            {stats.incorrect} erradas
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Subject badge */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{currentCard.subject}</Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(currentCard.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id + (showAnswer ? "-answer" : "-question")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ScrollArea className="h-[200px] rounded-lg border bg-muted/30 p-4">
              {!showAnswer ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                    Pergunta:
                  </p>
                  <MathRenderer content={currentCard.question} className="text-sm" />
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                    Resposta:
                  </p>
                  <MathRenderer content={currentCard.answer} className="text-sm" />
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex gap-2">
          {!showAnswer ? (
            <Button
              className="flex-1"
              onClick={() => setShowAnswer(true)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Mostrar Resposta
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => handleAnswer(false)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Errei
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleAnswer(true)}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Acertei
              </Button>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentIndex === 0}
            onClick={() => {
              setCurrentIndex(prev => prev - 1);
              setShowAnswer(false);
            }}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            disabled={currentIndex === cards.length - 1}
            onClick={() => {
              setCurrentIndex(prev => prev + 1);
              setShowAnswer(false);
            }}
          >
            Próximo
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpacedReview;

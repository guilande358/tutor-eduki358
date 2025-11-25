import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Trash2, RotateCcw, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import MathRenderer from "@/components/MathRenderer";

interface WrongAnswer {
  id: string;
  subject: string;
  topic: string;
  question: string;
  options: string[];
  correct_answer: number;
  user_answer: number;
  explanation: string;
  difficulty: string;
  created_at: string;
}

interface WrongAnswersPanelProps {
  userId: string;
}

const WrongAnswersPanel = ({ userId }: WrongAnswersPanelProps) => {
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWrongAnswers();
  }, [userId]);

  const fetchWrongAnswers = async () => {
    const { data } = await supabase
      .from('wrong_answers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) setWrongAnswers(data);
  };

  const deleteWrongAnswer = async (id: string) => {
    await supabase
      .from('wrong_answers')
      .delete()
      .eq('id', id);

    setWrongAnswers(prev => prev.filter(wa => wa.id !== id));
    toast({
      title: "Questão removida",
      description: "Questão removida da lista de erros",
    });
  };

  const retryQuestion = (wrongAnswer: WrongAnswer) => {
    toast({
      title: "Em breve!",
      description: "Funcionalidade de refazer questões em desenvolvimento",
    });
  };

  const generateReviewExercise = () => {
    toast({
      title: "Em breve!",
      description: "Exercício de revisão em desenvolvimento",
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facil': return 'bg-secondary';
      case 'medio': return 'bg-primary';
      case 'dificil': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  if (wrongAnswers.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Meus Erros</CardTitle>
          </div>
          <CardDescription>
            Revise as questões que você errou
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum erro registrado!</h3>
            <p className="text-sm text-muted-foreground">
              Continue praticando para melhorar ainda mais
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <CardTitle>Meus Erros</CardTitle>
              </div>
              <CardDescription>
                {wrongAnswers.length} questão(ões) para revisar
              </CardDescription>
            </div>
            <Button
              onClick={generateReviewExercise}
              className="gap-2 bg-gradient-primary"
            >
              <Sparkles className="w-4 h-4" />
              Gerar Revisão
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {wrongAnswers.map((wa) => (
          <Card key={wa.id} className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{wa.subject}</Badge>
                      <Badge className={getDifficultyColor(wa.difficulty)}>
                        {wa.difficulty.charAt(0).toUpperCase() + wa.difficulty.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{wa.topic}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => retryQuestion(wa)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Refazer
                    </Button>
                    <Button
                      onClick={() => deleteWrongAnswer(wa.id)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Questão */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <MathRenderer content={wa.question} className="font-medium mb-3" />
                  <div className="space-y-2">
                    {wa.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 text-sm ${
                          index === wa.correct_answer
                            ? "border-secondary bg-secondary/10"
                            : index === wa.user_answer
                            ? "border-destructive bg-destructive/10"
                            : "border-border"
                        }`}
                      >
                        <MathRenderer content={option} />
                        {index === wa.correct_answer && (
                          <span className="ml-2 text-secondary font-medium">✓ Correto</span>
                        )}
                        {index === wa.user_answer && index !== wa.correct_answer && (
                          <span className="ml-2 text-destructive font-medium">✗ Sua resposta</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explicação */}
                <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                  <p className="text-sm font-medium mb-1">Explicação:</p>
                  <MathRenderer content={wa.explanation} className="text-sm text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WrongAnswersPanel;

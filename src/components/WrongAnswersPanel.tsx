import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Trash2, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import MathRenderer from "@/components/MathRenderer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { playCorrectSound, playWrongSound, vibrateCorrect, vibrateWrong } from "@/utils/sounds";

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
  const [retryingQuestion, setRetryingQuestion] = useState<WrongAnswer | null>(null);
  const [retrySelectedAnswer, setRetrySelectedAnswer] = useState<number | null>(null);
  const [retryShowResult, setRetryShowResult] = useState(false);
  const [generatingReview, setGeneratingReview] = useState(false);
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
    setRetryingQuestion(wrongAnswer);
    setRetrySelectedAnswer(null);
    setRetryShowResult(false);
  };

  const checkRetryAnswer = async () => {
    if (retrySelectedAnswer === null || !retryingQuestion) return;
    
    setRetryShowResult(true);
    const isCorrect = retrySelectedAnswer === retryingQuestion.correct_answer;
    
    // Buscar configurações de som e vibração
    const { data: settings } = await supabase
      .from('user_progress')
      .select('sound_enabled, vibration_enabled')
      .eq('user_id', userId)
      .single();
    
    if (isCorrect) {
      if (settings?.sound_enabled) playCorrectSound();
      if (settings?.vibration_enabled) vibrateCorrect();
      
      // Remover da lista de erros
      await deleteWrongAnswer(retryingQuestion.id);
      
      toast({
        title: "Excelente! 🎉",
        description: "Você dominou essa questão! Removida da lista de erros.",
      });
      
      setTimeout(() => {
        setRetryingQuestion(null);
      }, 2000);
    } else {
      if (settings?.sound_enabled) playWrongSound();
      if (settings?.vibration_enabled) vibrateWrong();
      
      toast({
        title: "Continue praticando! 💪",
        description: "Revise a explicação e tente novamente.",
      });
    }
  };

  const generateReviewExercise = async () => {
    if (wrongAnswers.length === 0) return;
    
    setGeneratingReview(true);
    
    try {
      // Agrupar erros por tópico
      const topicCounts = wrongAnswers.reduce((acc, wa) => {
        const key = `${wa.subject}|${wa.topic}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Ordenar por quantidade de erros (descendente)
      const sortedTopics = Object.entries(topicCounts)
        .sort(([, a], [, b]) => b - a);
      
      const [subject, topic] = sortedTopics[0][0].split('|');
      
      // Buscar nível KI do usuário
      const { data: progress } = await supabase
        .from('user_progress')
        .select('ki_level')
        .eq('user_id', userId)
        .single();
      
      // Gerar exercício focado no tópico problemático
      const { data, error } = await supabase.functions.invoke("generate-exercise", {
        body: { 
          subject, 
          topic, 
          kiLevel: progress?.ki_level || 50, 
          difficulty: 'medio',
        },
      });

      if (error) throw error;
      
      toast({
        title: "Exercício de revisão gerado! 📚",
        description: `Focado em ${topic} (${sortedTopics[0][1]} erro(s) registrado(s))`,
      });
      
      // Aqui você pode redirecionar para o ExercisePanel com o exercício gerado
      // ou abrir um modal com o exercício
      
    } catch (error) {
      console.error('Erro ao gerar revisão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o exercício de revisão",
        variant: "destructive",
      });
    } finally {
      setGeneratingReview(false);
    }
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
              disabled={generatingReview}
            >
              {generatingReview ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Revisão
                </>
              )}
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

      {/* Dialog de Refazer Questão */}
      <Dialog open={!!retryingQuestion} onOpenChange={(open) => !open && setRetryingQuestion(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Refazer Questão</DialogTitle>
            <DialogDescription>
              Tente novamente e mostre que você dominou este tópico!
            </DialogDescription>
          </DialogHeader>
          
          {retryingQuestion && (
            <div className="space-y-6 mt-4">
              {/* Badges do tópico */}
              <div className="flex items-center gap-2">
                <Badge variant="outline">{retryingQuestion.subject}</Badge>
                <Badge className={getDifficultyColor(retryingQuestion.difficulty)}>
                  {retryingQuestion.difficulty.charAt(0).toUpperCase() + retryingQuestion.difficulty.slice(1)}
                </Badge>
              </div>
              
              {/* Questão */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <MathRenderer content={retryingQuestion.question} className="font-medium mb-4" />
                
                <div className="space-y-2">
                  {retryingQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => !retryShowResult && setRetrySelectedAnswer(index)}
                      disabled={retryShowResult}
                      className={`w-full p-3 rounded-lg border-2 text-left text-sm transition-all ${
                        retryShowResult
                          ? index === retryingQuestion.correct_answer
                            ? "border-secondary bg-secondary/10"
                            : index === retrySelectedAnswer
                            ? "border-destructive bg-destructive/10"
                            : "border-border opacity-50"
                          : retrySelectedAnswer === index
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <MathRenderer content={option} />
                      {retryShowResult && index === retryingQuestion.correct_answer && (
                        <span className="ml-2 text-secondary font-medium">✓ Correto</span>
                      )}
                      {retryShowResult && index === retrySelectedAnswer && index !== retryingQuestion.correct_answer && (
                        <span className="ml-2 text-destructive font-medium">✗ Sua resposta</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botão Verificar */}
              {!retryShowResult && (
                <Button
                  onClick={checkRetryAnswer}
                  disabled={retrySelectedAnswer === null}
                  className="w-full"
                  size="lg"
                >
                  Verificar Resposta
                </Button>
              )}

              {/* Explicação (mostrar após responder) */}
              {retryShowResult && (
                <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                  <p className="text-sm font-medium mb-2">Explicação:</p>
                  <MathRenderer content={retryingQuestion.explanation} className="text-sm text-muted-foreground" />
                  
                  {retrySelectedAnswer === retryingQuestion.correct_answer && (
                    <div className="mt-4 p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
                      <p className="text-sm font-medium text-secondary text-center">
                        🎉 Parabéns! Esta questão será removida da sua lista de erros.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WrongAnswersPanel;

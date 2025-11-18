import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Trophy, X, Check, Sparkles } from "lucide-react";

interface Exercise {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface ExercisePanelProps {
  userId: string;
  kiLevel: number;
}

const ExercisePanel = ({ userId, kiLevel }: ExercisePanelProps) => {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medio");
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateExercise = async () => {
    if (!subject || !topic) {
      toast({
        title: "Preencha os campos",
        description: "Por favor, informe a matéria e o tópico",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setExercise(null);
    setSelectedAnswer(null);
    setShowResult(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-exercise", {
        body: { subject, topic, kiLevel, difficulty },
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

      setExercise(data.exercise);
    } catch (error: any) {
      toast({
        title: "Erro ao gerar exercício",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = async () => {
    if (selectedAnswer === null || !exercise) return;

    setShowResult(true);
    const isCorrect = selectedAnswer === exercise.correctAnswer;

    // Calcular XP baseado na dificuldade e resultado
    const baseXP = difficulty === "facil" ? 10 : difficulty === "medio" ? 20 : 30;
    const xpEarned = isCorrect ? baseXP : Math.floor(baseXP / 2);

    // Salvar exercício completado
    await supabase.from('completed_exercises').insert({
      user_id: userId,
      subject,
      difficulty,
      score: isCorrect ? 100 : 0,
      xp_earned: xpEarned,
    });

    // Atualizar progresso do usuário
    const { data: currentProgress } = await supabase
      .from('user_progress')
      .select('xp, ki_level')
      .eq('user_id', userId)
      .single();

    if (currentProgress) {
      const newXP = currentProgress.xp + xpEarned;
      const kiAdjustment = isCorrect ? 2 : -1;
      const newKI = Math.max(0, Math.min(100, currentProgress.ki_level + kiAdjustment));

      await supabase
        .from('user_progress')
        .update({ xp: newXP, ki_level: newKI })
        .eq('user_id', userId);
    }

    toast({
      title: isCorrect ? "Parabéns! 🎉" : "Quase lá! 💪",
      description: isCorrect
        ? `Resposta correta! +${xpEarned} XP`
        : `Continue tentando! +${xpEarned} XP pelo esforço`,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <CardTitle>Gerar Exercício</CardTitle>
          </div>
          <CardDescription>
            Pratique com exercícios adaptados ao seu nível
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Matéria</Label>
              <Input
                id="subject"
                placeholder="Ex: Matemática, História..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Tópico</Label>
              <Input
                id="topic"
                placeholder="Ex: Equações de 2º grau..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Dificuldade</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facil">Fácil</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="dificil">Difícil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={generateExercise}
            disabled={loading}
            className="w-full bg-gradient-primary"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando exercício...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Exercício
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {exercise && (
        <Card className="shadow-lg border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              <CardTitle>Exercício</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-lg font-medium">{exercise.question}</p>
            </div>

            <RadioGroup
              value={selectedAnswer?.toString()}
              onValueChange={(value) => setSelectedAnswer(parseInt(value))}
              disabled={showResult}
              className="space-y-3"
            >
              {exercise.options.map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-2 p-4 rounded-lg border-2 transition-colors ${
                    showResult
                      ? index === exercise.correctAnswer
                        ? "border-secondary bg-secondary/10"
                        : index === selectedAnswer
                        ? "border-destructive bg-destructive/10"
                        : "border-border"
                      : "border-border hover:border-primary"
                  }`}
                >
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer flex items-center justify-between"
                  >
                    <span>{option}</span>
                    {showResult && index === exercise.correctAnswer && (
                      <Check className="w-5 h-5 text-secondary" />
                    )}
                    {showResult && index === selectedAnswer && index !== exercise.correctAnswer && (
                      <X className="w-5 h-5 text-destructive" />
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {!showResult ? (
              <Button
                onClick={checkAnswer}
                disabled={selectedAnswer === null}
                className="w-full bg-gradient-primary"
              >
                Verificar Resposta
              </Button>
            ) : (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg ${
                    selectedAnswer === exercise.correctAnswer
                      ? "bg-secondary/10 border-2 border-secondary"
                      : "bg-destructive/10 border-2 border-destructive"
                  }`}
                >
                  <h4 className="font-semibold mb-2">
                    {selectedAnswer === exercise.correctAnswer
                      ? "Resposta Correta! 🎉"
                      : "Resposta Incorreta 📚"}
                  </h4>
                  <p className="text-sm">{exercise.explanation}</p>
                </div>
                <Button
                  onClick={() => {
                    setExercise(null);
                    setSelectedAnswer(null);
                    setShowResult(false);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Novo Exercício
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExercisePanel;
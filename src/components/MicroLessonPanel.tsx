import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Trophy, X, Check, Heart, BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import MathRenderer from "@/components/MathRenderer";
import { playCorrectSound, playWrongSound, vibrateCorrect, vibrateWrong } from "@/utils/sounds";

interface Exercise {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface MicroLessonPanelProps {
  userId: string;
  kiLevel: number;
  onClose: () => void;
  onComplete: () => void;
}

const MicroLessonPanel = ({ userId, kiLevel, onClose, onComplete }: MicroLessonPanelProps) => {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [started, setStarted] = useState(false);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [userSettings, setUserSettings] = useState({ sound_enabled: true, vibration_enabled: true });
  const { toast } = useToast();

  const REQUIRED_CORRECT = 10;

  useEffect(() => {
    fetchUserSettings();
  }, [userId]);

  useEffect(() => {
    if (started && correctCount < REQUIRED_CORRECT) {
      generateExercise();
    }
  }, [started, correctCount]);

  const fetchUserSettings = async () => {
    const { data } = await supabase
      .from('user_progress')
      .select('sound_enabled, vibration_enabled')
      .eq('user_id', userId)
      .single();

    if (data) setUserSettings(data);
  };

  const startMicroLesson = () => {
    if (!subject || !topic) {
      toast({
        title: "Preencha os campos",
        description: "Por favor, informe a matéria e o tópico",
        variant: "destructive",
      });
      return;
    }

    setStarted(true);
    setCorrectCount(0);
    setTotalAnswered(0);
  };

  const generateExercise = async () => {
    setLoading(true);
    setExercise(null);
    setSelectedAnswer(null);
    setShowResult(false);

    try {
      // Dificuldade aleatória
      const difficulties = ["facil", "medio", "dificil"];
      const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

      const { data, error } = await supabase.functions.invoke("generate-exercise", {
        body: { subject, topic, kiLevel, difficulty: randomDifficulty },
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

    // Sons e vibração
    if (isCorrect) {
      if (userSettings.sound_enabled) playCorrectSound();
      if (userSettings.vibration_enabled) vibrateCorrect();
    } else {
      if (userSettings.sound_enabled) playWrongSound();
      if (userSettings.vibration_enabled) vibrateWrong();
      
      // Salvar questão errada
      await supabase.from('wrong_answers').insert({
        user_id: userId,
        subject,
        topic,
        question: exercise.question,
        options: exercise.options,
        correct_answer: exercise.correctAnswer,
        user_answer: selectedAnswer,
        explanation: exercise.explanation,
        difficulty: "medio",
      });
    }

    const newTotalAnswered = totalAnswered + 1;
    const newCorrectCount = isCorrect ? correctCount + 1 : correctCount;
    
    setTotalAnswered(newTotalAnswered);
    setCorrectCount(newCorrectCount);

    if (isCorrect) {
      toast({
        title: "Correto! 🎉",
        description: `${newCorrectCount}/${REQUIRED_CORRECT} acertos`,
      });

      // Se completou 10 acertos
      if (newCorrectCount === REQUIRED_CORRECT) {
        // Dar +1 vida
        const { data: currentProgress } = await supabase
          .from('user_progress')
          .select('lives')
          .eq('user_id', userId)
          .single();

        if (currentProgress) {
          const newLives = Math.min(currentProgress.lives + 1, 5);
          await supabase
            .from('user_progress')
            .update({ lives: newLives })
            .eq('user_id', userId);

          toast({
            title: "Micro-aula concluída! 🎉",
            description: "Você ganhou +1 vida!",
          });

          onComplete();
        }
      }
    } else {
      toast({
        title: "Incorreto",
        description: `Gerando nova questão... (${newCorrectCount}/${REQUIRED_CORRECT} acertos)`,
        variant: "destructive",
      });
    }
  };

  const nextExercise = () => {
    if (correctCount < REQUIRED_CORRECT) {
      generateExercise();
    }
  };

  if (!started) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <CardTitle>Micro-aula</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            Complete 10 questões corretas para ganhar +1 vida
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-2">
              <Heart className="w-5 h-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Como funciona:</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                  <li>• Responda 10 questões corretamente</li>
                  <li>• Dificuldade aleatória em cada questão</li>
                  <li>• Questões erradas são substituídas</li>
                  <li>• Ganhe +1 vida ao completar!</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            onClick={startMicroLesson}
            className="w-full bg-gradient-primary"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Iniciar Micro-aula
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              <CardTitle>Progresso da Micro-aula</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Acertos</span>
              <span className="font-bold text-lg">
                {correctCount}/{REQUIRED_CORRECT}
              </span>
            </div>
            <Progress value={(correctCount / REQUIRED_CORRECT) * 100} className="h-3" />
          </div>
          <div className="text-xs text-muted-foreground">
            Total de questões respondidas: {totalAnswered}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="shadow-lg">
          <CardContent className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Gerando questão...</p>
          </CardContent>
        </Card>
      ) : exercise && (
        <Card className="shadow-lg border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Questão #{totalAnswered + 1}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <MathRenderer content={exercise.question} className="text-lg font-medium" />
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
                    <MathRenderer content={option} />
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
                  <MathRenderer content={exercise.explanation} className="text-sm" />
                </div>
                
                {correctCount < REQUIRED_CORRECT && (
                  <Button
                    onClick={nextExercise}
                    disabled={loading}
                    className="w-full bg-gradient-primary"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Próxima Questão
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MicroLessonPanel;

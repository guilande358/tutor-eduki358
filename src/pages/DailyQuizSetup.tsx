import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useDailyQuiz } from "@/hooks/useDailyQuiz";

const SUBJECTS = [
  "Matemática",
  "Física",
  "Química",
  "Biologia",
  "História",
  "Geografia",
  "Português",
  "Inglês",
  "Literatura",
  "Filosofia",
  "Sociologia",
];

const DIFFICULTIES = [
  { value: "easy", label: "Fácil", description: "Conceitos básicos" },
  { value: "medium", label: "Médio", description: "Nível intermediário" },
  { value: "hard", label: "Difícil", description: "Desafio avançado" },
];

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Múltipla Escolha" },
  { value: "true_false", label: "Verdadeiro ou Falso" },
  { value: "fill_blank", label: "Preencher Lacuna" },
];

const DailyQuizSetup = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [subject, setSubject] = useState("Matemática");
  const [difficulty, setDifficulty] = useState("medium");
  const [exerciseCount, setExerciseCount] = useState(5);
  const [questionTypes, setQuestionTypes] = useState<string[]>(["multiple_choice"]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const { preferences, savePreferences, loading } = useDailyQuiz(userId || "");

  // Load existing preferences
  useEffect(() => {
    if (preferences) {
      setSubject(preferences.favorite_subject);
      setDifficulty(preferences.difficulty_level);
      setExerciseCount(preferences.exercises_per_quiz);
      setQuestionTypes(preferences.question_types);
    }
  }, [preferences]);

  const handleQuestionTypeToggle = (type: string) => {
    setQuestionTypes((prev) => {
      if (prev.includes(type)) {
        // Don't allow removing all types
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await savePreferences({
      favorite_subject: subject,
      difficulty_level: difficulty,
      exercises_per_quiz: exerciseCount,
      question_types: questionTypes,
    });
    setSaving(false);
    if (success) {
      navigate("/daily-quiz");
    }
  };

  if (!userId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
      <div className="max-w-lg mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <h1 className="text-2xl font-bold mb-2">Configurar Quiz Diário</h1>
        <p className="text-muted-foreground mb-6">
          Personalize seu desafio diário de acordo com suas metas
        </p>

        <div className="space-y-6">
          {/* Subject */}
          <Card className="p-4">
            <Label className="text-base font-medium mb-3 block">
              Disciplina Favorita
            </Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma disciplina" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Difficulty */}
          <Card className="p-4">
            <Label className="text-base font-medium mb-3 block">
              Nível de Dificuldade
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    difficulty === d.value
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-sm">{d.label}</p>
                  <p className="text-xs text-muted-foreground">{d.description}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Exercise Count */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-medium">
                Número de Exercícios
              </Label>
              <span className="text-2xl font-bold text-primary">
                {exerciseCount}
              </span>
            </div>
            <Slider
              value={[exerciseCount]}
              onValueChange={(value) => setExerciseCount(value[0])}
              min={3}
              max={10}
              step={1}
              className="my-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>3 (rápido)</span>
              <span>10 (completo)</span>
            </div>
          </Card>

          {/* Question Types */}
          <Card className="p-4">
            <Label className="text-base font-medium mb-3 block">
              Tipos de Pergunta
            </Label>
            <div className="space-y-3">
              {QUESTION_TYPES.map((type) => (
                <div
                  key={type.value}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50"
                >
                  <Checkbox
                    id={type.value}
                    checked={questionTypes.includes(type.value)}
                    onCheckedChange={() => handleQuestionTypeToggle(type.value)}
                  />
                  <label
                    htmlFor={type.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            className="w-full bg-gradient-primary"
            size="lg"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar e Continuar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DailyQuizSetup;

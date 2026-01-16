import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import MathRenderer from "@/components/MathRenderer";
import { QuizQuestion as QuizQuestionType } from "@/hooks/useDailyQuiz";

interface QuizQuestionProps {
  question: QuizQuestionType;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (answer: number | boolean | string) => Promise<boolean>;
  onNext: () => void;
}

const QuizQuestion = ({
  question,
  questionIndex,
  totalQuestions,
  onAnswer,
  onNext,
}: QuizQuestionProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [fillBlankAnswer, setFillBlankAnswer] = useState("");

  const handleAnswer = async (answer: number | boolean | string) => {
    if (selectedAnswer !== null) return; // Already answered
    
    setSelectedAnswer(answer);
    const correct = await onAnswer(answer);
    setIsCorrect(correct);
    setShowExplanation(true);
  };

  const handleFillBlankSubmit = () => {
    if (fillBlankAnswer.trim()) {
      handleAnswer(fillBlankAnswer.trim().toLowerCase());
    }
  };

  const getButtonStyle = (index: number) => {
    if (selectedAnswer === null) {
      return "border-2 border-muted hover:border-primary hover:bg-primary/5";
    }
    
    if (index === question.correctAnswer) {
      return "border-2 border-green-500 bg-green-50 dark:bg-green-950";
    }
    
    if (selectedAnswer === index && !isCorrect) {
      return "border-2 border-red-500 bg-red-50 dark:bg-red-950";
    }
    
    return "border-2 border-muted opacity-50";
  };

  const getTFButtonStyle = (value: boolean) => {
    if (selectedAnswer === null) {
      return "border-2 border-muted hover:border-primary hover:bg-primary/5";
    }
    
    if (value === question.correctAnswer) {
      return "border-2 border-green-500 bg-green-50 dark:bg-green-950";
    }
    
    if (selectedAnswer === value && !isCorrect) {
      return "border-2 border-red-500 bg-red-50 dark:bg-red-950";
    }
    
    return "border-2 border-muted opacity-50";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Questão {questionIndex + 1} de {totalQuestions}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < questionIndex
                  ? "bg-primary"
                  : i === questionIndex
                  ? "bg-primary/50"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <Card className="p-6">
        <MathRenderer
          content={question.question}
          className="text-lg font-medium mb-6"
        />

        {/* Multiple Choice */}
        {question.type === "multiple_choice" && question.options && (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null}
                className={`w-full p-4 rounded-xl text-left transition-all ${getButtonStyle(
                  index
                )}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-muted font-medium text-sm">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <MathRenderer content={option} className="flex-1" />
                  {selectedAnswer !== null && index === question.correctAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {selectedAnswer === index && !isCorrect && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* True/False */}
        {question.type === "true_false" && (
          <div className="flex gap-4">
            <button
              onClick={() => handleAnswer(true)}
              disabled={selectedAnswer !== null}
              className={`flex-1 p-4 rounded-xl text-center font-medium transition-all ${getTFButtonStyle(
                true
              )}`}
            >
              <div className="flex items-center justify-center gap-2">
                Verdadeiro
                {selectedAnswer !== null && question.correctAnswer === true && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
                {selectedAnswer === true && !isCorrect && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </button>
            <button
              onClick={() => handleAnswer(false)}
              disabled={selectedAnswer !== null}
              className={`flex-1 p-4 rounded-xl text-center font-medium transition-all ${getTFButtonStyle(
                false
              )}`}
            >
              <div className="flex items-center justify-center gap-2">
                Falso
                {selectedAnswer !== null && question.correctAnswer === false && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
                {selectedAnswer === false && !isCorrect && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </button>
          </div>
        )}

        {/* Fill in the blank */}
        {question.type === "fill_blank" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={fillBlankAnswer}
                onChange={(e) => setFillBlankAnswer(e.target.value)}
                placeholder="Digite sua resposta..."
                disabled={selectedAnswer !== null}
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && handleFillBlankSubmit()}
              />
              <Button
                onClick={handleFillBlankSubmit}
                disabled={selectedAnswer !== null || !fillBlankAnswer.trim()}
              >
                Confirmar
              </Button>
            </div>
            {selectedAnswer !== null && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  isCorrect
                    ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                    : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span>
                  {isCorrect
                    ? "Correto!"
                    : `Resposta correta: ${question.correctAnswer}`}
                </span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Explanation */}
      {showExplanation && (
        <Card
          className={`p-4 ${
            isCorrect
              ? "border-green-200 bg-green-50/50 dark:bg-green-950/50"
              : "border-red-200 bg-red-50/50 dark:bg-red-950/50"
          }`}
        >
          <div className="flex items-start gap-3">
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
            )}
            <div>
              <p className="font-medium mb-1">
                {isCorrect ? "Excelente! 🎉" : "Não foi dessa vez 💪"}
              </p>
              <MathRenderer
                content={question.explanation}
                className="text-sm text-muted-foreground"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Next button */}
      {selectedAnswer !== null && (
        <Button onClick={onNext} className="w-full" size="lg">
          {questionIndex < totalQuestions - 1 ? (
            <>
              Próxima Questão
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            "Ver Resultado"
          )}
        </Button>
      )}
    </div>
  );
};

export default QuizQuestion;

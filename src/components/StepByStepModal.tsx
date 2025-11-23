import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { BookOpen, Lightbulb, CheckCircle2 } from "lucide-react";

interface StepByStepModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: string;
  correctAnswer: string;
  explanation: string;
  detailedExplanation?: string;
}

const StepByStepModal = ({
  open,
  onOpenChange,
  question,
  correctAnswer,
  explanation,
  detailedExplanation,
}: StepByStepModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Solução Passo a Passo
          </DialogTitle>
          <DialogDescription>
            Entenda como chegar à resposta correta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Questão */}
          <Card className="p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">Questão:</h3>
            <p className="text-sm">{question}</p>
          </Card>

          {/* Resposta Correta */}
          <Card className="p-4 bg-secondary/10 border-2 border-secondary">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Resposta Correta:</h3>
                <p className="text-sm">{correctAnswer}</p>
              </div>
            </div>
          </Card>

          {/* Explicação Resumida */}
          <Card className="p-4 bg-primary/5 border-2 border-primary/20">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2">Por que esta é a resposta?</h3>
                <p className="text-sm">{explanation}</p>
              </div>
            </div>
          </Card>

          {/* Explicação Detalhada */}
          {detailedExplanation && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Raciocínio Completo:</h3>
              <div className="space-y-2 text-sm">
                {detailedExplanation.split('\n').map((paragraph, index) => (
                  <p key={index} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StepByStepModal;

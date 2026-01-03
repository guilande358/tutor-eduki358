import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface CallTutorButtonProps {
  isTutorActive: boolean;
  onToggleTutor: (active: boolean) => void;
  onAskTutor: (question: string) => void;
  loading?: boolean;
}

const CallTutorButton = ({
  isTutorActive,
  onToggleTutor,
  onAskTutor,
  loading,
}: CallTutorButtonProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [question, setQuestion] = useState("");

  const handleAskTutor = () => {
    if (question.trim()) {
      onAskTutor(question);
      setQuestion("");
      setShowDialog(false);
    }
  };

  return (
    <>
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <AnimatePresence mode="wait">
          {isTutorActive ? (
            <motion.div
              key="active"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <Button
                onClick={() => setShowDialog(true)}
                size="lg"
                className="rounded-full w-16 h-16 bg-gradient-primary shadow-lg hover:shadow-xl"
              >
                <Bot className="w-8 h-8" />
              </Button>
              <Button
                onClick={() => onToggleTutor(false)}
                size="sm"
                variant="outline"
                className="rounded-full"
              >
                <X className="w-4 h-4 mr-1" />
                Dispensar
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="inactive"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Button
                onClick={() => onToggleTutor(true)}
                size="lg"
                variant="outline"
                className="rounded-full w-16 h-16 border-2 border-primary shadow-lg hover:shadow-xl hover:bg-primary/10"
              >
                <Bot className="w-8 h-8 text-primary" />
              </Button>
              <p className="text-xs text-center mt-2 text-muted-foreground">
                Chamar Tutor
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Perguntar ao Tutor
            </DialogTitle>
            <DialogDescription>
              Digite sua dúvida e o tutor responderá no chat e no quadro
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: Como resolvo essa equação? Explique passo a passo..."
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAskTutor}
                disabled={!question.trim() || loading}
              >
                {loading ? "Perguntando..." : "Perguntar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CallTutorButton;

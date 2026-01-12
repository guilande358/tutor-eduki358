import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Paperclip, ImageIcon, FileText, Calculator } from "lucide-react";
import FormulaEditor from "./FormulaEditor";

interface AttachmentButtonProps {
  onImageSelect: (files: File[]) => void;
  onPdfSelect?: (file: File) => void;
  onFormulaInsert: (formula: string) => void;
  disabled?: boolean;
}

const AttachmentButton = ({ 
  onImageSelect, 
  onPdfSelect, 
  onFormulaInsert,
  disabled = false 
}: AttachmentButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFormulaEditor, setShowFormulaEditor] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    setIsOpen(false);
    imageInputRef.current?.click();
  };

  const handlePdfClick = () => {
    setIsOpen(false);
    pdfInputRef.current?.click();
  };

  const handleFormulaClick = () => {
    setIsOpen(false);
    setShowFormulaEditor(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    if (imageFiles.length > 0) {
      onImageSelect(imageFiles);
    }
    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf" && onPdfSelect) {
      onPdfSelect(file);
    }
    // Reset input
    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              className="justify-start gap-2"
              onClick={handleImageClick}
            >
              <ImageIcon className="w-4 h-4 text-blue-500" />
              Imagem
            </Button>
            {onPdfSelect && (
              <Button
                variant="ghost"
                className="justify-start gap-2"
                onClick={handlePdfClick}
              >
                <FileText className="w-4 h-4 text-red-500" />
                PDF
              </Button>
            )}
            <Button
              variant="ghost"
              className="justify-start gap-2"
              onClick={handleFormulaClick}
            >
              <Calculator className="w-4 h-4 text-purple-500" />
              Fórmula
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageChange}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handlePdfChange}
      />

      {/* Formula Editor Dialog */}
      <FormulaEditor
        open={showFormulaEditor}
        onOpenChange={setShowFormulaEditor}
        onInsert={onFormulaInsert}
      />
    </>
  );
};

export default AttachmentButton;

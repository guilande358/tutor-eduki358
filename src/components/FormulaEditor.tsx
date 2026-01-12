import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import MathRenderer from "./MathRenderer";
import { X, Check, Delete, RotateCcw } from "lucide-react";

interface FormulaEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (formula: string) => void;
  initialValue?: string;
}

// Symbol categories
const BASIC_SYMBOLS = [
  { symbol: "+", latex: "+" },
  { symbol: "−", latex: "-" },
  { symbol: "×", latex: "\\times" },
  { symbol: "÷", latex: "\\div" },
  { symbol: "=", latex: "=" },
  { symbol: "≠", latex: "\\neq" },
  { symbol: "<", latex: "<" },
  { symbol: ">", latex: ">" },
  { symbol: "≤", latex: "\\leq" },
  { symbol: "≥", latex: "\\geq" },
  { symbol: "±", latex: "\\pm" },
  { symbol: "∓", latex: "\\mp" },
  { symbol: "·", latex: "\\cdot" },
  { symbol: "∘", latex: "\\circ" },
  { symbol: "!", latex: "!" },
  { symbol: "%", latex: "\\%" },
  { symbol: "∞", latex: "\\infty" },
  { symbol: "≈", latex: "\\approx" },
  { symbol: "∝", latex: "\\propto" },
  { symbol: "≡", latex: "\\equiv" },
];

const GREEK_LETTERS = [
  { symbol: "α", latex: "\\alpha" },
  { symbol: "β", latex: "\\beta" },
  { symbol: "γ", latex: "\\gamma" },
  { symbol: "δ", latex: "\\delta" },
  { symbol: "ε", latex: "\\epsilon" },
  { symbol: "ζ", latex: "\\zeta" },
  { symbol: "η", latex: "\\eta" },
  { symbol: "θ", latex: "\\theta" },
  { symbol: "ι", latex: "\\iota" },
  { symbol: "κ", latex: "\\kappa" },
  { symbol: "λ", latex: "\\lambda" },
  { symbol: "μ", latex: "\\mu" },
  { symbol: "ν", latex: "\\nu" },
  { symbol: "ξ", latex: "\\xi" },
  { symbol: "π", latex: "\\pi" },
  { symbol: "ρ", latex: "\\rho" },
  { symbol: "σ", latex: "\\sigma" },
  { symbol: "τ", latex: "\\tau" },
  { symbol: "υ", latex: "\\upsilon" },
  { symbol: "φ", latex: "\\phi" },
  { symbol: "χ", latex: "\\chi" },
  { symbol: "ψ", latex: "\\psi" },
  { symbol: "ω", latex: "\\omega" },
  { symbol: "Δ", latex: "\\Delta" },
  { symbol: "Γ", latex: "\\Gamma" },
  { symbol: "Θ", latex: "\\Theta" },
  { symbol: "Λ", latex: "\\Lambda" },
  { symbol: "Ξ", latex: "\\Xi" },
  { symbol: "Π", latex: "\\Pi" },
  { symbol: "Σ", latex: "\\Sigma" },
  { symbol: "Φ", latex: "\\Phi" },
  { symbol: "Ψ", latex: "\\Psi" },
  { symbol: "Ω", latex: "\\Omega" },
];

const OPERATORS = [
  { symbol: "√", latex: "\\sqrt{}" },
  { symbol: "∛", latex: "\\sqrt[3]{}" },
  { symbol: "ⁿ√", latex: "\\sqrt[n]{}" },
  { symbol: "∑", latex: "\\sum_{i=1}^{n}" },
  { symbol: "∏", latex: "\\prod_{i=1}^{n}" },
  { symbol: "∫", latex: "\\int" },
  { symbol: "∬", latex: "\\iint" },
  { symbol: "∮", latex: "\\oint" },
  { symbol: "∂", latex: "\\partial" },
  { symbol: "∇", latex: "\\nabla" },
  { symbol: "lim", latex: "\\lim_{x \\to \\infty}" },
  { symbol: "→", latex: "\\to" },
  { symbol: "←", latex: "\\leftarrow" },
  { symbol: "↔", latex: "\\leftrightarrow" },
  { symbol: "⇒", latex: "\\Rightarrow" },
  { symbol: "⇐", latex: "\\Leftarrow" },
  { symbol: "⇔", latex: "\\Leftrightarrow" },
  { symbol: "∀", latex: "\\forall" },
  { symbol: "∃", latex: "\\exists" },
  { symbol: "∈", latex: "\\in" },
  { symbol: "∉", latex: "\\notin" },
  { symbol: "⊂", latex: "\\subset" },
  { symbol: "⊃", latex: "\\supset" },
  { symbol: "⊆", latex: "\\subseteq" },
  { symbol: "⊇", latex: "\\supseteq" },
  { symbol: "∪", latex: "\\cup" },
  { symbol: "∩", latex: "\\cap" },
  { symbol: "∅", latex: "\\emptyset" },
  { symbol: "ℕ", latex: "\\mathbb{N}" },
  { symbol: "ℤ", latex: "\\mathbb{Z}" },
  { symbol: "ℚ", latex: "\\mathbb{Q}" },
  { symbol: "ℝ", latex: "\\mathbb{R}" },
  { symbol: "ℂ", latex: "\\mathbb{C}" },
];

const FUNCTIONS = [
  { symbol: "sin", latex: "\\sin" },
  { symbol: "cos", latex: "\\cos" },
  { symbol: "tan", latex: "\\tan" },
  { symbol: "cot", latex: "\\cot" },
  { symbol: "sec", latex: "\\sec" },
  { symbol: "csc", latex: "\\csc" },
  { symbol: "arcsin", latex: "\\arcsin" },
  { symbol: "arccos", latex: "\\arccos" },
  { symbol: "arctan", latex: "\\arctan" },
  { symbol: "sinh", latex: "\\sinh" },
  { symbol: "cosh", latex: "\\cosh" },
  { symbol: "tanh", latex: "\\tanh" },
  { symbol: "log", latex: "\\log" },
  { symbol: "ln", latex: "\\ln" },
  { symbol: "log₁₀", latex: "\\log_{10}" },
  { symbol: "exp", latex: "\\exp" },
  { symbol: "mod", latex: "\\mod" },
  { symbol: "gcd", latex: "\\gcd" },
  { symbol: "lcm", latex: "\\text{lcm}" },
  { symbol: "max", latex: "\\max" },
  { symbol: "min", latex: "\\min" },
  { symbol: "det", latex: "\\det" },
  { symbol: "dim", latex: "\\dim" },
  { symbol: "ker", latex: "\\ker" },
];

const TEMPLATES = [
  { label: "x²", latex: "x^{2}" },
  { label: "x³", latex: "x^{3}" },
  { label: "xⁿ", latex: "x^{n}" },
  { label: "aₙ", latex: "a_{n}" },
  { label: "√x", latex: "\\sqrt{x}" },
  { label: "∛x", latex: "\\sqrt[3]{x}" },
  { label: "a/b", latex: "\\frac{a}{b}" },
  { label: "∑", latex: "\\sum_{i=1}^{n} x_i" },
  { label: "∫", latex: "\\int_{a}^{b} f(x) dx" },
  { label: "lim", latex: "\\lim_{x \\to 0} f(x)" },
  { label: "(a,b)", latex: "\\binom{n}{k}" },
  { label: "matriz", latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}" },
];

const NUMPAD_KEYS = [
  ["7", "8", "9", "/", "^"],
  ["4", "5", "6", "*", "_"],
  ["1", "2", "3", "-", "("],
  ["0", ".", ",", "+", ")"],
];

const FormulaEditor = ({ open, onOpenChange, onInsert, initialValue = "" }: FormulaEditorProps) => {
  const [formula, setFormula] = useState(initialValue);
  const [activeTab, setActiveTab] = useState("basico");

  useEffect(() => {
    if (open) {
      setFormula(initialValue);
    }
  }, [open, initialValue]);

  const insertAtCursor = (text: string) => {
    setFormula(prev => prev + text);
  };

  const handleNumpadKey = (key: string) => {
    if (key === "^") {
      insertAtCursor("^{}");
    } else if (key === "_") {
      insertAtCursor("_{}");
    } else {
      insertAtCursor(key);
    }
  };

  const handleBackspace = () => {
    setFormula(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setFormula("");
  };

  const handleInsert = () => {
    if (formula.trim()) {
      onInsert(formula);
      setFormula("");
      onOpenChange(false);
    }
  };

  const renderSymbolGrid = (symbols: { symbol: string; latex: string }[]) => (
    <div className="grid grid-cols-5 sm:grid-cols-8 gap-1">
      {symbols.map((item, idx) => (
        <Button
          key={idx}
          variant="outline"
          size="sm"
          className="h-10 text-lg font-mono hover:bg-primary hover:text-primary-foreground"
          onClick={() => insertAtCursor(item.latex)}
        >
          {item.symbol}
        </Button>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📐 Editor de Fórmulas
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Symbol Categories */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="basico" className="text-xs sm:text-sm">Básico</TabsTrigger>
              <TabsTrigger value="gregos" className="text-xs sm:text-sm">Gregos</TabsTrigger>
              <TabsTrigger value="operadores" className="text-xs sm:text-sm">Operadores</TabsTrigger>
              <TabsTrigger value="funcoes" className="text-xs sm:text-sm">Funções</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-32 mt-2">
              <TabsContent value="basico" className="mt-0">
                {renderSymbolGrid(BASIC_SYMBOLS)}
              </TabsContent>
              <TabsContent value="gregos" className="mt-0">
                {renderSymbolGrid(GREEK_LETTERS)}
              </TabsContent>
              <TabsContent value="operadores" className="mt-0">
                {renderSymbolGrid(OPERATORS)}
              </TabsContent>
              <TabsContent value="funcoes" className="mt-0">
                {renderSymbolGrid(FUNCTIONS)}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          {/* Templates */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Templates comuns:</p>
            <div className="flex flex-wrap gap-1">
              {TEMPLATES.map((t, idx) => (
                <Button
                  key={idx}
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={() => insertAtCursor(t.latex)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Numpad */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-muted-foreground">Teclado numérico:</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={handleBackspace}>
                  <Delete className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-1">
              {NUMPAD_KEYS.map((row, rowIdx) => (
                <div key={rowIdx} className="grid grid-cols-5 gap-1">
                  {row.map((key) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      className="h-10 text-lg font-mono"
                      onClick={() => handleNumpadKey(key)}
                    >
                      {key}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Input */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Fórmula (LaTeX):</p>
            <Input
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="Digite ou use os botões acima..."
              className="font-mono"
            />
          </div>

          {/* Preview */}
          <div className="bg-muted/30 p-4 rounded-lg border min-h-[60px] flex items-center justify-center">
            {formula ? (
              <MathRenderer content={`$$${formula}$$`} className="text-lg" />
            ) : (
              <p className="text-muted-foreground text-sm">Preview da fórmula</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleInsert} disabled={!formula.trim()}>
              <Check className="w-4 h-4 mr-2" />
              Inserir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormulaEditor;

import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathRendererProps {
  content: string;
  className?: string;
}

const MathRenderer = ({ content, className = "" }: MathRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Padrões matemáticos comuns para detectar automaticamente
      const mathPatterns = [
        // Fórmulas entre $$ ... $$ (display mode)
        { regex: /\$\$(.*?)\$\$/gs, displayMode: true },
        // Fórmulas entre \( ... \) (inline mode)
        { regex: /\\\((.*?)\\\)/gs, displayMode: false },
        // Detectar padrões matemáticos comuns e envolvê-los automaticamente
        { regex: /\b(\d+[\^_]\{[^}]+\}|\d+[\^_]\([^)]+\)|\d+[\^_]\w+)/g, displayMode: false },
        // Equações com =
        { regex: /([a-zA-Z0-9\s\+\-\*\/\^\(\)]+\s*=\s*[a-zA-Z0-9\s\+\-\*\/\^\(\)]+)/g, displayMode: false },
        // Frações com /
        { regex: /\(([^)]+)\)\/\(([^)]+)\)/g, displayMode: false },
        // Raízes quadradas e cúbicas
        { regex: /(√|∛)\(([^)]+)\)/g, displayMode: false },
      ];

      let processedContent = content;

      // Processar padrões matemáticos
      processedContent = processedContent.replace(/\^(\w+|\([^)]+\))/g, "^{$1}");
      processedContent = processedContent.replace(/_(\w+|\([^)]+\))/g, "_{$1}");
      processedContent = processedContent.replace(/√\(([^)]+)\)/g, "\\sqrt{$1}");
      processedContent = processedContent.replace(/∛\(([^)]+)\)/g, "\\sqrt[3]{$1}");
      processedContent = processedContent.replace(/\(([^)]+)\)\/\(([^)]+)\)/g, "\\frac{$1}{$2}");
      processedContent = processedContent.replace(/²/g, "^2");
      processedContent = processedContent.replace(/³/g, "^3");
      processedContent = processedContent.replace(/π/g, "\\pi");
      processedContent = processedContent.replace(/∞/g, "\\infty");
      processedContent = processedContent.replace(/α/g, "\\alpha");
      processedContent = processedContent.replace(/β/g, "\\beta");
      processedContent = processedContent.replace(/Δ/g, "\\Delta");
      processedContent = processedContent.replace(/∑/g, "\\sum");
      processedContent = processedContent.replace(/∫/g, "\\int");

      const container = containerRef.current;
      container.innerHTML = "";

      // Dividir conteúdo em partes matemáticas e texto normal
      const parts: { content: string; isMath: boolean; displayMode: boolean }[] = [];
      let lastIndex = 0;

      // Procurar por fórmulas explícitas ($$ ou \()
      const explicitMathRegex = /(\$\$.*?\$\$|\\\(.*?\\\))/gs;
      let match;

      while ((match = explicitMathRegex.exec(processedContent)) !== null) {
        // Adicionar texto antes da fórmula
        if (match.index > lastIndex) {
          parts.push({
            content: processedContent.slice(lastIndex, match.index),
            isMath: false,
            displayMode: false,
          });
        }

        // Adicionar fórmula
        const formula = match[0];
        const isDisplay = formula.startsWith("$$");
        const mathContent = isDisplay
          ? formula.slice(2, -2)
          : formula.slice(2, -2);

        parts.push({
          content: mathContent,
          isMath: true,
          displayMode: isDisplay,
        });

        lastIndex = match.index + formula.length;
      }

      // Adicionar texto restante
      if (lastIndex < processedContent.length) {
        parts.push({
          content: processedContent.slice(lastIndex),
          isMath: false,
          displayMode: false,
        });
      }

      // Se não encontrou fórmulas explícitas, tratar tudo como possível matemática
      if (parts.length === 0) {
        parts.push({
          content: processedContent,
          isMath: false,
          displayMode: false,
        });
      }

      // Renderizar cada parte
      parts.forEach((part) => {
        if (part.isMath) {
          if (part.displayMode) {
            // Criar card estilo Notion para display mode
            const card = document.createElement("div");
            card.className = "notion-math-card";
            
            const mathContainer = document.createElement("div");
            try {
              katex.render(part.content, mathContainer, {
                displayMode: true,
                throwOnError: false,
                strict: false,
                trust: true,
              });
            } catch (error) {
              mathContainer.textContent = part.content;
            }
            card.appendChild(mathContainer);
            container.appendChild(card);
          } else {
            // Inline mode sem card
            const span = document.createElement("span");
            try {
              katex.render(part.content, span, {
                displayMode: false,
                throwOnError: false,
                strict: false,
                trust: true,
              });
            } catch (error) {
              span.textContent = part.content;
            }
            container.appendChild(span);
          }
        } else {
          // Tentar detectar matemática em texto normal
          const textParts = part.content.split(/([a-zA-Z0-9\s\+\-\*\/\^\(\)_{}=√∛∑∫∞παβΔ²³]+)/g);
          
          textParts.forEach((textPart) => {
            // Verificar se contém símbolos matemáticos
            const hasMathSymbols = /[\^_{}=√∛∑∫∞παβΔ²³]/.test(textPart);
            
            if (hasMathSymbols && textPart.trim()) {
              const span = document.createElement("span");
              try {
                katex.render(textPart.trim(), span, {
                  displayMode: false,
                  throwOnError: false,
                  strict: false,
                  trust: true,
                });
                container.appendChild(span);
              } catch (error) {
                container.appendChild(document.createTextNode(textPart));
              }
            } else {
              container.appendChild(document.createTextNode(textPart));
            }
          });
        }
      });
    } catch (error) {
      console.error("Erro ao renderizar matemática:", error);
      if (containerRef.current) {
        containerRef.current.textContent = content;
      }
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={`math-renderer ${className}`}
      style={{
        fontSize: "1.1em",
        lineHeight: "1.6",
      }}
    />
  );
};

export default MathRenderer;

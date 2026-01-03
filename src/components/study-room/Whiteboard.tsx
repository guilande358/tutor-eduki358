import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Pencil, Eraser, Type, Undo, Redo, Trash2, 
  Circle, Square, Minus, Download 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WhiteboardProps {
  roomId: string;
  onSave?: (data: string) => void;
  initialData?: string;
}

type Tool = "pencil" | "eraser" | "text" | "line" | "rectangle" | "circle";

interface Point {
  x: number;
  y: number;
}

interface DrawAction {
  type: Tool;
  points: Point[];
  color: string;
  width: number;
  text?: string;
}

const COLORS = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"
];

const Whiteboard = ({ roomId, onSave, initialData }: WhiteboardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#000000");
  const [brushWidth, setBrushWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [redoStack, setRedoStack] = useState<DrawAction[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }, []);

  // Resize canvas to fit container
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redraw();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Redraw all actions
  const redraw = useCallback(() => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    actions.forEach((action) => {
      drawAction(ctx, action);
    });
  }, [actions, getContext]);

  useEffect(() => {
    redraw();
  }, [actions, redraw]);

  const drawAction = (ctx: CanvasRenderingContext2D, action: DrawAction) => {
    ctx.strokeStyle = action.type === "eraser" ? "#ffffff" : action.color;
    ctx.fillStyle = action.color;
    ctx.lineWidth = action.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (action.type === "pencil" || action.type === "eraser") {
      if (action.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(action.points[0].x, action.points[0].y);
      for (let i = 1; i < action.points.length; i++) {
        ctx.lineTo(action.points[i].x, action.points[i].y);
      }
      ctx.stroke();
    } else if (action.type === "line" && action.points.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(action.points[0].x, action.points[0].y);
      ctx.lineTo(action.points[action.points.length - 1].x, action.points[action.points.length - 1].y);
      ctx.stroke();
    } else if (action.type === "rectangle" && action.points.length >= 2) {
      const start = action.points[0];
      const end = action.points[action.points.length - 1];
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (action.type === "circle" && action.points.length >= 2) {
      const start = action.points[0];
      const end = action.points[action.points.length - 1];
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (action.type === "text" && action.text) {
      ctx.font = `${action.width * 5}px sans-serif`;
      ctx.fillText(action.text, action.points[0].x, action.points[0].y);
    }
  };

  const getMousePos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getMousePos(e);
    setIsDrawing(true);
    setCurrentPoints([pos]);

    if (tool === "text") {
      const text = prompt("Digite o texto:");
      if (text) {
        const newAction: DrawAction = {
          type: "text",
          points: [pos],
          color,
          width: brushWidth,
          text,
        };
        setActions((prev) => [...prev, newAction]);
        setRedoStack([]);
      }
      setIsDrawing(false);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getMousePos(e);
    setCurrentPoints((prev) => [...prev, pos]);

    // Draw preview
    const ctx = getContext();
    if (!ctx) return;

    redraw();
    const previewAction: DrawAction = {
      type: tool,
      points: [...currentPoints, pos],
      color,
      width: brushWidth,
    };
    drawAction(ctx, previewAction);
  };

  const handleEnd = () => {
    if (!isDrawing || currentPoints.length === 0) return;
    setIsDrawing(false);

    const newAction: DrawAction = {
      type: tool,
      points: currentPoints,
      color,
      width: brushWidth,
    };
    setActions((prev) => [...prev, newAction]);
    setRedoStack([]);
    setCurrentPoints([]);
  };

  const undo = () => {
    if (actions.length === 0) return;
    const lastAction = actions[actions.length - 1];
    setActions((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [lastAction, ...prev]);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextAction = redoStack[0];
    setRedoStack((prev) => prev.slice(1));
    setActions((prev) => [...prev, nextAction]);
  };

  const clear = () => {
    setActions([]);
    setRedoStack([]);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL("image/png");
    
    // Download
    const link = document.createElement("a");
    link.download = `quadro-${roomId}.png`;
    link.href = data;
    link.click();

    onSave?.(data);
  };

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: "pencil", icon: <Pencil className="w-4 h-4" />, label: "Lápis" },
    { id: "eraser", icon: <Eraser className="w-4 h-4" />, label: "Borracha" },
    { id: "line", icon: <Minus className="w-4 h-4" />, label: "Linha" },
    { id: "rectangle", icon: <Square className="w-4 h-4" />, label: "Retângulo" },
    { id: "circle", icon: <Circle className="w-4 h-4" />, label: "Círculo" },
    { id: "text", icon: <Type className="w-4 h-4" />, label: "Texto" },
  ];

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b flex-wrap">
        {/* Tools */}
        <div className="flex gap-1">
          {tools.map((t) => (
            <Button
              key={t.id}
              variant={tool === t.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setTool(t.id)}
              title={t.label}
            >
              {t.icon}
            </Button>
          ))}
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Colors */}
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-transform",
                color === c ? "scale-110 border-primary" : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Brush size */}
        <div className="flex items-center gap-2 min-w-[100px]">
          <Slider
            value={[brushWidth]}
            onValueChange={([v]) => setBrushWidth(v)}
            min={1}
            max={20}
            step={1}
          />
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Actions */}
        <div className="flex gap-1 ml-auto">
          <Button variant="ghost" size="sm" onClick={undo} disabled={actions.length === 0}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={redoStack.length === 0}>
            <Redo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={clear}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={save}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 bg-white cursor-crosshair touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="w-full h-full"
        />
      </div>
    </Card>
  );
};

export default Whiteboard;

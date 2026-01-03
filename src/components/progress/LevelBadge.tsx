import { useLevelSystem, getLevelTitle, getLevelColor } from "@/hooks/useLevelSystem";
import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface LevelBadgeProps {
  xp: number;
  showProgress?: boolean;
  size?: "sm" | "md" | "lg";
}

const LevelBadge = ({ xp, showProgress = true, size = "md" }: LevelBadgeProps) => {
  const levelInfo = useLevelSystem(xp);
  const title = getLevelTitle(levelInfo.level);
  const colorClass = getLevelColor(levelInfo.level);

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "w-16 h-16 text-2xl",
  };

  return (
    <div className="flex items-center gap-3">
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center font-bold text-white shadow-lg`}
      >
        {levelInfo.level}
      </motion.div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{title}</span>
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        </div>
        
        {showProgress && !levelInfo.isMaxLevel && (
          <div className="space-y-1">
            <Progress value={levelInfo.progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {levelInfo.xpNeeded} XP para nível {levelInfo.level + 1}
            </p>
          </div>
        )}
        
        {levelInfo.isMaxLevel && (
          <p className="text-xs text-yellow-500 font-medium">Nível Máximo! 🏆</p>
        )}
      </div>
    </div>
  );
};

export default LevelBadge;

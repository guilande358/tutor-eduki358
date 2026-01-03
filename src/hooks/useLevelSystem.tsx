import { useMemo } from "react";

// Configuração de níveis - XP necessário para cada nível
const LEVEL_CONFIG = {
  maxLevel: 50,
  baseXp: 100, // XP para nível 2
  multiplier: 1.2, // Aumenta 20% por nível
};

export interface LevelInfo {
  level: number;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  xpNeeded: number;
  isMaxLevel: boolean;
}

const calculateXpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return Math.floor(LEVEL_CONFIG.baseXp * Math.pow(LEVEL_CONFIG.multiplier, level - 2));
};

const calculateTotalXpForLevel = (level: number): number => {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += calculateXpForLevel(i);
  }
  return total;
};

const getLevelFromXp = (totalXp: number): number => {
  let level = 1;
  let xpNeeded = 0;
  
  while (level < LEVEL_CONFIG.maxLevel) {
    xpNeeded = calculateTotalXpForLevel(level + 1);
    if (totalXp < xpNeeded) break;
    level++;
  }
  
  return Math.min(level, LEVEL_CONFIG.maxLevel);
};

export const useLevelSystem = (xp: number): LevelInfo => {
  return useMemo(() => {
    const level = getLevelFromXp(xp);
    const isMaxLevel = level >= LEVEL_CONFIG.maxLevel;
    
    const xpForCurrentLevel = calculateTotalXpForLevel(level);
    const xpForNextLevel = isMaxLevel ? xpForCurrentLevel : calculateTotalXpForLevel(level + 1);
    
    const xpInCurrentLevel = xp - xpForCurrentLevel;
    const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
    
    const progressPercent = isMaxLevel 
      ? 100 
      : Math.min(100, Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100));
    
    return {
      level,
      currentXp: xp,
      xpForCurrentLevel,
      xpForNextLevel,
      progressPercent,
      xpNeeded: isMaxLevel ? 0 : xpForNextLevel - xp,
      isMaxLevel,
    };
  }, [xp]);
};

export const getLevelTitle = (level: number): string => {
  if (level <= 5) return "Iniciante";
  if (level <= 10) return "Aprendiz";
  if (level <= 15) return "Estudante";
  if (level <= 20) return "Praticante";
  if (level <= 25) return "Conhecedor";
  if (level <= 30) return "Especialista";
  if (level <= 35) return "Veterano";
  if (level <= 40) return "Mestre";
  if (level <= 45) return "Grão-Mestre";
  return "Lenda";
};

export const getLevelColor = (level: number): string => {
  if (level <= 5) return "from-gray-400 to-gray-500";
  if (level <= 10) return "from-green-400 to-green-500";
  if (level <= 15) return "from-blue-400 to-blue-500";
  if (level <= 20) return "from-purple-400 to-purple-500";
  if (level <= 25) return "from-yellow-400 to-yellow-500";
  if (level <= 30) return "from-orange-400 to-orange-500";
  if (level <= 35) return "from-red-400 to-red-500";
  if (level <= 40) return "from-pink-400 to-pink-500";
  if (level <= 45) return "from-indigo-400 to-indigo-500";
  return "from-yellow-300 to-amber-500";
};

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Globe, BookOpen, Target, Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

interface LearningProfileProps {
  userId: string;
}

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

const COUNTRIES = [
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "AO", name: "Angola", flag: "🇦🇴" },
  { code: "MZ", name: "Moçambique", flag: "🇲🇿" },
  { code: "CV", name: "Cabo Verde", flag: "🇨🇻" },
  { code: "GW", name: "Guiné-Bissau", flag: "🇬🇼" },
  { code: "ST", name: "São Tomé e Príncipe", flag: "🇸🇹" },
  { code: "TL", name: "Timor-Leste", flag: "🇹🇱" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
  { code: "ES", name: "Espanha", flag: "🇪🇸" },
];

const LearningProfile = ({ userId }: LearningProfileProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    country_region: "BR",
    preferred_subjects: [] as string[],
    study_goals: "",
    ki_level: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      // Load profile name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();

      // Load progress data
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("country_region, preferred_subjects, study_goals, ki_level")
        .eq("user_id", userId)
        .maybeSingle();

      setProfile({
        full_name: profileData?.full_name || "",
        country_region: progressData?.country_region || "BR",
        preferred_subjects: progressData?.preferred_subjects || [],
        study_goals: progressData?.study_goals || "",
        ki_level: progressData?.ki_level || 0,
      });
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      // Update profile name
      await supabase
        .from("profiles")
        .update({ full_name: profile.full_name })
        .eq("id", userId);

      // Update progress data
      await supabase
        .from("user_progress")
        .update({
          country_region: profile.country_region,
          preferred_subjects: profile.preferred_subjects,
          study_goals: profile.study_goals,
        })
        .eq("user_id", userId);

      toast({
        title: "Perfil salvo! ✅",
        description: "Suas preferências foram atualizadas",
      });
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o perfil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleSubject = (subject: string) => {
    setProfile((prev) => ({
      ...prev,
      preferred_subjects: prev.preferred_subjects.includes(subject)
        ? prev.preferred_subjects.filter((s) => s !== subject)
        : [...prev.preferred_subjects, subject],
    }));
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const selectedCountry = COUNTRIES.find((c) => c.code === profile.country_region);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <Card className="p-6 bg-gradient-primary text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Perfil de Aprendizado</h2>
            <p className="text-white/80">
              Configure suas preferências para uma experiência personalizada
            </p>
          </div>
        </div>
      </Card>

      {/* Form */}
      <Card className="p-6 space-y-6">
        {/* Nome */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Nome
          </Label>
          <Input
            value={profile.full_name}
            onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
            placeholder="Seu nome"
          />
        </div>

        {/* País/Região */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            País/Região
          </Label>
          <Select
            value={profile.country_region}
            onValueChange={(v) => setProfile((p) => ({ ...p, country_region: v }))}
          >
            <SelectTrigger>
              <SelectValue>
                {selectedCountry && (
                  <span className="flex items-center gap-2">
                    {selectedCountry.flag} {selectedCountry.name}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <span className="flex items-center gap-2">
                    {country.flag} {country.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Usado para adaptar notações matemáticas e conteúdo regional
          </p>
        </div>

        {/* Matérias Preferidas */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Matérias Preferidas
          </Label>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((subject) => {
              const isSelected = profile.preferred_subjects.includes(subject);
              return (
                <Badge
                  key={subject}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => toggleSubject(subject)}
                >
                  {subject}
                </Badge>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Clique para selecionar suas matérias favoritas
          </p>
        </div>

        {/* Metas de Estudo */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Metas de Estudo
          </Label>
          <Textarea
            value={profile.study_goals}
            onChange={(e) => setProfile((p) => ({ ...p, study_goals: e.target.value }))}
            placeholder="Ex: Passar no vestibular, melhorar em matemática, aprender física para o ENEM..."
            rows={3}
          />
        </div>

        {/* Nível KI */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Nível de Conhecimento (KI)</h4>
              <p className="text-sm text-muted-foreground">
                Calculado automaticamente com base no seu desempenho
              </p>
            </div>
            <div className="text-3xl font-bold text-primary">{profile.ki_level}</div>
          </div>
        </div>

        {/* Botão Salvar */}
        <Button onClick={saveProfile} disabled={saving} className="w-full gap-2">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar Perfil
            </>
          )}
        </Button>
      </Card>
    </motion.div>
  );
};

export default LearningProfile;

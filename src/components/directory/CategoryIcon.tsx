import { Activity, Apple, Brain, Briefcase, Camera, Dumbbell, PenTool, Scale, Scissors, Smile, Sparkles, Target, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  dumbbell: Dumbbell, brain: Brain, apple: Apple, activity: Activity, smile: Smile, scissors: Scissors,
  sparkles: Sparkles, "pen-tool": PenTool, camera: Camera, scale: Scale, target: Target,
};

export function CategoryIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = (name && ICONS[name]) || Briefcase;
  return <Icon className={className} aria-hidden />;
}

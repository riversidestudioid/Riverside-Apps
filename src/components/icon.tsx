import {
  Grid2X2,
  Church,
  GraduationCap,
  BriefcaseBusiness,
  Layers,
  Image,
  CodeXml,
  Settings,
  Presentation,
  Award,
  Zap,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
const icons = {
  grid: Grid2X2,
  church: Church,
  education: GraduationCap,
  business: BriefcaseBusiness,
  layers: Layers,
  image: Image,
  code: CodeXml,
  settings: Settings,
  presentation: Presentation,
  award: Award,
  zap: Zap,
  shield: ShieldCheck,
  sliders: SlidersHorizontal,
};
export function Icon({ name, size = 28 }: { name: string; size?: number }) {
  const Component = icons[name as keyof typeof icons] ?? Grid2X2;
  return <Component size={size} strokeWidth={1.9} aria-hidden="true" />;
}

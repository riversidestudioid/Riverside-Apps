export const categories = [
  { slug: "semua", name: "Semua", icon: "grid" },
  { slug: "church-tools", name: "Church Tools", icon: "church" },
  { slug: "pendidikan", name: "Pendidikan", icon: "education" },
  { slug: "bisnis", name: "Bisnis", icon: "business" },
  { slug: "produktivitas", name: "Produktivitas", icon: "layers" },
  { slug: "utilitas", name: "Utilitas", icon: "image" },
  { slug: "developer", name: "Developer", icon: "code" },
  { slug: "custom-app", name: "Custom App", icon: "settings" },
] as const;
export type AppProduct = {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  icon: string;
  status: "draft" | "published";
  isVisible: boolean;
};
// Design fixtures only. Never a public product data source.
export const draftApps: AppProduct[] = [
  {
    slug: "sagi-worship",
    name: "Sagi Worship",
    category: "church-tools",
    tagline: "Worship Presentation Software",
    description:
      "Aplikasi presentasi lirik, ayat, dan media untuk ibadah gereja.",
    icon: "presentation",
    status: "draft",
    isVisible: false,
  },
  {
    slug: "rscertio",
    name: "RSCertio",
    category: "pendidikan",
    tagline: "Certificate Generator",
    description:
      "Buat dan kelola sertifikat dengan mudah, cepat, dan profesional.",
    icon: "award",
    status: "draft",
    isVisible: false,
  },
  {
    slug: "resizefoto",
    name: "ResizeFoto",
    category: "utilitas",
    tagline: "Image Utility",
    description: "Ubah ukuran, kompres, dan optimalkan foto secara praktis.",
    icon: "image",
    status: "draft",
    isVisible: false,
  },
];
export function publicApps(apps: AppProduct[]) {
  return apps.filter((app) => app.status === "published" && app.isVisible);
}

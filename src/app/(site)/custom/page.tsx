import { ClipboardList, MessagesSquare, Rocket } from "lucide-react";
import { CustomRequestForm } from "@/components/custom-request-form";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata = {
  title: "Pesan Aplikasi Custom",
  description:
    "Ajukan pembuatan website, web app, aplikasi mobile, atau desktop sesuai kebutuhan organisasi Anda.",
};

const steps = [
  {
    icon: ClipboardList,
    title: "Kirim kebutuhan",
    text: "Isi formulir singkat tentang aplikasi yang Anda butuhkan.",
  },
  {
    icon: MessagesSquare,
    title: "Diskusi",
    text: "Kami menghubungi Anda untuk memahami detail dan prioritas.",
  },
  {
    icon: Rocket,
    title: "Pengembangan",
    text: "Setelah disepakati, aplikasi dibangun dan diserahkan bertahap.",
  },
];

export default function CustomPage() {
  return (
    <main id="main" className="page container">
      <div className="custom-layout">
        <header className="page-head custom-intro">
          <h1>Pesan Aplikasi Custom</h1>
          <p>
            Ceritakan aplikasi yang Anda butuhkan untuk gereja, sekolah,
            bisnis, atau organisasi. Tim Riverside Studio akan meninjau
            permintaan Anda lalu menghubungi Anda.
          </p>
          <ol className="steps">
            {steps.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="step-icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </header>
        <CustomRequestForm configured={hasSupabaseEnv()} />
      </div>
    </main>
  );
}

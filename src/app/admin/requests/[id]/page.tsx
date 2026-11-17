import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle } from "lucide-react";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { appTypeLabels } from "@/lib/custom/validation";
import { formatDateTime } from "@/lib/format";
import { RequestManager } from "@/components/admin/request-manager";

export default async function RequestDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin(`/admin/requests/${id}`);
  if (!z.uuid().safeParse(id).success) notFound();
  const { data: request, error } = await supabase
    .from("custom_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Permintaan belum dapat dimuat.");
  if (!request) notFound();
  return (
    <>
      <div className="admin-toolbar">
        <Link className="back-link" href="/admin/requests">
          <ArrowLeft size={17} aria-hidden="true" /> Kembali ke Permintaan
        </Link>
      </div>
      <div className="editor-layout">
        <div className="editor-main">
          <section className="panel" aria-labelledby="request-title">
            <span className="chip">{appTypeLabels[request.app_type]}</span>
            <h2 id="request-title" className="request-title">
              {request.project_name}
            </h2>
            <p className="help-text">Masuk {formatDateTime(request.created_at)}</p>
            <h3 className="panel-subtitle">Deskripsi kebutuhan</h3>
            <p className="prose">{request.description}</p>
          </section>
        </div>
        <aside className="editor-side">
          <section className="panel" aria-labelledby="contact-title">
            <h2 id="contact-title" className="panel-title">
              Kontak Pengirim
            </h2>
            <dl className="info-list">
              <div>
                <dt>Nama</dt>
                <dd>{request.name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${request.email}`} className="text-link">
                    <Mail size={15} aria-hidden="true" /> {request.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt>WhatsApp</dt>
                <dd>
                  <a
                    href={`https://wa.me/${request.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link"
                  >
                    <MessageCircle size={15} aria-hidden="true" /> +{request.whatsapp}
                  </a>
                </dd>
              </div>
              <div>
                <dt>Persetujuan privasi</dt>
                <dd>{formatDateTime(request.privacy_consent_at)}</dd>
              </div>
            </dl>
          </section>
          <RequestManager
            key={request.id}
            id={request.id}
            status={request.status}
            notes={request.admin_notes}
          />
        </aside>
      </div>
    </>
  );
}

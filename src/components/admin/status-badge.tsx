export function StatusBadge({
  kind,
  status,
  children,
}: {
  kind: "app" | "request";
  status: string;
  children: React.ReactNode;
}) {
  return (
    <span className={`status-badge status-${kind}-${status}`}>{children}</span>
  );
}

export const appStatusLabels: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Arsip",
};

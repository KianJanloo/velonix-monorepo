import { RequireAuth } from "@/components/templates/RequireAuth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

import { RequireAuth } from "@/components/templates/RequireAuth";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

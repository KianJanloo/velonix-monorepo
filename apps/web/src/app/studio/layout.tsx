import { RequireAuth } from "@/components/templates/RequireAuth";

export default function StudioLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

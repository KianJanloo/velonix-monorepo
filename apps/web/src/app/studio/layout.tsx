import { RequireAuth } from "@/components/templates/RequireAuth";
import { StudioThemeLock } from "@/components/templates/StudioThemeLock";

export default function StudioLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <StudioThemeLock />
      {children}
    </RequireAuth>
  );
}

import type { Metadata } from "next";
import { NewGameWizard } from "@/components/organisms/NewGameWizard";

export const metadata: Metadata = { title: "New Game — Studio" };

export default function NewGamePage() {
  return <NewGameWizard />;
}

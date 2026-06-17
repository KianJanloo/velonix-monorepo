import type { Metadata } from "next";
import { NewGameWizard } from "@/components/organisms/game/NewGameWizard";

export const metadata: Metadata = { title: "New Game — Studio" };

export default function NewGamePage() {
  return <NewGameWizard />;
}

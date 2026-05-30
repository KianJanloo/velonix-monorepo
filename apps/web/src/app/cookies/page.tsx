import type { Metadata } from "next";
import { LegalPage } from "@/components/templates/LegalPage";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      lastUpdated="January 2026"
      intro="This Cookie Policy explains how Velonix uses cookies and similar technologies to recognize you when you visit our platform, and the choices you have."
      sections={[
        {
          heading: "What Are Cookies?",
          body: [
            "Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and keep you logged in.",
            "We also use similar technologies like local storage to maintain your session and studio preferences.",
          ],
        },
        {
          heading: "Essential Cookies",
          body: [
            "These are required for the platform to function. They keep you authenticated, maintain your session, and remember your studio settings (like grid and zoom preferences).",
            "Essential cookies cannot be disabled as the platform would not work without them.",
          ],
        },
        {
          heading: "Functional Cookies",
          body: [
            "These remember your choices such as theme preferences and recently viewed games to provide a more personalized experience.",
          ],
        },
        {
          heading: "Analytics Cookies",
          body: [
            "We use privacy-respecting analytics to understand how creators use Velonix so we can improve the platform. These cookies collect aggregated, anonymized data.",
          ],
        },
        {
          heading: "Managing Cookies",
          body: [
            "You can control and delete cookies through your browser settings. Note that disabling essential cookies will prevent you from logging in or using the Studio.",
            "Most browsers let you refuse cookies or alert you when cookies are being sent.",
          ],
        },
        {
          heading: "Changes to This Policy",
          body: [
            "We may update this Cookie Policy as our practices evolve. Material changes will be communicated through the platform.",
          ],
        },
      ]}
    />
  );
}

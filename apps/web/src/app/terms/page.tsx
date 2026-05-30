import type { Metadata } from "next";
import { LegalPage } from "@/components/templates/LegalPage";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated="January 2026"
      intro="Welcome to Velonix. These Terms of Service govern your use of the Velonix platform, including the Studio, Marketplace, and all related services. By creating an account or using our services, you agree to these terms."
      sections={[
        {
          heading: "Acceptance of Terms",
          body: [
            "By accessing or using Velonix, you confirm that you are at least 13 years of age and agree to be bound by these Terms of Service and our Privacy Policy.",
            "If you are using Velonix on behalf of an organization, you represent that you have authority to bind that organization to these terms.",
          ],
        },
        {
          heading: "Your Account",
          body: [
            "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.",
            "You must provide accurate and complete information when creating an account. You may not impersonate others or create accounts through automated means.",
            "We reserve the right to suspend or terminate accounts that violate these terms.",
          ],
        },
        {
          heading: "Content Ownership",
          body: [
            "You retain all ownership rights to the games and content you create on Velonix. By publishing to the Marketplace, you grant Velonix a non-exclusive license to host, display, and distribute your content.",
            "You are solely responsible for ensuring you have the rights to all assets, artwork, and intellectual property used in your games.",
            "Content that infringes copyright, contains hate speech, or violates our community guidelines will be removed.",
          ],
        },
        {
          heading: "Marketplace & Payments",
          body: [
            "When you sell a game, Velonix collects a commission based on your subscription tier (15–25%). The remaining revenue is paid to your connected Stripe account.",
            "Buyers receive a license to play purchased games. Refunds are handled according to our refund policy.",
            "Velonix is not responsible for disputes between creators and buyers but will mediate where appropriate.",
          ],
        },
        {
          heading: "Subscriptions",
          body: [
            "Paid subscriptions renew automatically until cancelled. You may cancel at any time through your account settings.",
            "All paid plans include a 14-day money-back guarantee. After this period, fees are non-refundable except where required by law.",
          ],
        },
        {
          heading: "Prohibited Conduct",
          body: [
            "You may not use Velonix to distribute malware, engage in fraud, harass other users, or violate any applicable laws.",
            "Attempting to circumvent platform fees, reverse-engineer the service, or abuse our systems is strictly prohibited.",
          ],
        },
        {
          heading: "Limitation of Liability",
          body: [
            "Velonix is provided \"as is\" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform.",
          ],
        },
        {
          heading: "Changes to These Terms",
          body: [
            "We may update these terms from time to time. We will notify you of material changes via email or platform notification. Continued use after changes constitutes acceptance.",
          ],
        },
      ]}
    />
  );
}

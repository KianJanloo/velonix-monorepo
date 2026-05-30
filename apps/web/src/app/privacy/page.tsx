import type { Metadata } from "next";
import { LegalPage } from "@/components/templates/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="January 2026"
      intro="At Velonix, we take your privacy seriously. This policy explains what information we collect, how we use it, and the choices you have regarding your data."
      sections={[
        {
          heading: "Information We Collect",
          body: [
            "Account information: your email, username, display name, and password (stored as a secure hash).",
            "Usage data: how you interact with the Studio and Marketplace, including games created, edits, and purchases.",
            "Payment data: handled entirely by Stripe. We never store your full card details.",
            "Technical data: IP address, browser type, and device information for security and analytics.",
          ],
        },
        {
          heading: "How We Use Your Information",
          body: [
            "To provide and improve the Velonix platform and its features.",
            "To process payments, payouts, and subscription billing.",
            "To communicate with you about your account, security, and product updates.",
            "To detect and prevent fraud, abuse, and security incidents.",
          ],
        },
        {
          heading: "Data Sharing",
          body: [
            "We do not sell your personal data. We share data only with trusted service providers (like Stripe for payments and email providers for notifications) who are bound by confidentiality obligations.",
            "We may disclose data if required by law or to protect the rights and safety of Velonix and its users.",
          ],
        },
        {
          heading: "Your Public Profile",
          body: [
            "Your username, display name, avatar, bio, and published games are publicly visible. You control what appears in your bio through your account settings.",
          ],
        },
        {
          heading: "Data Security",
          body: [
            "We use industry-standard encryption, secure password hashing (bcrypt), and access controls to protect your data.",
            "While we strive to protect your information, no system is completely secure. Please use a strong, unique password.",
          ],
        },
        {
          heading: "Your Rights",
          body: [
            "You can access, update, or delete your personal data at any time through your account settings.",
            "You may request a full export or deletion of your account by contacting us. Account deletion permanently removes your data, subject to legal retention requirements.",
          ],
        },
        {
          heading: "Data Retention",
          body: [
            "We retain your data for as long as your account is active. Upon deletion, personal data is removed within 30 days, except where retention is legally required (e.g. transaction records).",
          ],
        },
        {
          heading: "Contact Us",
          body: [
            "For any privacy-related questions or requests, contact our Data Protection team at privacy@velonix.gg.",
          ],
        },
      ]}
    />
  );
}

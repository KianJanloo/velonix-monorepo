import type { Metadata } from "next";
import { ProfileView } from "@/components/organisms/profile/ProfileView";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Creator Profile` };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  return <ProfileView username={username} />;
}

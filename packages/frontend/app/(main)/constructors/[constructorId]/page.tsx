import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getConstructorProfile } from '@/lib/api';
import { ConstructorProfileContent } from '@/components/f1/sections/constructor-profile-content';

interface ConstructorPageProps {
  params: Promise<{ constructorId: string }>;
}

export async function generateMetadata({ params }: ConstructorPageProps): Promise<Metadata> {
  const { constructorId } = await params;
  const profile = await getConstructorProfile(constructorId).catch(() => null);

  if (!profile) {
    return {
      title: 'Constructor Profile | Purple Sector',
    };
  }

  const teamName = profile.meta.fullName || profile.constructor.name;
  return {
    title: `${teamName} — Constructor Profile & Statistics | Purple Sector`,
    description: `Explore ${teamName} Formula 1 career statistics, championships, wins, podiums, team leadership, current drivers, and historical roster.`,
  };
}

export default async function ConstructorProfilePage({ params }: ConstructorPageProps) {
  const { constructorId } = await params;
  return <ConstructorProfileContent constructorId={constructorId} />;
}

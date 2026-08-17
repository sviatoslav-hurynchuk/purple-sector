import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDriverProfile } from '@/lib/api';
import { DriverProfileContent } from '@/components/f1/sections/driver-profile-content';

interface DriverPageProps {
  params: Promise<{ driverId: string }>;
}

export async function generateMetadata({ params }: DriverPageProps): Promise<Metadata> {
  const { driverId } = await params;
  const profile = await getDriverProfile(driverId).catch(() => null);

  if (!profile) {
    return {
      title: 'Driver Profile | Purple Sector',
    };
  }

  const name = `${profile.driver.givenName} ${profile.driver.familyName}`;
  return {
    title: `${name} — Career Stats & Profile | Purple Sector`,
    description: `View ${name}'s Formula 1 career statistics, wins, podiums, poles, championships, and team history.`,
  };
}

export default async function DriverProfilePage({ params }: DriverPageProps) {
  const { driverId } = await params;
  const profile = await getDriverProfile(driverId).catch(() => null);

  if (!profile) {
    notFound();
  }

  return <DriverProfileContent profile={profile} />;
}

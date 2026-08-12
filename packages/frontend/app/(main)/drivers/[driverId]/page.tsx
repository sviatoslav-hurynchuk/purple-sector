import { Suspense } from 'react';
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

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="h-64 bg-zinc-900 animate-pulse rounded-2xl mb-8 border border-zinc-800" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-zinc-900 animate-pulse rounded-xl border border-zinc-800" />
            ))}
          </div>
        </div>
      }
    >
      <DriverProfileContent profile={profile} />
    </Suspense>
  );
}

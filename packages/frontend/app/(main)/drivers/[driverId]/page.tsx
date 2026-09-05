import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDriverProfile, getConstructorHeadToHead } from '@/lib/api';
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

  const latestSeasonEntry = profile.seasonHistory[0];
  const currentConstructorId = latestSeasonEntry?.constructors[0]?.constructorId;
  const currentYear = new Date().getFullYear();
  let h2hBattles = currentConstructorId
    ? await getConstructorHeadToHead(currentYear, currentConstructorId).catch(() => null)
    : null;
  let h2hSeason = currentYear;

  if (!h2hBattles || h2hBattles.length === 0 || h2hBattles[0]?.rounds.length === 0) {
    const fallbackSeason = Number(latestSeasonEntry?.season) || currentYear - 1;
    if (fallbackSeason !== currentYear && currentConstructorId) {
      h2hBattles = await getConstructorHeadToHead(fallbackSeason, currentConstructorId).catch(() => null);
      h2hSeason = fallbackSeason;
    }
  }

  const normalizedId = driverId.toLowerCase();
  const driverBattle =
    h2hBattles?.find(
      (b) =>
        b.driver1.driverId.toLowerCase() === normalizedId ||
        b.driver2.driverId.toLowerCase() === normalizedId
    ) || null;

  return (
    <DriverProfileContent
      profile={profile}
      headToHeadBattle={driverBattle}
      h2hSeason={h2hSeason}
    />
  );
}

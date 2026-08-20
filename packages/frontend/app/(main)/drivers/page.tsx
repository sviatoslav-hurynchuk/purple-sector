import { redirect } from 'next/navigation';

interface DriversPageProps {
  searchParams: Promise<{ season?: string }>;
}

export default async function DriversPage({ searchParams }: DriversPageProps) {
  const { season } = await searchParams;
  const target = season ? `/constructors?season=${season}` : '/constructors';
  redirect(target);
}

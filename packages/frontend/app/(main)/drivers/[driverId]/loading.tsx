export default function DriverProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 w-24 bg-zinc-800 rounded mb-6" />

      {/* Hero card skeleton */}
      <div className="h-64 bg-zinc-900 rounded-2xl mb-8 border border-zinc-800" />

      {/* Career highlights grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-zinc-900 rounded-xl border border-zinc-800" />
        ))}
      </div>

      {/* Season stats card skeleton */}
      <div className="h-80 bg-zinc-900 rounded-2xl border border-zinc-800" />
    </div>
  );
}

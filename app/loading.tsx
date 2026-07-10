export default function RootLoading() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8" aria-label="در حال بارگذاری">
      <div className="hidden h-[calc(100vh-4rem)] w-64 animate-pulse rounded-[18px] bg-surface lg:block" />
      <div className="flex-1 space-y-6">
        <div className="h-12 w-2/5 animate-pulse rounded-xl bg-surface" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-52 animate-pulse rounded-[14px] border border-border bg-surface" />
          ))}
        </div>
      </div>
    </div>
  );
}

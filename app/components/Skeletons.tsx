export function TodaySkeleton() {
  return (
    <div className="space-y-6 max-w-xl mx-auto w-full px-5 py-8 animate-pulse">
      {/* Date & Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-28 rounded-full skeleton-shimmer" />
          <div className="h-7 w-56 rounded-2xl skeleton-shimmer" />
        </div>
        <div className="h-8 w-32 rounded-full skeleton-shimmer" />
      </div>

      {/* Hero Commitment Card Skeleton */}
      <div className="p-6 rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] space-y-3 shadow-organic-md">
        <div className="h-3 w-24 rounded-full skeleton-shimmer" />
        <div className="h-6 w-48 rounded-xl skeleton-shimmer" />
        <div className="h-4 w-full rounded-lg skeleton-shimmer" />
      </div>

      {/* Circadian Arc Skeleton */}
      <div className="p-6 rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] space-y-4 shadow-organic-md">
        <div className="flex justify-between">
          <div className="h-3.5 w-32 rounded-full skeleton-shimmer" />
          <div className="h-3.5 w-24 rounded-full skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="h-28 rounded-2xl skeleton-shimmer" />
          <div className="h-28 rounded-2xl skeleton-shimmer" />
          <div className="h-28 rounded-2xl skeleton-shimmer" />
        </div>
      </div>

      {/* Cards Skeleton */}
      <div className="space-y-4">
        <div className="h-32 rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] p-6 shadow-organic-sm skeleton-shimmer" />
        <div className="h-32 rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] p-6 shadow-organic-sm skeleton-shimmer" />
      </div>
    </div>
  );
}

export function JournalSkeleton() {
  return (
    <div className="space-y-6 max-w-xl mx-auto w-full px-5 py-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-28 rounded-full skeleton-shimmer" />
          <div className="h-7 w-44 rounded-2xl skeleton-shimmer" />
        </div>
        <div className="h-7 w-24 rounded-full skeleton-shimmer" />
      </div>
      <div className="h-16 rounded-3xl skeleton-shimmer" />
      <div className="flex gap-2">
        <div className="h-8 w-20 rounded-full skeleton-shimmer" />
        <div className="h-8 w-28 rounded-full skeleton-shimmer" />
        <div className="h-8 w-24 rounded-full skeleton-shimmer" />
      </div>
      <div className="space-y-4">
        <div className="h-28 rounded-3xl skeleton-shimmer" />
        <div className="h-28 rounded-3xl skeleton-shimmer" />
        <div className="h-28 rounded-3xl skeleton-shimmer" />
      </div>
    </div>
  );
}

export function ProgressSkeleton() {
  return (
    <div className="space-y-6 max-w-xl mx-auto w-full px-5 py-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-28 rounded-full skeleton-shimmer" />
          <div className="h-7 w-52 rounded-2xl skeleton-shimmer" />
        </div>
        <div className="h-8 w-28 rounded-full skeleton-shimmer" />
      </div>

      <div className="h-28 rounded-3xl skeleton-shimmer" />

      <div className="grid grid-cols-3 gap-3">
        <div className="h-24 rounded-3xl skeleton-shimmer" />
        <div className="h-24 rounded-3xl skeleton-shimmer" />
        <div className="h-24 rounded-3xl skeleton-shimmer" />
      </div>

      <div className="h-64 rounded-3xl skeleton-shimmer" />
      <div className="h-44 rounded-3xl skeleton-shimmer" />
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 max-w-xl mx-auto w-full px-5 py-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-28 rounded-full skeleton-shimmer" />
          <div className="h-7 w-48 rounded-2xl skeleton-shimmer" />
        </div>
      </div>

      <div className="p-6 rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] space-y-4 shadow-organic-md">
        <div className="h-4 w-36 rounded-full skeleton-shimmer" />
        <div className="space-y-3 pt-2">
          <div className="h-10 rounded-xl skeleton-shimmer" />
          <div className="h-10 rounded-xl skeleton-shimmer" />
        </div>
      </div>

      <div className="p-6 rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] space-y-4 shadow-organic-md">
        <div className="h-4 w-40 rounded-full skeleton-shimmer" />
        <div className="h-20 rounded-xl skeleton-shimmer" />
      </div>
    </div>
  );
}

const Skeletons = {
  TodaySkeleton,
  JournalSkeleton,
  ProgressSkeleton,
  SettingsSkeleton,
};

export default Skeletons;


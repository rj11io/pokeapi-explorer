import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-svh bg-[#f7f8f4] p-6 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-3 h-11 w-64" />
        <Skeleton className="mt-8 h-16 w-full rounded-2xl" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

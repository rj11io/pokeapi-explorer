import Link from "next/link"

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-[#f7f8f4] p-6 text-center dark:bg-zinc-950">
      <div>
        <div className="font-mono text-sm text-emerald-600">404</div>
        <h1 className="mt-2 text-3xl font-black">Explorer route not found</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Choose a valid generation and data section.
        </p>
        <Link
          href="/generation/1/search"
          className="mt-6 inline-flex rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950"
        >
          Open Generation I
        </Link>
      </div>
    </main>
  )
}

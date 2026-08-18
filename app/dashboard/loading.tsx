export default function Loading() {
  return (
    <div className="w-full h-96 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-zinc-200 border-t-red-700 rounded-full animate-spin" />
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
        Loading View...
      </p>
    </div>
  )
}
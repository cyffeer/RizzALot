export default function Logo({ className = '' }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white font-bold">R</span>
      <span className="text-lg font-semibold">Rizz-A-Lot</span>
    </div>
  )
}

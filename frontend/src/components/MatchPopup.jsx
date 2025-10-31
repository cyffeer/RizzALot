import Avatar from './Avatar'

export default function MatchPopup({ open, other, onClose, onChat }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-2 text-2xl font-extrabold">It’s a match! 🎉</div>
        <div className="mb-1 text-sm text-gray-600 dark:text-gray-300">You and {other?.name || 'someone'} like each other</div>
        <div className="mx-auto my-4 flex items-center justify-center">
          <Avatar size={96} name={other?.name} src={other?.photo && (other.photo.startsWith?.('http') ? other.photo : (import.meta.env.VITE_API_BASE_URL + other.photo))} />
        </div>
        {other?.age ? <div className="mb-4 text-sm text-gray-700 dark:text-gray-300">{other.age} years old</div> : null}
        <div className="flex gap-2">
          <button type="button" className="btn-primary flex-1" onClick={onChat}>Say hi</button>
          <button type="button" className="btn-outline flex-1" onClick={onClose}>Keep browsing</button>
        </div>
      </div>
    </div>
  )
}

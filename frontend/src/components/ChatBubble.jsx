import Badge from './Badge'

export default function ChatBubble({ message, align = 'left', reactions = [], senderName }) {
  const isRight = align === 'right'
  const counts = { love: 0, like: 0, funny: 0 }
  reactions.forEach((r) => { if (counts[r.type] !== undefined) counts[r.type]++ })
  return (
    <div className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ring-1 ${isRight ? 'bg-brand text-white ring-brand/10' : 'bg-white text-gray-900 ring-gray-200'}`}>
        <div className={`mb-1 flex items-center justify-between gap-3 text-[11px] ${isRight ? 'text-white/80' : 'text-gray-600'}`}>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${isRight ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-800'}`}>
            {senderName || (isRight ? 'You' : 'Them')}
          </span>
          <span className="opacity-80">{new Date(message.createdAt).toLocaleString()}</span>
        </div>
        <div>{message.content}</div>
        <div className="mt-1 flex items-center gap-2 text-[11px]">
          {counts.love ? <Badge className={isRight? 'bg-white/15 text-white': ''}>❤️ {counts.love}</Badge> : null}
          {counts.like ? <Badge className={isRight? 'bg-white/15 text-white': ''}>👍 {counts.like}</Badge> : null}
          {counts.funny ? <Badge className={isRight? 'bg-white/15 text-white': ''}>😂 {counts.funny}</Badge> : null}
        </div>
      </div>
    </div>
  )
}

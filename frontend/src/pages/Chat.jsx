import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../utils/api'
import { io } from 'socket.io-client'
import Card, { CardBody } from '../components/Card'
import Button from '../components/Button'
import ChatBubble from '../components/ChatBubble'
import { useAuth } from '../state/AuthContext'

export default function Chat() {
  const { matchId } = useParams()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [suggesting, setSuggesting] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const [reasons, setReasons] = useState([])
  const [mutual, setMutual] = useState([])
  const [starters, setStarters] = useState([])
  const [other, setOther] = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    api.get(`/messages/${matchId}`).then(({ data }) => setMessages(data))
    // Load reasons/mutual and starters
    api.get(`/matches/${matchId}`).then(({ data }) => {
      setReasons(data.reasons || [])
      setMutual(data.mutual?.shared || [])
      setOther(data.otherUser || null)
    }).catch(() => {})
    api.get(`/starters`, { params: { matchId } }).then(({ data }) => setStarters(data.starters || [])).catch(() => {})
  }, [matchId])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const socket = io(import.meta.env.VITE_SOCKET_URL, { auth: { token } })
    socketRef.current = socket
    socket.emit('joinMatch', matchId)
    socket.on('message', (msg) => setMessages((arr) => [...arr, msg]))
    socket.on('reaction', ({ messageId, reactions }) => {
      setMessages((arr) => arr.map((m) => (m._id === messageId ? { ...m, reactions } : m)))
    })
    return () => socket.disconnect()
  }, [matchId])

  const send = async (e) => {
    e.preventDefault()
    const content = input.trim()
    if (!content) return
    setInput('')
    socketRef.current?.emit('message', { matchId, content })
  }

  const react = (messageId, type) => {
    // optimistic update
    setMessages((arr) => arr.map((m) => {
      if (m._id !== messageId) return m
      const userId = localStorage.getItem('userId') || user?._id // fallback to auth user id
      let reactions = Array.isArray(m.reactions) ? [...m.reactions] : []
      const idx = reactions.findIndex((r) => r.user === userId)
      if (idx >= 0) {
        if (reactions[idx].type === type) reactions.splice(idx, 1)
        else reactions[idx].type = type
      } else if (userId) {
        reactions.push({ user: userId, type })
      }
      return { ...m, reactions }
    }))
    socketRef.current?.emit('react', { matchId, messageId, type })
  }

  const summarizeReactions = (reactions = []) => {
    const counts = { love: 0, like: 0, funny: 0 }
    reactions.forEach((r) => { if (counts[r.type] !== undefined) counts[r.type]++ })
    return counts
  }

  const suggest = async () => {
    try {
      setSuggesting(true)
      setSuggestion('')
      const { data } = await api.get(`/ai/pickup-line/${matchId}`)
      setSuggestion(data.line)
      // Prefill the input so user can edit before sending
      setInput((prev) => prev || data.line)
    } catch (e) {
      setSuggestion('Could not generate a pickup line right now.')
    } finally {
      setSuggesting(false)
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Chat</h2>
      {(reasons.length || mutual.length) ? (
        <Card>
          <CardBody>
            {reasons.length ? <div className="text-xs mb-1"><strong>Why you matched:</strong> {reasons.join(' • ')}</div> : null}
            {mutual.length ? (
              <div className="flex flex-wrap gap-2">
                {mutual.map((t, i) => <span key={i} className="chip">{t}</span>)}
              </div>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {starters.length ? (
        <div className="flex flex-wrap gap-2">
          {starters.map((s, i) => (
            <Button key={i} variant="outline" onClick={() => setInput(s)} className="text-xs">{s}</Button>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Button onClick={suggest} disabled={suggesting} variant="secondary">
          {suggesting ? 'Thinking…' : 'Suggest pickup line'}
        </Button>
        {suggestion && <span className="text-sm italic text-gray-600 dark:text-gray-400">{suggestion}</span>}
      </div>

      <Card>
        <CardBody>
          <div className="grid gap-2 h-[58vh] min-h-[320px] md:h-[420px] overflow-auto">
            {messages.map((m) => {
              const senderId = m.sender || m.user || m.from || m.author || m.authorId
              const mine = typeof m.mine === 'boolean' ? m.mine : (senderId && user ? senderId === user._id : false)
              const align = mine ? 'right' : 'left'
              const senderName = mine ? 'You' : (other?.name || 'Them')
              const c = summarizeReactions(m.reactions)
              return (
                <div key={m._id} className="space-y-1">
                  <ChatBubble message={m} align={align} reactions={m.reactions} senderName={senderName} />
                  <div className={`flex items-center gap-2 text-xs ${mine ? 'justify-end text-gray-500 dark:text-gray-400' : 'justify-start text-gray-600 dark:text-gray-400'}`}>
                    <button type="button" className="hover:opacity-80" onClick={() => react(m._id, 'love')}>❤️ {c.love || ''}</button>
                    <button type="button" className="hover:opacity-80" onClick={() => react(m._id, 'like')}>👍 {c.like || ''}</button>
                    <button type="button" className="hover:opacity-80" onClick={() => react(m._id, 'funny')}>😂 {c.funny || ''}</button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>

      <form onSubmit={send} className="sticky bottom-0 z-10 flex items-center gap-2 bg-gray-50/60 py-2 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 dark:bg-gray-900/60 supports-[backdrop-filter]:dark:bg-gray-900/60">
        <input className="input flex-1" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message" />
        <Button type="submit">Send</Button>
      </form>
    </div>
  )
}

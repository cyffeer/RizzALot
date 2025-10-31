import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import ToastContainer from './Toast'
import MatchPopup from './MatchPopup'

let idSeq = 1

export default function GlobalEvents() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const socketRef = useRef(null)
  const [toasts, setToasts] = useState([])
  const [matchModal, setMatchModal] = useState({ open: false, other: null, matchId: null })

  // Connect socket globally
  useEffect(() => {
    if (!token) return
    const socket = io(import.meta.env.VITE_SOCKET_URL, { auth: { token } })
    socketRef.current = socket
    // Message notification
    socket.on('newMessage', (evt) => {
      const title = 'New message'
      const body = evt.preview || evt.content || ''
      const t = {
        id: idSeq++,
        icon: '💬',
        title,
        body,
        action: 'Open',
        onAction: () => navigate(`/chat/${evt.matchId}`)
      }
      setToasts((arr) => [...arr, t])
    })
    // Match notification (show modal)
    socket.on('newMatch', ({ matchId, other }) => {
      setMatchModal({ open: true, other, matchId })
    })
    return () => socket.disconnect()
  }, [token, navigate])

  const onCloseToast = (id) => setToasts((arr) => arr.filter((t) => t.id !== id))

  const onCloseMatch = () => setMatchModal({ open: false, other: null, matchId: null })
  const onChatMatch = () => {
    if (matchModal.matchId) navigate(`/chat/${matchModal.matchId}`)
    onCloseMatch()
  }

  if (!token) return null

  return (
    <>
      <ToastContainer toasts={toasts} onClose={onCloseToast} />
      <MatchPopup open={matchModal.open} other={matchModal.other} onClose={onCloseMatch} onChat={onChatMatch} />
    </>
  )
}

import { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar'
import Badge from './Badge'
import Button from './Button'

// Swipeable card with left/right drag to skip/like
// Props: person, onLike(person), onSkip(person)
export default function SwipeCard({ person, onLike, onSkip, disabled = false, isBack = false }) {
  const [dx, setDx] = useState(0)
  const [dy, setDy] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [entered, setEntered] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const startRef = useRef({ x: 0, y: 0 })
  const elRef = useRef(null)

  const THRESHOLD = 120

  const onPointerDown = (e) => {
    if (animating || disabled) return
    setDragging(true)
    const pt = pointerPoint(e)
    startRef.current = pt
    elRef.current?.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!dragging || disabled) return
    const pt = pointerPoint(e)
    setDx(pt.x - startRef.current.x)
    setDy(pt.y - startRef.current.y)
  }

  const onPointerUp = async (e) => {
    if (!dragging || disabled) return
    setDragging(false)
    const x = dx
    // Tap detection: small movement = photo navigation
    const TAP_SLOP = 8
    if (Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP) {
      const rect = elRef.current?.getBoundingClientRect()
      if (rect && typeof e.clientX === 'number') {
        if (e.clientX < rect.left + rect.width / 2) prevPhoto()
        else nextPhoto()
      }
      // Reset any slight transform after tap
      setAnimating(true)
      setDx(0); setDy(0)
      setTimeout(() => setAnimating(false), 120)
      return
    }
    if (x > THRESHOLD) {
      await dismiss('right')
      onLike?.(person)
    } else if (x < -THRESHOLD) {
      await dismiss('left')
      onSkip?.(person)
    } else {
      // snap back
      setAnimating(true)
      setDx(0); setDy(0)
      setTimeout(() => setAnimating(false), 200)
    }
  }

  const dismiss = (dir) => new Promise((resolve) => {
    setAnimating(true)
    setDx(dir === 'right' ? window.innerWidth : -window.innerWidth)
    setDy(dy * 0.2)
    setTimeout(() => {
      setAnimating(false)
      setDx(0); setDy(0)
      resolve()
    }, 220)
  })

  useEffect(() => {
    const onKey = (e) => {
      if (!person || animating) return
      if (e.key === 'ArrowRight') {
        dismiss('right').then(() => onLike?.(person))
      } else if (e.key === 'ArrowLeft') {
        dismiss('left').then(() => onSkip?.(person))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [person, animating])

  // Mount/appear animation for smoother transition to next card
  useEffect(() => {
    setEntered(false)
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [person?._id])

  // Reset carousel when person changes
  useEffect(() => {
    setPhotoIndex(0)
    setShowDetails(false)
  }, [person?._id])

  const rot = dx / 15
  let transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`
  if (isBack && !dragging && !animating) {
    transform = 'scale(0.98) translateY(8px)'
  }
  const transition = dragging ? 'none' : (animating ? 'transform 0.25s ease-in, opacity 0.25s ease' : 'transform 0.25s ease, opacity 0.25s ease')
  const style = {
    transform,
    transition,
    touchAction: 'none',
    opacity: isBack ? 0.95 : (entered ? 1 : 0),
    pointerEvents: disabled ? 'none' : 'auto',
  }

  // Build photo carousel: always include primary photo first if present, then the rest; de-dup while preserving order
  const rawPhotos = [person?.photo, ...(Array.isArray(person?.photos) ? person.photos : [])].filter(Boolean)
  const uniquePhotos = Array.from(new Set(rawPhotos))
  const resolvedPhotos = uniquePhotos
    .map((p) => (p?.startsWith?.('http') ? p : (p ? (import.meta.env.VITE_API_BASE_URL + p) : '')))
    .filter(Boolean)
  const currentPhoto = resolvedPhotos[photoIndex] || ''
  const likeOpacity = Math.max(0, Math.min(1, (dx - 40) / 100))
  const nopeOpacity = Math.max(0, Math.min(1, (-dx - 40) / 100))

  const nextPhoto = () => {
    if (!resolvedPhotos.length) return
    setPhotoIndex((i) => (i + 1) % resolvedPhotos.length)
  }
  const prevPhoto = () => {
    if (!resolvedPhotos.length) return
    setPhotoIndex((i) => (i - 1 + resolvedPhotos.length) % resolvedPhotos.length)
  }

  return (
    <div
      ref={elRef}
      className="relative"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={style}
    >
      <div className="relative overflow-hidden rounded-2xl bg-gray-200 shadow-md h-[68vh] sm:h-[520px]">
        {/* Photo */}
        {currentPhoto ? (
          <img src={currentPhoto} alt={person?.name} className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none" draggable={false} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Avatar src="" name={person?.name} size={96} />
          </div>
        )}

        {/* Progress bars */}
        {resolvedPhotos.length > 1 && (
          <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 p-3">
            {resolvedPhotos.map((_, i) => (
              <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/40">
                <div className="h-full bg-white transition-all" style={{ width: `${i < photoIndex ? 100 : i === photoIndex ? 100 : 0}%` }} />
              </div>
            ))}
          </div>
        )}

        {/* Photo tap handled via pointer tap detection in onPointerUp; no overlay zones to block swipes */}

        {/* Bottom info overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 sm:p-5">
          <div className="pointer-events-auto flex items-center justify-between gap-3">
            <div>
              <div className="text-white text-2xl font-semibold drop-shadow">{person?.name}{person?.age ? `, ${person.age}` : ''}</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {person?.gender ? <Badge variant="secondary">{person.gender}</Badge> : null}
                {person?.intent ? <Badge variant="secondary">{person.intent}</Badge> : null}
              </div>
            </div>
            <Button variant="secondary" className="shrink-0" onPointerDown={(e)=>e.stopPropagation()} onClick={() => setShowDetails((v)=>!v)}>
              {showDetails ? 'Hide' : 'Info'}
            </Button>
          </div>

          {/* Quick chips */}
          {person?.mutual?.shared?.length ? (
            <div className="pointer-events-auto mt-3 flex flex-wrap gap-2">
              {person.mutual.shared.slice(0,5).map((t, i) => (
                <Badge key={i} className="bg-white/90 text-gray-800">{t}</Badge>
              ))}
            </div>
          ) : null}
        </div>

        {/* Details sheet */}
        {showDetails && (
          <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 max-h-[55%] overflow-y-auto rounded-t-2xl bg-white/95 backdrop-blur p-4 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="text-sm font-semibold text-gray-900">Profile info</div>
              <button
                type="button"
                aria-label="Close info"
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                onPointerDown={(e)=>e.stopPropagation()}
                onClick={() => setShowDetails(false)}
              >
                ✕
              </button>
            </div>
            {person?.bio ? <p className="text-gray-800 text-sm leading-relaxed">{person.bio}</p> : null}
            {person?.profileQuestions && (
              <div className="mt-3 space-y-2 text-sm">
                {person.profileQuestions.musicGenres?.length ? (
                  <div>
                    <div className="text-gray-700 font-semibold mb-1">Music</div>
                    <div className="flex flex-wrap gap-2">
                      {person.profileQuestions.musicGenres.map((g, i) => <Badge key={i}>{g}</Badge>)}
                    </div>
                  </div>
                ) : null}
                {person.profileQuestions.hobbies?.length ? (
                  <div>
                    <div className="text-gray-700 font-semibold mb-1">Hobbies</div>
                    <div className="flex flex-wrap gap-2">
                      {person.profileQuestions.hobbies.map((g, i) => <Badge key={i}>{g}</Badge>)}
                    </div>
                  </div>
                ) : null}
                {person.profileQuestions.passions?.length ? (
                  <div>
                    <div className="text-gray-700 font-semibold mb-1">Passions</div>
                    <div className="flex flex-wrap gap-2">
                      {person.profileQuestions.passions.map((g, i) => <Badge key={i}>{g}</Badge>)}
                    </div>
                  </div>
                ) : null}
                {person.profileQuestions.about ? (
                  <div>
                    <div className="text-gray-700 font-semibold mb-1">About</div>
                    <p className="text-gray-800">{person.profileQuestions.about}</p>
                  </div>
                ) : null}
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <Button variant="outline" className="flex-1" onPointerDown={(e)=>e.stopPropagation()} onClick={() => dismiss('left').then(() => onSkip?.(person))}>Skip</Button>
              <Button className="flex-1" onPointerDown={(e)=>e.stopPropagation()} onClick={() => dismiss('right').then(() => onLike?.(person))}>Like</Button>
            </div>
          </div>
        )}
      </div>

      {/* Overlays */}
      <div className="pointer-events-none absolute left-3 top-3">
        <div className="rounded-lg border-2 border-green-500 px-3 py-1 text-sm font-bold text-green-600" style={{ opacity: likeOpacity }}>
          LIKE
        </div>
      </div>
      <div className="pointer-events-none absolute right-3 top-3">
        <div className="rounded-lg border-2 border-red-500 px-3 py-1 text-sm font-bold text-red-600" style={{ opacity: nopeOpacity }}>
          NOPE
        </div>
      </div>
    </div>
  )
}

function pointerPoint(e) {
  if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
  return { x: e.clientX, y: e.clientY }
}

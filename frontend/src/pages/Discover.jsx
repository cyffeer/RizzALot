import { useEffect, useState } from 'react'
import api from '../utils/api'
import Card, { CardBody } from '../components/Card'
import Button from '../components/Button'
import SwipeCard from '../components/SwipeCard'

export default function Discover() {
  const [people, setPeople] = useState([])
  const [page, setPage] = useState(1)
  const [intent, setIntent] = useState('')
  const [stack, setStack] = useState('')
  const [setupComplete, setSetupComplete] = useState(() => sessionStorage.getItem('discoverSetupDone') === '1')
  const [continuing, setContinuing] = useState(false)

  const fetchUsers = async (p = 1) => {
    const params = new URLSearchParams({ page: String(p), limit: '10' })
    if (intent) params.set('intent', intent)
    if (stack) params.set('stack', stack)
    const { data } = await api.get(`/users/discover?${params.toString()}`)
    setPeople(data.users)
    setPage(data.page)
  }

  useEffect(() => {
    if (setupComplete) fetchUsers(1)
  }, [setupComplete])

  // Daily prompt banner
  const [prompt, setPrompt] = useState(null)
  const [answer, setAnswer] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    api.get('/prompts/today').then(({ data }) => {
      setPrompt(data)
      setAnswer(data.answer || '')
    }).catch(() => {})
  }, [])

  const saveAnswer = async () => {
    if (!answer.trim()) return
    setSaving(true)
    try {
      await api.post('/prompts/answer', { answer })
      setPrompt((p) => ({ ...p, answered: true, answer }))
    } finally {
      setSaving(false)
    }
  }

  const like = async (id) => {
    const { data } = await api.post(`/users/like/${id}`)
    setPeople((arr) => arr.filter((u) => u._id !== id))
    if (data.matchCreated && data.matchId) alert('It\'s a match! Head to Matches to chat.')
    if (people.length < 3) fetchUsers(page + 1).catch(() => {})
  }

  const skip = async (id) => {
    await api.post(`/users/skip/${id}`)
    setPeople((arr) => arr.filter((u) => u._id !== id))
    if (people.length < 3) fetchUsers(page + 1).catch(() => {})
  }

  const next = () => fetchUsers(page + 1)
  const changeIntent = (e) => {
    const v = e.target.value
    setIntent(v)
    if (setupComplete) fetchUsers(1)
  }
  const chooseStack = (s) => {
    const v = s === stack ? '' : s
    setStack(v)
    if (setupComplete) fetchUsers(1)
  }

  const continueToDiscover = async () => {
    try {
      setContinuing(true)
      // If there's a prompt and it's not answered, require an answer and submit it
      if (prompt && !prompt.answered) {
        if (!answer.trim()) return // button will be disabled, just guard
        await api.post('/prompts/answer', { answer })
      }
      sessionStorage.setItem('discoverSetupDone', '1')
      setSetupComplete(true)
    } finally {
      setContinuing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Discover</h2>
      </div>

      {!setupComplete ? (
        <>
          {prompt ? (
            <Card>
              <CardBody>
                <div className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">Daily prompt</div>
                <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">{prompt.prompt}</div>
                <div className="flex items-center gap-2">
                  <input className="input flex-1" disabled={prompt.answered} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Your answer" />
                  {!prompt.answered && <Button disabled={saving || !answer.trim()} onClick={saveAnswer}>Submit</Button>}
                  {prompt.answered && <span className="text-xs text-green-600 dark:text-green-400">Thanks for answering!</span>}
                </div>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardBody>
              <div className="flex flex-wrap items-center gap-3">
                <label className="label m-0">Intent</label>
                <select className="input w-auto" value={intent} onChange={changeIntent}>
                  <option value="">Any</option>
                  <option value="serious">Serious</option>
                  <option value="casual">Casual</option>
                  <option value="friends">Friends</option>
                </select>
                <div className="ml-auto flex items-center gap-2">
                  <Button variant={stack==='new-today'? 'secondary':'outline'} onClick={() => chooseStack('new-today')}>New today</Button>
                  <Button variant={stack==='music-twins'? 'secondary':'outline'} onClick={() => chooseStack('music-twins')}>Music twins</Button>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={continueToDiscover} disabled={prompt && !prompt.answered && !answer.trim() || continuing}>
                  {continuing ? 'Continuing…' : 'Continue'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </>
      ) : (
        <>
          {/* Browsing UI once setup is complete */}
          <Card>
            <CardBody>
              <div className="flex flex-wrap items-center gap-3">
                <label className="label m-0">Intent</label>
                <select className="input w-auto" value={intent} onChange={changeIntent}>
                  <option value="">Any</option>
                  <option value="serious">Serious</option>
                  <option value="casual">Casual</option>
                  <option value="friends">Friends</option>
                </select>
                <div className="ml-auto flex items-center gap-2">
                  <Button variant={stack==='new-today'? 'secondary':'outline'} onClick={() => chooseStack('new-today')}>New today</Button>
                  <Button variant={stack==='music-twins'? 'secondary':'outline'} onClick={() => chooseStack('music-twins')}>Music twins</Button>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="relative mx-auto max-w-md sm:max-w-xl md:max-w-2xl min-h-[60vh] sm:min-h-[420px]">
            {people.length ? (
              <>
                {people[1] && (
                  <div className="absolute inset-0">
                    <SwipeCard key={`back-${people[1]._id}`} person={people[1]} disabled isBack />
                  </div>
                )}
                <div className="absolute inset-0">
                  <SwipeCard
                    key={people[0]._id}
                    person={people[0]}
                    onLike={(p) => like(p._id)}
                    onSkip={(p) => skip(p._id)}
                  />
                </div>
              </>
            ) : (
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">No more profiles. Try adjusting filters or click Refresh.</div>
            )}
          </div>
          {people.length ? (
            <div className="mt-4 flex items-center justify-center gap-6 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
              <Button
                variant="outline"
                className="h-14 w-14 rounded-full text-2xl bg-white ring-1 ring-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-100 dark:ring-gray-600 dark:hover:bg-gray-800"
                onClick={() => skip(people[0]._id)}
                aria-label="Skip"
              >
                👎
              </Button>
              <Button
                className="h-14 w-14 rounded-full text-2xl bg-white ring-2 ring-red-500 text-red-600 hover:bg-red-50 dark:bg-gray-900 dark:text-red-400 dark:ring-red-500/80 dark:hover:bg-gray-800"
                onClick={() => like(people[0]._id)}
                aria-label="Like"
              >
                ❤️
              </Button>
            </div>
          ) : null}
          <div className="flex justify-center">
            <Button variant="outline" className="mt-2" onClick={() => fetchUsers(1)}>Refresh</Button>
          </div>
        </>
      )}
    </div>
  )
}

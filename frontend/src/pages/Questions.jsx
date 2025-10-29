import { useEffect, useState } from 'react'
import api from '../utils/api'
import { useAuth } from '../state/AuthContext'
import { useNavigate } from 'react-router-dom'
import Card, { CardBody, CardHeader } from '../components/Card'
import Button from '../components/Button'
import { TextArea } from '../components/Input'

export default function Questions() {
  const { user, setUser } = useAuth()
  const nav = useNavigate()
  const [options, setOptions] = useState(null)
  const [form, setForm] = useState({
    gender: 'other',
    lookingFor: ['male','female','non-binary','other'],
    musicGenres: [],
    hobbies: [],
    passions: [],
    about: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/users/questions/options').then(({ data }) => setOptions(data))
  }, [])

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        gender: user.gender || f.gender,
        lookingFor: user.lookingFor?.length ? user.lookingFor : f.lookingFor,
        musicGenres: user.profileQuestions?.musicGenres || [],
        hobbies: user.profileQuestions?.hobbies || [],
        passions: user.profileQuestions?.passions || [],
        about: user.profileQuestions?.about || ''
      }))
    }
  }, [user])

  const toggle = (key, value) => () => setForm((f) => {
    const set = new Set(f[key])
    if (set.has(value)) set.delete(value); else set.add(value)
    return { ...f, [key]: Array.from(set) }
  })

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        gender: form.gender,
        lookingFor: form.lookingFor,
        musicGenres: form.musicGenres,
        hobbies: form.hobbies,
        passions: form.passions,
        about: form.about
      }
      const { data } = await api.post('/users/questions', payload)
      setUser(data)
      nav('/')
    } finally {
      setSaving(false)
    }
  }

  if (!options) return <div className="text-sm text-gray-600">Loading questions…</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Get to know you</h2>
      <Card>
        <CardBody>
          <form onSubmit={submit} className="grid gap-6">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Gender</h3>
              <div className="flex flex-wrap gap-3">
                {options.genders.map((g) => (
                  <label key={g} className="inline-flex items-center gap-2 text-sm">
                    <input type="radio" name="gender" checked={form.gender === g} onChange={() => setForm((f) => ({ ...f, gender: g }))} />
                    {g}
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Looking for</h3>
              <div className="flex flex-wrap gap-2">
                {options.genders.map((g) => (
                  <button key={g} type="button" onClick={toggle('lookingFor', g)} className={`chip ${form.lookingFor.includes(g) ? 'bg-brand text-white' : ''}`}>{g}</button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Music genres</h3>
              <div className="flex flex-wrap gap-2">
                {options.musicGenres.map((v) => (
                  <button key={v} type="button" onClick={toggle('musicGenres', v)} className={`chip ${form.musicGenres.includes(v) ? 'bg-brand text-white' : ''}`}>{v}</button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Hobbies</h3>
              <div className="flex flex-wrap gap-2">
                {options.hobbies.map((v) => (
                  <button key={v} type="button" onClick={toggle('hobbies', v)} className={`chip ${form.hobbies.includes(v) ? 'bg-brand text-white' : ''}`}>{v}</button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Passions</h3>
              <div className="flex flex-wrap gap-2">
                {options.passions.map((v) => (
                  <button key={v} type="button" onClick={toggle('passions', v)} className={`chip ${form.passions.includes(v) ? 'bg-brand text-white' : ''}`}>{v}</button>
                ))}
              </div>
            </section>

            <section>
              <TextArea label="About you" value={form.about} onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))} rows={4} placeholder="Tell us a bit about yourself" />
            </section>

            <div>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save & Continue'}</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}

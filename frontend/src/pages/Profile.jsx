import { useEffect, useRef, useState } from 'react'
import api from '../utils/api'
import { useAuth } from '../state/AuthContext'
import Card, { CardBody, CardHeader } from '../components/Card'
import { TextArea, TextInput } from '../components/Input'
import Button from '../components/Button'
import Avatar from '../components/Avatar'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({ name: '', age: 18, bio: '', gender: 'other' })
  const [interests, setInterests] = useState({ musicGenres: [], hobbies: [], passions: [], about: '', lookingFor: [] })
  const [options, setOptions] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const singleInputRef = useRef(null)
  const multiInputRef = useRef(null)

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', age: user.age || 18, bio: user.bio || '', gender: user.gender || 'other' })
      setInterests({
        musicGenres: user.profileQuestions?.musicGenres || [],
        hobbies: user.profileQuestions?.hobbies || [],
        passions: user.profileQuestions?.passions || [],
        about: user.profileQuestions?.about || '',
        lookingFor: user.lookingFor || ['male','female','non-binary','other']
      })
      // Initialize photos from user
      setPhotos(Array.isArray(user.photos) ? user.photos : (user.photo ? [user.photo] : []))
    }
  }, [user])

  useEffect(() => {
    api.get('/users/questions/options').then(({ data }) => setOptions(data))
  }, [])

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const toggle = (key, value) => setInterests((s) => {
    const set = new Set(s[key])
    if (set.has(value)) set.delete(value); else set.add(value)
    return { ...s, [key]: Array.from(set) }
  })

  const onSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (photo) fd.append('photo', photo)
    const { data } = await api.put('/users/me', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    setUser(data)
  }

  const uploadPhotos = async (files) => {
    if (!files || !files.length) return
    const fd = new FormData()
    Array.from(files).forEach((f) => fd.append('photos', f))
    setUploading(true)
    try {
      const { data } = await api.put('/users/me/photos', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setUser(data)
      setPhotos(Array.isArray(data.photos) ? data.photos : (data.photo ? [data.photo] : []))
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (p) => {
    try {
      const { data } = await api.delete('/users/me/photos', { params: { path: p } })
      setUser(data)
      setPhotos(Array.isArray(data.photos) ? data.photos : (data.photo ? [data.photo] : []))
    } catch (e) {
      // no-op; could show a toast in the future
      console.error('Failed to delete photo', e)
    }
  }

  const saveInterests = async () => {
    const payload = {
      gender: form.gender,
      lookingFor: interests.lookingFor && interests.lookingFor.length ? interests.lookingFor : ['male','female','non-binary','other'],
      musicGenres: interests.musicGenres,
      hobbies: interests.hobbies,
      passions: interests.passions,
      about: interests.about
    }
    const { data } = await api.post('/users/questions', payload)
    setUser(data)
  }

  if (!user) return null

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">My Profile</h2>
      <div className="flex items-center gap-4">
        <Avatar src={user.photo ? (user.photo.startsWith('http') ? user.photo : import.meta.env.VITE_API_BASE_URL + user.photo) : ''} name={user.name} size={80} />
        <div className="text-sm text-gray-600 dark:text-gray-400">Update your profile and interests to get better matches.</div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Basic info" />
          <CardBody>
            <form onSubmit={onSubmit} className="grid gap-4">
              <TextInput label="Name" value={form.name} onChange={update('name')} />
              <TextInput label="Age" type="number" value={form.age} onChange={update('age')} />
              <TextArea label="Bio" value={form.bio} onChange={update('bio')} />
                {options && (
                <div>
                  <div className="label">Gender</div>
                  <div className="flex flex-wrap gap-2">
                    {options.genders.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, gender: g }))}
                        className={`chip ${form.gender === g
                          ? 'bg-brand text-white hover:bg-brand-dark ring-1 ring-brand/30 dark:ring-brand/40'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-700 ring-1 ring-gray-200 dark:ring-gray-700'} focus:outline-none focus:ring-2 focus:ring-brand/50`}
                      >
                        {g && g.length ? g.charAt(0).toUpperCase() + g.slice(1) : g}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="label">Photo</label>
                <div className="flex items-center gap-3">
                  <input ref={singleInputRef} className="sr-only" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                  <Button type="button" variant="outline" onClick={() => singleInputRef.current?.click()}>Upload photo</Button>
                  {photo && <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[12rem]">{photo.name}</span>}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">JPG or PNG, up to 5MB.</p>
              </div>
              {photos && photos.length ? (
                <div>
                  <div className="label">Your photos</div>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((p, i) => (
                      <div key={i} className="relative group">
                        <img src={p.startsWith('http') ? p : (import.meta.env.VITE_API_BASE_URL + p)} alt="profile" className="h-24 w-full rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm" />
                        <button
                          type="button"
                          aria-label="Remove photo"
                          title="Remove photo"
                          onClick={() => handleDeletePhoto(p)}
                          className="absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white text-sm leading-none shadow hover:bg-black focus:outline-none focus:ring-2 focus:ring-white/80 z-10"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div>
                <label className="label">Add more photos</label>
                <div className="flex items-center gap-3">
                  <input ref={multiInputRef} className="sr-only" type="file" accept="image/*" multiple onChange={(e) => uploadPhotos(e.target.files)} />
                  <Button type="button" variant="outline" onClick={() => multiInputRef.current?.click()}>Add photos</Button>
                  {uploading && <div className="text-xs text-gray-500 dark:text-gray-400">Uploading…</div>}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">You can select multiple files.</p>
              </div>
              <div>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Interests & details" />
          <CardBody>
            {options && (
              <div className="space-y-4">
                <div>
                  <div className="label">Looking for</div>
                  <div className="flex flex-wrap gap-2">
                    {options.genders.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggle('lookingFor', g)}
                        className={`chip ${interests.lookingFor.includes(g)
                          ? 'bg-brand text-white hover:bg-brand-dark ring-1 ring-brand/30 dark:ring-brand/40'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-700 ring-1 ring-gray-200 dark:ring-gray-700'} focus:outline-none focus:ring-2 focus:ring-brand/50`}
                      >
                        {g && g.length ? g.charAt(0).toUpperCase() + g.slice(1) : g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="label">Music</div>
                  <div className="flex flex-wrap gap-2">
                    {options.musicGenres.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => toggle('musicGenres', v)}
                        className={`chip ${interests.musicGenres.includes(v)
                          ? 'bg-brand text-white hover:bg-brand-dark ring-1 ring-brand/30 dark:ring-brand/40'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-700 ring-1 ring-gray-200 dark:ring-gray-700'} focus:outline-none focus:ring-2 focus:ring-brand/50`}
                      >{v}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="label">Hobbies</div>
                  <div className="flex flex-wrap gap-2">
                    {options.hobbies.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => toggle('hobbies', v)}
                        className={`chip ${interests.hobbies.includes(v)
                          ? 'bg-brand text-white hover:bg-brand-dark ring-1 ring-brand/30 dark:ring-brand/40'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-700 ring-1 ring-gray-200 dark:ring-gray-700'} focus:outline-none focus:ring-2 focus:ring-brand/50`}
                      >{v}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="label">Passions</div>
                  <div className="flex flex-wrap gap-2">
                    {options.passions.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => toggle('passions', v)}
                        className={`chip ${interests.passions.includes(v)
                          ? 'bg-brand text-white hover:bg-brand-dark ring-1 ring-brand/30 dark:ring-brand/40'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-700 ring-1 ring-gray-200 dark:ring-gray-700'} focus:outline-none focus:ring-2 focus:ring-brand/50`}
                      >{v}</button>
                    ))}
                  </div>
                </div>
                <TextArea label="About you" value={interests.about} onChange={(e) => setInterests((s) => ({ ...s, about: e.target.value }))} />
                <div>
                  <Button type="button" onClick={saveInterests}>Save interests</Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import Card, { CardBody, CardHeader } from '../components/Card'
import { TextArea, TextInput } from '../components/Input'
import Button from '../components/Button'

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', age: 18, bio: '' })
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (photo) fd.append('photo', photo)
      await register(fd)
      nav('/')
    } catch (e) {
      setError('Registration failed')
    }
  }

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader title="Create your account" subtitle="Join Rizz-A-Lot today" />
        <CardBody>
          <form onSubmit={onSubmit} className="grid gap-4">
            <TextInput label="Name" placeholder="Your name" value={form.name} onChange={update('name')} />
            <TextInput label="Email" placeholder="you@example.com" value={form.email} onChange={update('email')} />
            <TextInput label="Password" type="password" placeholder="••••••••" value={form.password} onChange={update('password')} />
            <TextInput label="Age" type="number" value={form.age} onChange={update('age')} />
            <TextArea label="Bio" placeholder="Tell people about yourself" value={form.bio} onChange={update('bio')} />
            <div>
              <label className="label">Profile photo</label>
              <div className="flex items-center gap-3">
                <input ref={fileInputRef} className="sr-only" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>Upload photo</Button>
                {photo && <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[12rem]">{photo.name}</span>}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">JPG or PNG, up to 5MB.</p>
            </div>
            <Button type="submit" className="w-full">Create account</Button>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </form>
        </CardBody>
      </Card>
    </div>
  )
}

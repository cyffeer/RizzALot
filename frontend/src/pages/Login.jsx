import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import Card, { CardBody, CardHeader } from '../components/Card'
import { TextInput } from '../components/Input'
import Button from '../components/Button'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      nav('/')
    } catch (e) {
      setError('Login failed')
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader title="Welcome back" subtitle="Log in to continue" />
        <CardBody>
          <form onSubmit={onSubmit} className="grid gap-4">
            <TextInput label="Email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextInput label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" className="w-full">Login</Button>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </form>
        </CardBody>
      </Card>
    </div>
  )
}

import { useEffect, useState } from 'react'
import api from '../utils/api'
import { Link } from 'react-router-dom'
import Card, { CardBody } from '../components/Card'
import Avatar from '../components/Avatar'

export default function Matches() {
  const [matches, setMatches] = useState([])

  useEffect(() => {
    api.get('/matches').then(({ data }) => setMatches(data))
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Matches</h2>
      <div className="grid grid-cols-1 gap-3">
        {matches.map((m) => {
          const photo = m.otherUser?.photo ? (m.otherUser.photo.startsWith('http') ? m.otherUser.photo : import.meta.env.VITE_API_BASE_URL + m.otherUser.photo) : ''
          return (
            <Card key={m.id}>
              <CardBody>
                <Link to={`/chat/${m.id}`} className="flex items-center gap-4 no-underline">
                  <Avatar src={photo} name={m.otherUser?.name} size={56} />
                  <div>
                    <div className="text-base font-semibold">{m.otherUser?.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{m.lastMessage || 'Say hi!'}</div>
                  </div>
                </Link>
              </CardBody>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

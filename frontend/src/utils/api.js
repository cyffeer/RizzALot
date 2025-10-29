import axios from 'axios'

// Determine API base URL
// Prefer VITE_API_BASE_URL; in dev, fall back to localhost:5000
const base = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')
const api = axios.create({ baseURL: `${base}/api` })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api

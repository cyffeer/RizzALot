export default function Avatar({ src, name = '', size = 40 }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0,2).join('').toUpperCase()
  const style = { width: size, height: size }
  if (src) {
    return <img src={src} alt={name} className="rounded-full object-cover" style={style} />
  }
  return (
    <div className="rounded-full bg-gray-200 text-gray-700 inline-flex items-center justify-center font-semibold dark:bg-gray-700 dark:text-gray-200" style={style}>
      {initials || 'U'}
    </div>
  )
}

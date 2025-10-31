export default function Card({ children, className='' }) {
  return <div className={`card ${className}`}>{children}</div>
}

export function CardHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
      <div>
        {title && <h3 className="text-base font-semibold">{title}</h3>}
        {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}

export function CardBody({ children, className='' }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>
}

export function CardFooter({ children }) {
  return <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-700">{children}</div>
}

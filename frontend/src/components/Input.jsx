export function Label({ children, className='' }) {
  return <label className={`label ${className}`}>{children}</label>
}

export function TextInput({ label, ...props }) {
  return (
    <div className="space-y-1">
      {label && <Label>{label}</Label>}
      <input className="input" {...props} />
    </div>
  )
}

export function TextArea({ label, rows = 4, ...props }) {
  return (
    <div className="space-y-1">
      {label && <Label>{label}</Label>}
      <textarea rows={rows} className="input" {...props} />
    </div>
  )
}

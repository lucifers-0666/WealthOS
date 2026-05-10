export default function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-sm font-semibold" style={{color:'var(--text-1)'}}>{title}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{color:'var(--text-2)'}}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

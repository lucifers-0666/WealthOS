export default function SectionHeader({ title, sub, right, eyebrow }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
      <div>
        {eyebrow && <div className="section-label" style={{ marginBottom: 6 }}>{eyebrow}</div>}
        <div className="editorial-title" style={{ fontSize: 16, lineHeight: 1.15 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: '#64748B', marginTop: 5 }}>{sub}</div>}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  )
}

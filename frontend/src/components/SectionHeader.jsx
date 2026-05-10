export default function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
      <div>
        <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:14, color:'#F8FAFC', marginBottom:2 }}>{title}</h2>
        {subtitle && <p style={{ fontSize:12, color:'#94A3B8' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

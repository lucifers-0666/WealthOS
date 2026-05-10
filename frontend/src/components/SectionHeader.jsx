export default function SectionHeader({ title, sub, right }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
      <div>
        <div style={{ fontFamily:'Space Grotesk', fontWeight:600, fontSize:15, color:'#F8FAFC' }}>{title}</div>
        {sub && <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>{sub}</div>}
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}

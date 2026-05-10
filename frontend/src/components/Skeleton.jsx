export default function Skeleton({ h = 16, w = '100%', r = 6, mb = 0 }) {
  return <div className="skeleton" style={{ height:h, width:w, borderRadius:r, marginBottom:mb }} />
}

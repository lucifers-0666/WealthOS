export default function Skeleton({ h=16, w='100%', style={} }) {
  return <div className="skeleton" style={{ height:h, width:w, ...style }} />
}

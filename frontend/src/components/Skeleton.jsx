export function SkeletonLine({ w='100%', h=14 }) {
  return <div className="skeleton" style={{width:w, height:h, marginBottom:8}} />
}
export function SkeletonCard({ h=120 }) {
  return <div className="card-flat p-5" style={{height:h}}><SkeletonLine w="40%" h={12}/><SkeletonLine w="70%" h={24}/><SkeletonLine w="55%" h={11}/></div>
}

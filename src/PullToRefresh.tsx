export default function PullToRefresh({ pull }: { pull: number }) {
  if (pull < 16) return null
  return (
    <div className="app-pull" role="status">
      {pull > 72 ? 'Release to refresh' : 'Pull to refresh'}
    </div>
  )
}

export default function MetricCard({ label, value, sub, type }) {
  const valueClass = type === 'positive' ? 'positive' :
                     type === 'negative' ? 'negative' : ''

  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${valueClass}`}>{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  )
}

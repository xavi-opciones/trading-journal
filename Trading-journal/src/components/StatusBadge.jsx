export default function StatusBadge({ status }) {
  const map = {
    open: 'badge-green',
    closed: 'badge-gray',
    expired: 'badge-yellow',
  }

  return (
    <span className={`badge ${map[status] || 'badge-gray'}`}>
      <span className={`status-dot ${status}`} />
      {status}
    </span>
  )
}

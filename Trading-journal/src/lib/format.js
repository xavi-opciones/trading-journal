export function formatCurrency(value, decimals = 2) {
  const num = Number(value) || 0
  const prefix = num >= 0 ? '' : '-'
  return `${prefix}$${Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

export function formatPercent(value, decimals = 1) {
  const num = Number(value) || 0
  return `${num >= 0 ? '+' : ''}${num.toFixed(decimals)}%`
}

export function formatNumber(value, decimals = 0) {
  const num = Number(value) || 0
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function pnlColor(value) {
  const num = Number(value) || 0
  if (num > 0) return 'positive'
  if (num < 0) return 'negative'
  return ''
}

export function pnlTextColor(value) {
  const num = Number(value) || 0
  if (num > 0) return 'text-green'
  if (num < 0) return 'text-red'
  return 'text-muted'
}

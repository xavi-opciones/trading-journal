import { STRATEGY_COLORS } from '../lib/constants'

export default function StrategyBadge({ strategy }) {
  const color = STRATEGY_COLORS[strategy] || '#6b7280'

  return (
    <span
      className="strategy-tag"
      style={{
        background: `${color}15`,
        color: color,
      }}
    >
      {strategy}
    </span>
  )
}

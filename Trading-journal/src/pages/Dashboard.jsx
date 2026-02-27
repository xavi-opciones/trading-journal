import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Target, DollarSign,
  BarChart3, Percent, Award, Activity,
} from 'lucide-react'
import { useTrades } from '../context/TradeContext'
import { calculateMetrics, buildEquityCurve, analyzeByStrategy } from '../lib/calculations'
import { formatCurrency, formatPercent, formatNumber, pnlColor } from '../lib/format'
import MetricCard from '../components/MetricCard'
import { STRATEGY_COLORS } from '../lib/constants'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
        {formatCurrency(data.equity)}
      </div>
      {data.pnl !== undefined && data.pnl !== 0 && (
        <div style={{ color: data.pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 11, marginTop: 2 }}>
          {data.pnl >= 0 ? '+' : ''}{formatCurrency(data.pnl)}
          {data.underlying && ` · ${data.underlying}`}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { trades, baseCapital, loading } = useTrades()

  const metrics = useMemo(() => calculateMetrics(trades, baseCapital), [trades, baseCapital])
  const equityCurve = useMemo(() => buildEquityCurve(trades, baseCapital), [trades, baseCapital])
  const strategyData = useMemo(() => analyzeByStrategy(trades), [trades])

  const pieData = strategyData.map(s => ({
    name: s.strategy,
    value: s.count,
    color: STRATEGY_COLORS[s.strategy] || '#6b7280',
  }))

  if (loading) {
    return (
      <div className="empty-state">
        <Activity size={32} />
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Portfolio overview and performance metrics</p>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <MetricCard
          label="Total P&L"
          value={formatCurrency(metrics.totalRealizedPnL)}
          type={pnlColor(metrics.totalRealizedPnL)}
          sub={`Unrealized: ${formatCurrency(metrics.totalUnrealizedPnL)}`}
        />
        <MetricCard
          label="Win Rate"
          value={`${metrics.winRate.toFixed(1)}%`}
          type={metrics.winRate >= 50 ? 'positive' : metrics.winRate > 0 ? 'negative' : ''}
          sub={`${metrics.wins}W / ${metrics.losses}L`}
        />
        <MetricCard
          label="Profit Factor"
          value={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
          type={metrics.profitFactor >= 1 ? 'positive' : 'negative'}
          sub="Gross wins / Gross losses"
        />
        <MetricCard
          label="Return on Capital"
          value={formatPercent(metrics.returnOnCapital)}
          type={pnlColor(metrics.returnOnCapital)}
          sub={`Base: ${formatCurrency(metrics.baseCapital, 0)}`}
        />
        <MetricCard
          label="Current Capital"
          value={formatCurrency(metrics.currentCapital, 0)}
          type={pnlColor(metrics.currentCapital - metrics.baseCapital)}
          sub={`Available: ${formatCurrency(metrics.availableCapital, 0)}`}
        />
        <MetricCard
          label="Open Positions"
          value={formatNumber(metrics.openTrades)}
          sub={`Collateral: ${formatCurrency(metrics.totalCollateral, 0)}`}
        />
        <MetricCard
          label="Avg Win"
          value={formatCurrency(metrics.avgWin)}
          type="positive"
        />
        <MetricCard
          label="Avg Loss"
          value={formatCurrency(metrics.avgLoss)}
          type="negative"
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Equity Curve */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={16} color="var(--accent-green)" />
              Equity Curve
            </div>
          </div>
          {equityCurve.length > 1 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equityCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                  <XAxis
                    dataKey="date"
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="equity"
                    stroke="var(--accent-green)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: 'var(--accent-green)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              <TrendingUp size={24} />
              <p>Close trades to build your equity curve</p>
            </div>
          )}
        </div>

        {/* Strategy Distribution */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <BarChart3 size={16} color="var(--accent-purple)" />
              By Strategy
            </div>
          </div>
          {pieData.length > 0 ? (
            <div className="chart-container" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              <BarChart3 size={24} />
              <p>No trades yet</p>
            </div>
          )}
          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
            {pieData.map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: 2,
                  background: item.color, flexShrink: 0
                }} />
                <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{item.name}</span>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategy P&L Breakdown */}
      {strategyData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Award size={16} color="var(--accent-yellow)" />
              Strategy Performance
            </div>
          </div>
          <div className="chart-container" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis
                  type="number"
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickFormatter={v => `$${v.toLocaleString()}`}
                />
                <YAxis
                  type="category"
                  dataKey="strategy"
                  stroke="var(--text-muted)"
                  fontSize={11}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 12,
                  }}
                  formatter={v => formatCurrency(v)}
                />
                <Bar dataKey="totalPnL" radius={[0, 4, 4, 0]}>
                  {strategyData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.totalPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

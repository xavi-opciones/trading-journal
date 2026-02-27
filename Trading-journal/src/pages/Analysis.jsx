import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
  LineChart, Line, ScatterChart, Scatter, ZAxis,
} from 'recharts'
import { BarChart3, TrendingUp, Target, Calendar, Layers } from 'lucide-react'
import { useTrades } from '../context/TradeContext'
import {
  analyzeByUnderlying, analyzeByStrategy,
  buildEquityCurve, calculateMetrics,
} from '../lib/calculations'
import { formatCurrency, formatPercent, pnlTextColor } from '../lib/format'
import { STRATEGY_COLORS } from '../lib/constants'
import StrategyBadge from '../components/StrategyBadge'

function ChartTooltip({ active, payload }) {
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
      <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>
        {data.underlying || data.strategy || data.month}
      </div>
      <div style={{ color: data.totalPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
        P&L: {formatCurrency(data.totalPnL || data.pnl || 0)}
      </div>
      {data.winRate !== undefined && (
        <div style={{ color: 'var(--text-secondary)' }}>
          Win Rate: {data.winRate.toFixed(1)}%
        </div>
      )}
      {data.count !== undefined && (
        <div style={{ color: 'var(--text-muted)' }}>Trades: {data.count}</div>
      )}
    </div>
  )
}

export default function Analysis() {
  const { trades, baseCapital } = useTrades()
  const [tab, setTab] = useState('underlying')

  const underlyingData = useMemo(() => analyzeByUnderlying(trades), [trades])
  const strategyData = useMemo(() => analyzeByStrategy(trades), [trades])
  const metrics = useMemo(() => calculateMetrics(trades, baseCapital), [trades, baseCapital])

  // Monthly P&L
  const monthlyPnL = useMemo(() => {
    const closedTrades = trades.filter(t =>
      (t.status === 'closed' || t.status === 'expired') && t.close_date
    )

    const groups = {}
    closedTrades.forEach(t => {
      const month = t.close_date.substring(0, 7) // YYYY-MM
      if (!groups[month]) groups[month] = { month, pnl: 0, count: 0 }
      groups[month].pnl += Number(t.realized_pnl) || 0
      groups[month].count++
    })

    return Object.values(groups).sort((a, b) => a.month.localeCompare(b.month))
  }, [trades])

  // Days held distribution
  const daysHeldData = useMemo(() => {
    return trades
      .filter(t => t.open_date && t.close_date)
      .map(t => {
        const open = new Date(t.open_date)
        const close = new Date(t.close_date)
        const days = Math.round((close - open) / (1000 * 60 * 60 * 24))
        return {
          days,
          pnl: Number(t.realized_pnl) || 0,
          underlying: t.underlying,
          strategy: t.strategy,
        }
      })
  }, [trades])

  const tabs = [
    { id: 'underlying', label: 'By Underlying', icon: Target },
    { id: 'strategy', label: 'By Strategy', icon: Layers },
    { id: 'monthly', label: 'Monthly P&L', icon: Calendar },
    { id: 'duration', label: 'Duration Analysis', icon: BarChart3 },
  ]

  return (
    <div>
      <div className="page-header">
        <h2>Analysis</h2>
        <p>Deep dive into your trading performance</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2" style={{ marginBottom: 20 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(t.id)}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* By Underlying */}
      {tab === 'underlying' && (
        <div>
          {/* Chart */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div className="card-title">
                <Target size={16} color="var(--accent-blue)" />
                P&L by Underlying
              </div>
            </div>
            {underlyingData.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={underlyingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                    <XAxis dataKey="underlying" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={v => `$${v}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="totalPnL" radius={[4, 4, 0, 0]}>
                      {underlyingData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.totalPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state">
                <BarChart3 size={24} />
                <p>No trade data to analyze</p>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>Underlying</th>
                  <th style={{ textAlign: 'right' }}>Trades</th>
                  <th style={{ textAlign: 'right' }}>Wins</th>
                  <th style={{ textAlign: 'right' }}>Losses</th>
                  <th style={{ textAlign: 'right' }}>Win Rate</th>
                  <th style={{ textAlign: 'right' }}>Total P&L</th>
                </tr>
              </thead>
              <tbody>
                {underlyingData.map(row => (
                  <tr key={row.underlying}>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{row.underlying}</strong></td>
                    <td className="mono" style={{ textAlign: 'right' }}>{row.count}</td>
                    <td className="mono text-green" style={{ textAlign: 'right' }}>{row.wins}</td>
                    <td className="mono text-red" style={{ textAlign: 'right' }}>{row.losses}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>
                      <span className={pnlTextColor(row.winRate - 50)}>
                        {row.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="mono" style={{ textAlign: 'right' }}>
                      <span className={pnlTextColor(row.totalPnL)} style={{ fontWeight: 600 }}>
                        {formatCurrency(row.totalPnL)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* By Strategy */}
      {tab === 'strategy' && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div className="card-title">
                <Layers size={16} color="var(--accent-purple)" />
                P&L by Strategy
              </div>
            </div>
            {strategyData.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={strategyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                    <XAxis dataKey="strategy" stroke="var(--text-muted)" fontSize={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={v => `$${v}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="totalPnL" radius={[4, 4, 0, 0]}>
                      {strategyData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={STRATEGY_COLORS[entry.strategy] || '#6b7280'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state">
                <Layers size={24} />
                <p>No trade data to analyze</p>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>Strategy</th>
                  <th style={{ textAlign: 'right' }}>Trades</th>
                  <th style={{ textAlign: 'right' }}>Wins</th>
                  <th style={{ textAlign: 'right' }}>Losses</th>
                  <th style={{ textAlign: 'right' }}>Win Rate</th>
                  <th style={{ textAlign: 'right' }}>Total P&L</th>
                </tr>
              </thead>
              <tbody>
                {strategyData.map(row => (
                  <tr key={row.strategy}>
                    <td><StrategyBadge strategy={row.strategy} /></td>
                    <td className="mono" style={{ textAlign: 'right' }}>{row.count}</td>
                    <td className="mono text-green" style={{ textAlign: 'right' }}>{row.wins}</td>
                    <td className="mono text-red" style={{ textAlign: 'right' }}>{row.losses}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>
                      <span className={pnlTextColor(row.winRate - 50)}>
                        {row.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="mono" style={{ textAlign: 'right' }}>
                      <span className={pnlTextColor(row.totalPnL)} style={{ fontWeight: 600 }}>
                        {formatCurrency(row.totalPnL)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly P&L */}
      {tab === 'monthly' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Calendar size={16} color="var(--accent-cyan)" />
              Monthly P&L
            </div>
          </div>
          {monthlyPnL.length > 0 ? (
            <>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyPnL}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={v => `$${v}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {monthlyPnL.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Summary table */}
              <div style={{ marginTop: 16, overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th style={{ textAlign: 'right' }}>Trades</th>
                      <th style={{ textAlign: 'right' }}>P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyPnL.map(row => (
                      <tr key={row.month}>
                        <td className="mono">{row.month}</td>
                        <td className="mono" style={{ textAlign: 'right' }}>{row.count}</td>
                        <td className="mono" style={{ textAlign: 'right' }}>
                          <span className={pnlTextColor(row.pnl)} style={{ fontWeight: 600 }}>
                            {formatCurrency(row.pnl)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Calendar size={24} />
              <p>Close trades to see monthly performance</p>
            </div>
          )}
        </div>
      )}

      {/* Duration Analysis */}
      {tab === 'duration' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <BarChart3 size={16} color="var(--accent-yellow)" />
              P&L vs Days Held
            </div>
          </div>
          {daysHeldData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                  <XAxis
                    dataKey="days"
                    name="Days"
                    stroke="var(--text-muted)"
                    fontSize={11}
                    label={{ value: 'Days Held', position: 'bottom', fill: 'var(--text-muted)', fontSize: 11 }}
                  />
                  <YAxis
                    dataKey="pnl"
                    name="P&L"
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickFormatter={v => `$${v}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: 'var(--radius-md)',
                          padding: '10px 14px',
                          fontSize: 12,
                        }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {d.underlying} - {d.strategy}
                          </div>
                          <div style={{ color: 'var(--text-secondary)' }}>Days: {d.days}</div>
                          <div style={{ color: d.pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                            P&L: {formatCurrency(d.pnl)}
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Scatter data={daysHeldData} fill="var(--accent-blue)">
                    {daysHeldData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              <BarChart3 size={24} />
              <p>Close trades to see duration analysis</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

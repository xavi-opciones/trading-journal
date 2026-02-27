import { useState, useMemo } from 'react'
import {
  FolderOpen, Edit3, Trash2, Eye, Filter,
  ChevronDown, ArrowUpDown, Search,
} from 'lucide-react'
import { useTrades } from '../context/TradeContext'
import { calculateUnrealizedPnL } from '../lib/calculations'
import { formatCurrency, formatDate, pnlTextColor } from '../lib/format'
import StrategyBadge from '../components/StrategyBadge'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import NewTrade from './NewTrade'

export default function Positions() {
  const { trades, removeTrade, loading } = useTrades()
  const [filter, setFilter] = useState('all') // all, open, closed, expired
  const [search, setSearch] = useState('')
  const [editingTrade, setEditingTrade] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [sortField, setSortField] = useState('open_date')
  const [sortDir, setSortDir] = useState('desc')

  const filtered = useMemo(() => {
    let result = trades

    if (filter !== 'all') {
      result = result.filter(t => t.status === filter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(t =>
        t.underlying?.toLowerCase().includes(q) ||
        t.strategy?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        t.tags?.toLowerCase().includes(q)
      )
    }

    result = [...result].sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      if (sortField === 'open_date' || sortField === 'expiration_date') {
        aVal = aVal ? new Date(aVal) : new Date(0)
        bVal = bVal ? new Date(bVal) : new Date(0)
      } else {
        aVal = Number(aVal) || 0
        bVal = Number(bVal) || 0
      }

      if (sortDir === 'asc') return aVal > bVal ? 1 : -1
      return aVal < bVal ? 1 : -1
    })

    return result
  }, [trades, filter, search, sortField, sortDir])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const handleDelete = async () => {
    if (deletingId) {
      await removeTrade(deletingId)
      setDeletingId(null)
    }
  }

  const getPnL = (trade) => {
    if (trade.status === 'closed' || trade.status === 'expired') {
      return Number(trade.realized_pnl) || 0
    }
    return calculateUnrealizedPnL(trade)
  }

  if (loading) {
    return (
      <div className="empty-state">
        <FolderOpen size={32} />
        <p>Loading positions...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2>Positions</h2>
        <p>All trades and positions</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={16} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search trades..."
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px 8px 32px',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>

        <div className="flex gap-2">
          {['all', 'open', 'closed', 'expired'].map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span style={{ marginLeft: 4, opacity: 0.7 }}>
                  {trades.filter(t => t.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <FolderOpen size={32} />
            <p>{trades.length === 0 ? 'No trades recorded yet' : 'No matching trades'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('open_date')} style={{ cursor: 'pointer' }}>
                    Date <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                  </th>
                  <th>Underlying</th>
                  <th>Strategy</th>
                  <th>Status</th>
                  <th>Strikes</th>
                  <th style={{ textAlign: 'right' }}>Contracts</th>
                  <th style={{ textAlign: 'right' }}>Premium</th>
                  <th style={{ textAlign: 'right' }} onClick={() => handleSort('realized_pnl')} className="pointer">
                    P&L <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                  </th>
                  <th>Exp Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(trade => {
                  const pnl = getPnL(trade)
                  const isOpen = trade.status === 'open'

                  return (
                    <tr key={trade.id}>
                      <td className="mono">{formatDate(trade.open_date)}</td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {trade.underlying}
                        </strong>
                      </td>
                      <td><StrategyBadge strategy={trade.strategy} /></td>
                      <td><StatusBadge status={trade.status} /></td>
                      <td className="mono">
                        {trade.short_strike && `${trade.short_strike}`}
                        {trade.long_strike && ` / ${trade.long_strike}`}
                        {trade.short_call_strike && ` | ${trade.short_call_strike}`}
                        {trade.long_call_strike && ` / ${trade.long_call_strike}`}
                      </td>
                      <td className="mono" style={{ textAlign: 'right' }}>{trade.contracts}</td>
                      <td className="mono" style={{ textAlign: 'right' }}>
                        ${Number(trade.premium_received).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`mono ${pnlTextColor(pnl)}`} style={{ fontWeight: 600 }}>
                          {formatCurrency(pnl)}
                        </span>
                        {isOpen && (
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>
                            unrealized
                          </span>
                        )}
                      </td>
                      <td className="mono">{formatDate(trade.expiration_date)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-icon btn-ghost btn-sm"
                            title="Edit"
                            onClick={() => setEditingTrade(trade)}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="btn btn-icon btn-ghost btn-sm"
                            title="Delete"
                            onClick={() => setDeletingId(trade.id)}
                            style={{ color: 'var(--accent-red)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingTrade && (
        <NewTrade
          editTrade={editingTrade}
          onClose={() => setEditingTrade(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <ConfirmDialog
          title="Delete Trade"
          message="Are you sure you want to delete this trade? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  )
}

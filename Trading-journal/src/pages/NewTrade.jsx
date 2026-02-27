import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, X, ChevronDown } from 'lucide-react'
import { useTrades } from '../context/TradeContext'
import { STRATEGIES, COMMON_UNDERLYINGS } from '../lib/constants'
import { calculateMaxLoss, calculateRealizedPnL } from '../lib/calculations'

const defaultTrade = {
  underlying: '',
  strategy: 'Bull Put Spread',
  status: 'open',
  open_date: new Date().toISOString().split('T')[0],
  expiration_date: '',
  close_date: '',
  short_strike: '',
  long_strike: '',
  short_call_strike: '',
  long_call_strike: '',
  contracts: 1,
  premium_received: '',
  premium_paid: '',
  commission: '',
  close_price: '',
  current_price: '',
  collateral: '',
  notes: '',
  tags: '',
}

export default function NewTrade({ editTrade: existingTrade, onClose }) {
  const navigate = useNavigate()
  const { addTrade, editTrade } = useTrades()
  const isEditing = !!existingTrade

  const [form, setForm] = useState(
    isEditing
      ? { ...defaultTrade, ...existingTrade }
      : { ...defaultTrade }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const isIronCondor = form.strategy === 'Iron Condor'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.underlying.trim()) {
      setError('Underlying symbol is required')
      return
    }
    if (!form.open_date) {
      setError('Open date is required')
      return
    }

    setSaving(true)
    try {
      const tradeData = {
        underlying: form.underlying.toUpperCase().trim(),
        strategy: form.strategy,
        status: form.status,
        open_date: form.open_date,
        expiration_date: form.expiration_date || null,
        close_date: form.close_date || null,
        short_strike: form.short_strike ? Number(form.short_strike) : null,
        long_strike: form.long_strike ? Number(form.long_strike) : null,
        short_call_strike: form.short_call_strike ? Number(form.short_call_strike) : null,
        long_call_strike: form.long_call_strike ? Number(form.long_call_strike) : null,
        contracts: Number(form.contracts) || 1,
        premium_received: Number(form.premium_received) || 0,
        premium_paid: Number(form.premium_paid) || 0,
        commission: Number(form.commission) || 0,
        close_price: Number(form.close_price) || 0,
        current_price: Number(form.current_price) || 0,
        collateral: Number(form.collateral) || 0,
        notes: form.notes,
        tags: form.tags,
      }

      // Auto-calculate max loss
      tradeData.max_loss = calculateMaxLoss(tradeData)

      // Auto-calculate realized P&L for closed trades
      if (tradeData.status === 'closed' || tradeData.status === 'expired') {
        tradeData.realized_pnl = calculateRealizedPnL(tradeData)
      } else {
        tradeData.realized_pnl = 0
      }

      if (isEditing) {
        await editTrade(existingTrade.id, tradeData)
      } else {
        await addTrade(tradeData)
      }

      if (onClose) {
        onClose()
      } else {
        navigate('/positions')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const content = (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{
          background: 'var(--accent-red-bg)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          marginBottom: 16,
          color: 'var(--accent-red)',
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Row 1: Core info */}
      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label>Underlying *</label>
          <input
            list="underlyings-list"
            value={form.underlying}
            onChange={e => update('underlying', e.target.value)}
            placeholder="SPY, AAPL..."
            style={{ textTransform: 'uppercase' }}
          />
          <datalist id="underlyings-list">
            {COMMON_UNDERLYINGS.map(u => <option key={u} value={u} />)}
          </datalist>
        </div>

        <div className="form-group">
          <label>Strategy</label>
          <select value={form.strategy} onChange={e => update('strategy', e.target.value)}>
            {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Status</label>
          <select value={form.status} onChange={e => update('status', e.target.value)}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div className="form-group">
          <label>Contracts</label>
          <input
            type="number"
            min="1"
            value={form.contracts}
            onChange={e => update('contracts', e.target.value)}
          />
        </div>
      </div>

      {/* Row 2: Dates */}
      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label>Open Date *</label>
          <input
            type="date"
            value={form.open_date}
            onChange={e => update('open_date', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Expiration Date</label>
          <input
            type="date"
            value={form.expiration_date}
            onChange={e => update('expiration_date', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Close Date</label>
          <input
            type="date"
            value={form.close_date}
            onChange={e => update('close_date', e.target.value)}
          />
        </div>
      </div>

      {/* Row 3: Strikes */}
      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label>Short Strike (Put)</label>
          <input
            type="number"
            step="0.5"
            value={form.short_strike}
            onChange={e => update('short_strike', e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="form-group">
          <label>Long Strike (Put)</label>
          <input
            type="number"
            step="0.5"
            value={form.long_strike}
            onChange={e => update('long_strike', e.target.value)}
            placeholder="0.00"
          />
        </div>
        {isIronCondor && (
          <>
            <div className="form-group">
              <label>Short Strike (Call)</label>
              <input
                type="number"
                step="0.5"
                value={form.short_call_strike}
                onChange={e => update('short_call_strike', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>Long Strike (Call)</label>
              <input
                type="number"
                step="0.5"
                value={form.long_call_strike}
                onChange={e => update('long_call_strike', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </>
        )}
      </div>

      {/* Row 4: Premiums */}
      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label>Premium Received (per share)</label>
          <input
            type="number"
            step="0.01"
            value={form.premium_received}
            onChange={e => update('premium_received', e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="form-group">
          <label>Close Price (per share)</label>
          <input
            type="number"
            step="0.01"
            value={form.close_price}
            onChange={e => update('close_price', e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="form-group">
          <label>Commission</label>
          <input
            type="number"
            step="0.01"
            value={form.commission}
            onChange={e => update('commission', e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="form-group">
          <label>Collateral / Margin</label>
          <input
            type="number"
            step="1"
            value={form.collateral}
            onChange={e => update('collateral', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      {/* Current Price for open positions */}
      {form.status === 'open' && (
        <div className="form-grid" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label>Current Mark Price (per share)</label>
            <input
              type="number"
              step="0.01"
              value={form.current_price}
              onChange={e => update('current_price', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
      )}

      {/* Notes & Tags */}
      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label>Notes</label>
          <textarea
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            placeholder="Trade reasoning, market conditions, lessons learned..."
          />
        </div>
      </div>

      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label>Tags (comma-separated)</label>
          <input
            value={form.tags}
            onChange={e => update('tags', e.target.value)}
            placeholder="earnings, high-iv, weekly..."
          />
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
        {onClose && (
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            <X size={16} /> Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save size={16} />
          {saving ? 'Saving...' : isEditing ? 'Update Trade' : 'Save Trade'}
        </button>
      </div>
    </form>
  )

  // If used as modal (editing), wrap in modal
  if (onClose) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{isEditing ? 'Edit Trade' : 'New Trade'}</h3>
            <button className="btn btn-icon btn-ghost" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
          {content}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2>{isEditing ? 'Edit Trade' : 'New Trade'}</h2>
        <p>Record a new options trade</p>
      </div>
      <div className="card">
        {content}
      </div>
    </div>
  )
}

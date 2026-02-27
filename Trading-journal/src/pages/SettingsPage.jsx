import { useState } from 'react'
import { Settings, DollarSign, Database, Wifi, Save, RefreshCw, AlertCircle } from 'lucide-react'
import { useTrades } from '../context/TradeContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { formatCurrency } from '../lib/format'

export default function SettingsPage() {
  const { baseCapital, setBaseCapital, trades, reload } = useTrades()
  const [capitalInput, setCapitalInput] = useState(String(baseCapital))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const connected = isSupabaseConfigured()

  const handleSaveCapital = async () => {
    const value = Number(capitalInput)
    if (isNaN(value) || value <= 0) return

    setSaving(true)
    try {
      await setBaseCapital(value)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Failed to save capital:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleExport = () => {
    const data = JSON.stringify(trades, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trading-journal-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target.result)
        if (Array.isArray(imported)) {
          // Save to localStorage as a batch
          const existing = JSON.parse(localStorage.getItem('trading_journal_trades') || '[]')
          const merged = [...imported, ...existing]
          localStorage.setItem('trading_journal_trades', JSON.stringify(merged))
          await reload()
          alert(`Imported ${imported.length} trades successfully.`)
        }
      } catch (err) {
        alert('Invalid JSON file.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Settings</h2>
        <p>Configure your trading journal</p>
      </div>

      {/* Base Capital */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">
            <DollarSign size={16} color="var(--accent-green)" />
            Base Capital
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
          Set your initial trading capital. This is used to calculate return on capital and available buying power.
        </p>
        <div className="flex items-center gap-3">
          <div className="form-group" style={{ flex: 1, maxWidth: 300 }}>
            <label>Amount (USD)</label>
            <input
              type="number"
              min="0"
              step="100"
              value={capitalInput}
              onChange={e => setCapitalInput(e.target.value)}
              style={{ fontFamily: 'JetBrains Mono' }}
            />
          </div>
          <button
            className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}
            onClick={handleSaveCapital}
            disabled={saving}
            style={{ marginTop: 24 }}
          >
            <Save size={16} />
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          Current: {formatCurrency(baseCapital, 0)}
        </div>
      </div>

      {/* Database Connection */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">
            {connected ? <Wifi size={16} color="var(--accent-green)" /> : <Database size={16} color="var(--accent-yellow)" />}
            Database
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          background: connected ? 'var(--accent-green-bg)' : 'var(--accent-yellow-bg)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 12,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connected ? 'var(--accent-green)' : 'var(--accent-yellow)',
            boxShadow: connected ? '0 0 6px var(--accent-green)' : '0 0 6px var(--accent-yellow)',
          }} />
          <span style={{
            color: connected ? 'var(--accent-green)' : 'var(--accent-yellow)',
            fontSize: 13, fontWeight: 600,
          }}>
            {connected ? 'Connected to Supabase' : 'Using Local Storage'}
          </span>
        </div>
        {!connected && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: 8 }}>
              To connect to Supabase, create a <code style={{ color: 'var(--accent-blue)' }}>.env</code> file in the project root with:
            </p>
            <pre style={{
              background: 'var(--bg-input)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              fontFamily: 'JetBrains Mono',
              color: 'var(--accent-green)',
              overflow: 'auto',
            }}>
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
            </pre>
            <p style={{ marginTop: 8 }}>
              Then run the SQL schema in <code style={{ color: 'var(--accent-blue)' }}>supabase-schema.sql</code> in your Supabase SQL editor.
            </p>
          </div>
        )}
      </div>

      {/* Data Management */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">
            <Database size={16} color="var(--accent-blue)" />
            Data Management
          </div>
        </div>
        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={handleExport}>
            Export Trades (JSON)
          </button>
          <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
            Import Trades (JSON)
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
          <button className="btn btn-ghost" onClick={reload}>
            <RefreshCw size={14} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <AlertCircle size={16} color="var(--text-muted)" />
            About
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <p><strong>TradeLog</strong> - Options Trading Journal</p>
          <p>Track Bull Put Spreads, Bear Call Spreads, Iron Condors, Wheel, and Covered Call strategies.</p>
          <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 12 }}>
            P&L Formula: (Premium Received - Close Price) &times; 100 &times; Contracts - Commission
          </p>
        </div>
      </div>
    </div>
  )
}

import { supabase, isSupabaseConfigured } from './supabase'

// ─── Local Storage Fallback ──────────────────────────────────
const LOCAL_TRADES_KEY = 'trading_journal_trades'
const LOCAL_SETTINGS_KEY = 'trading_journal_settings'

function getLocalTrades() {
  const data = localStorage.getItem(LOCAL_TRADES_KEY)
  return data ? JSON.parse(data) : []
}

function saveLocalTrades(trades) {
  localStorage.setItem(LOCAL_TRADES_KEY, JSON.stringify(trades))
}

function getLocalSettings() {
  const data = localStorage.getItem(LOCAL_SETTINGS_KEY)
  return data ? JSON.parse(data) : { base_capital: '21000' }
}

function saveLocalSettings(settings) {
  localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings))
}

// ─── Trades API ──────────────────────────────────────────────
export async function fetchTrades() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('open_date', { ascending: false })
    if (error) throw error
    return data
  }
  return getLocalTrades()
}

export async function fetchTradesByStatus(status) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('status', status)
      .order('open_date', { ascending: false })
    if (error) throw error
    return data
  }
  return getLocalTrades().filter(t => t.status === status)
}

export async function createTrade(trade) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('trades')
      .insert([trade])
      .select()
      .single()
    if (error) throw error
    return data
  }
  const trades = getLocalTrades()
  const newTrade = {
    ...trade,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  trades.unshift(newTrade)
  saveLocalTrades(trades)
  return newTrade
}

export async function updateTrade(id, updates) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('trades')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const trades = getLocalTrades()
  const idx = trades.findIndex(t => t.id === id)
  if (idx === -1) throw new Error('Trade not found')
  trades[idx] = { ...trades[idx], ...updates, updated_at: new Date().toISOString() }
  saveLocalTrades(trades)
  return trades[idx]
}

export async function deleteTrade(id) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id)
    if (error) throw error
    return
  }
  const trades = getLocalTrades().filter(t => t.id !== id)
  saveLocalTrades(trades)
}

// ─── Settings API ────────────────────────────────────────────
export async function fetchSettings() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
    if (error) throw error
    const settings = {}
    data.forEach(row => { settings[row.key] = row.value })
    return settings
  }
  return getLocalSettings()
}

export async function updateSetting(key, value) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value: String(value) }, { onConflict: 'key' })
    if (error) throw error
    return
  }
  const settings = getLocalSettings()
  settings[key] = String(value)
  saveLocalSettings(settings)
}

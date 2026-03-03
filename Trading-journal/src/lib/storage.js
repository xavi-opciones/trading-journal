import { supabase } from './supabase'

// ─── Trades API ──────────────────────────────────────────────
export async function fetchTrades() {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .order('open_date', { ascending: false })
  
  if (error) throw error
  return data
}

export async function fetchTradesByStatus(status) {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('status', status)
    .order('open_date', { ascending: false })
  
  if (error) throw error
  return data
}

export async function createTrade(trade) {
  // Omitimos el id (si viene vacío o no es UUID válido) para que Supabase lo genere
  const { id, ...tradeData } = trade;
  const { data, error } = await supabase
    .from('trades')
    .insert([tradeData])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateTrade(id, updates) {
  const { data, error } = await supabase
    .from('trades')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteTrade(id) {
  const { error } = await supabase
    .from('trades')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

// ─── Settings API ────────────────────────────────────────────
export async function fetchSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
  
  if (error) throw error
  
  const settings = {}
  data.forEach(row => { settings[row.key] = row.value })
  
  // Si no hay configuración inicial en base de datos, retornamos un default
  if (!settings.base_capital) {
    settings.base_capital = '21000'
  }
  
  return settings
}

export async function updateSetting(key, value) {
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value: String(value) }, { onConflict: 'key' })
  
  if (error) throw error
  return true
}

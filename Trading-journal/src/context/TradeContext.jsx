import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { fetchTrades, createTrade, updateTrade, deleteTrade, fetchSettings, updateSetting } from '../lib/storage'

const TradeContext = createContext(null)

export function TradeProvider({ children }) {
  const [trades, setTrades] = useState([])
  const [settings, setSettings] = useState({ base_capital: '21000' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const baseCapital = Number(settings.base_capital) || 21000

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [tradesData, settingsData] = await Promise.all([
        fetchTrades(),
        fetchSettings(),
      ])
      setTrades(tradesData)
      setSettings(settingsData)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addTrade = async (trade) => {
    const newTrade = await createTrade(trade)
    setTrades(prev => [newTrade, ...prev])
    return newTrade
  }

  const editTrade = async (id, updates) => {
    const updated = await updateTrade(id, updates)
    setTrades(prev => prev.map(t => t.id === id ? updated : t))
    return updated
  }

  const removeTrade = async (id) => {
    await deleteTrade(id)
    setTrades(prev => prev.filter(t => t.id !== id))
  }

  const setBaseCapital = async (value) => {
    await updateSetting('base_capital', value)
    setSettings(prev => ({ ...prev, base_capital: String(value) }))
  }

  return (
    <TradeContext.Provider value={{
      trades,
      settings,
      baseCapital,
      loading,
      error,
      addTrade,
      editTrade,
      removeTrade,
      setBaseCapital,
      reload: loadData,
    }}>
      {children}
    </TradeContext.Provider>
  )
}

export function useTrades() {
  const ctx = useContext(TradeContext)
  if (!ctx) throw new Error('useTrades must be used within TradeProvider')
  return ctx
}

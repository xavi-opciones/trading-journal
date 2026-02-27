import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TradeProvider } from './context/TradeContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewTrade from './pages/NewTrade'
import Positions from './pages/Positions'
import Analysis from './pages/Analysis'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <TradeProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new-trade" element={<NewTrade />} />
            <Route path="/positions" element={<Positions />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </TradeProvider>
    </BrowserRouter>
  )
}

// ─── P&L Calculations ────────────────────────────────────────

export function calculateRealizedPnL(trade) {
  const premium = Number(trade.premium_received) || 0
  const closeCost = Number(trade.close_price) || 0
  const commission = Number(trade.commission) || 0
  const contracts = Number(trade.contracts) || 1
  // P&L = (premium received - cost to close) * 100 * contracts - commissions
  return (premium - closeCost) * 100 * contracts - commission
}

export function calculateUnrealizedPnL(trade) {
  const premium = Number(trade.premium_received) || 0
  const currentPrice = Number(trade.current_price) || 0
  const commission = Number(trade.commission) || 0
  const contracts = Number(trade.contracts) || 1
  return (premium - currentPrice) * 100 * contracts - commission
}

export function calculateMaxLoss(trade) {
  const contracts = Number(trade.contracts) || 1

  switch (trade.strategy) {
    case 'Bull Put Spread': {
      const width = Math.abs((Number(trade.short_strike) || 0) - (Number(trade.long_strike) || 0))
      const premium = Number(trade.premium_received) || 0
      return (width - premium) * 100 * contracts
    }
    case 'Bear Call Spread': {
      const width = Math.abs((Number(trade.long_strike) || 0) - (Number(trade.short_strike) || 0))
      const premium = Number(trade.premium_received) || 0
      return (width - premium) * 100 * contracts
    }
    case 'Iron Condor': {
      const putWidth = Math.abs((Number(trade.short_strike) || 0) - (Number(trade.long_strike) || 0))
      const callWidth = Math.abs((Number(trade.long_call_strike) || 0) - (Number(trade.short_call_strike) || 0))
      const maxWidth = Math.max(putWidth, callWidth)
      const premium = Number(trade.premium_received) || 0
      return (maxWidth - premium) * 100 * contracts
    }
    case 'Wheel':
    case 'Covered Call': {
      // Collateral-based max loss
      return Number(trade.collateral) || 0
    }
    default:
      return Number(trade.max_loss) || 0
  }
}

// ─── Portfolio Metrics ───────────────────────────────────────

export function calculateMetrics(trades, baseCapital) {
  const closedTrades = trades.filter(t => t.status === 'closed' || t.status === 'expired')
  const openTrades = trades.filter(t => t.status === 'open')

  const wins = closedTrades.filter(t => Number(t.realized_pnl) > 0)
  const losses = closedTrades.filter(t => Number(t.realized_pnl) <= 0)

  const totalWins = wins.reduce((sum, t) => sum + Number(t.realized_pnl), 0)
  const totalLosses = Math.abs(losses.reduce((sum, t) => sum + Number(t.realized_pnl), 0))

  const totalRealizedPnL = closedTrades.reduce((sum, t) => sum + Number(t.realized_pnl), 0)
  const totalUnrealizedPnL = openTrades.reduce((sum, t) => {
    return sum + calculateUnrealizedPnL(t)
  }, 0)

  const winRate = closedTrades.length > 0
    ? (wins.length / closedTrades.length) * 100
    : 0

  const profitFactor = totalLosses > 0
    ? totalWins / totalLosses
    : totalWins > 0 ? Infinity : 0

  const avgWin = wins.length > 0 ? totalWins / wins.length : 0
  const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0

  const returnOnCapital = baseCapital > 0
    ? (totalRealizedPnL / baseCapital) * 100
    : 0

  const currentCapital = baseCapital + totalRealizedPnL

  const totalCollateral = openTrades.reduce((sum, t) => sum + (Number(t.collateral) || 0), 0)
  const availableCapital = currentCapital - totalCollateral

  return {
    totalTrades: trades.length,
    openTrades: openTrades.length,
    closedTrades: closedTrades.length,
    wins: wins.length,
    losses: losses.length,
    winRate,
    profitFactor,
    avgWin,
    avgLoss,
    totalRealizedPnL,
    totalUnrealizedPnL,
    totalPnL: totalRealizedPnL + totalUnrealizedPnL,
    returnOnCapital,
    baseCapital,
    currentCapital,
    totalCollateral,
    availableCapital,
  }
}

// ─── Equity Curve ────────────────────────────────────────────

export function buildEquityCurve(trades, baseCapital) {
  const closedTrades = trades
    .filter(t => t.status === 'closed' || t.status === 'expired')
    .filter(t => t.close_date)
    .sort((a, b) => new Date(a.close_date) - new Date(b.close_date))

  let cumulative = baseCapital
  const curve = [{ date: 'Start', equity: baseCapital, pnl: 0 }]

  closedTrades.forEach(trade => {
    const pnl = Number(trade.realized_pnl) || 0
    cumulative += pnl
    curve.push({
      date: trade.close_date,
      equity: cumulative,
      pnl,
      underlying: trade.underlying,
      strategy: trade.strategy,
    })
  })

  return curve
}

// ─── Analysis by Underlying ─────────────────────────────────

export function analyzeByUnderlying(trades) {
  const groups = {}

  trades.forEach(trade => {
    const sym = trade.underlying
    if (!groups[sym]) {
      groups[sym] = { underlying: sym, trades: [], totalPnL: 0, wins: 0, losses: 0, count: 0 }
    }
    groups[sym].trades.push(trade)
    groups[sym].count++

    if (trade.status === 'closed' || trade.status === 'expired') {
      const pnl = Number(trade.realized_pnl) || 0
      groups[sym].totalPnL += pnl
      if (pnl > 0) groups[sym].wins++
      else groups[sym].losses++
    }
  })

  return Object.values(groups)
    .map(g => ({
      ...g,
      winRate: (g.wins + g.losses) > 0 ? (g.wins / (g.wins + g.losses)) * 100 : 0,
    }))
    .sort((a, b) => b.totalPnL - a.totalPnL)
}

// ─── Analysis by Strategy ────────────────────────────────────

export function analyzeByStrategy(trades) {
  const groups = {}

  trades.forEach(trade => {
    const strat = trade.strategy
    if (!groups[strat]) {
      groups[strat] = { strategy: strat, totalPnL: 0, wins: 0, losses: 0, count: 0 }
    }
    groups[strat].count++

    if (trade.status === 'closed' || trade.status === 'expired') {
      const pnl = Number(trade.realized_pnl) || 0
      groups[strat].totalPnL += pnl
      if (pnl > 0) groups[strat].wins++
      else groups[strat].losses++
    }
  })

  return Object.values(groups)
    .map(g => ({
      ...g,
      winRate: (g.wins + g.losses) > 0 ? (g.wins / (g.wins + g.losses)) * 100 : 0,
    }))
    .sort((a, b) => b.totalPnL - a.totalPnL)
}

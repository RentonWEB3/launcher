import { useState } from 'react'
import type { MemeTask } from '../../../core/domain/types'
import { formatAddress } from '../lib/format'

interface BatchActionsPanelProps {
  task: MemeTask
  onBatchBuy: (amount: string, walletAddresses: string[]) => Promise<void>
  onBatchSell: (percent: number, walletAddresses: string[]) => Promise<void>
  onSellAllDev: () => Promise<void>
  onTransferTokens: (targetAddress: string, amount?: string) => Promise<void>
  onTransferBNB: (targetAddress: string, amount: string) => Promise<void>
  loading?: boolean
}

export default function BatchActionsPanel({
  task,
  onBatchBuy,
  onBatchSell,
  onSellAllDev,
  onTransferTokens,
  onTransferBNB,
  loading = false
}: BatchActionsPanelProps) {
  const [showBatchBuy, setShowBatchBuy] = useState(false)
  const [showBatchSell, setShowBatchSell] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  
  const [buyAmount, setBuyAmount] = useState('')
  const [sellPercent, setSellPercent] = useState('')
  const [transferTarget, setTransferTarget] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferType, setTransferType] = useState<'tokens' | 'bnb'>('tokens')
  const [error, setError] = useState<string | null>(null)

  const clusterWallets = task.clusterWalletAddresses

  const handleBatchBuy = async () => {
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      setError('Введите сумму BNB')
      return
    }
    if (clusterWallets.length === 0) {
      setError('Нет кошельков в кластере')
      return
    }
    try {
      setError(null)
      await onBatchBuy(buyAmount, clusterWallets)
      setShowBatchBuy(false)
      setBuyAmount('')
    } catch (err: any) {
      setError(err.message || 'Ошибка выполнения batch buy')
    }
  }

  const handleBatchSell = async () => {
    const percent = parseFloat(sellPercent)
    if (!sellPercent || percent <= 0 || percent > 100) {
      setError('Введите процент от 1 до 100')
      return
    }
    if (clusterWallets.length === 0) {
      setError('Нет кошельков в кластере')
      return
    }
    try {
      setError(null)
      await onBatchSell(percent, clusterWallets)
      setShowBatchSell(false)
      setSellPercent('')
    } catch (err: any) {
      setError(err.message || 'Ошибка выполнения batch sell')
    }
  }

  const handleSellAllDev = async () => {
    if (!confirm(`Продать все токены с dev wallet ${formatAddress(task.devWalletAddress)}?`)) {
      return
    }
    try {
      setError(null)
      await onSellAllDev()
    } catch (err: any) {
      setError(err.message || 'Ошибка продажи')
    }
  }

  const handleTransfer = async () => {
    if (!transferTarget || !/^0x[a-fA-F0-9]{40}$/.test(transferTarget)) {
      setError('Введите корректный адрес получателя')
      return
    }
    if (transferType === 'bnb' && (!transferAmount || parseFloat(transferAmount) <= 0)) {
      setError('Введите сумму BNB для перевода')
      return
    }
    try {
      setError(null)
      if (transferType === 'tokens') {
        await onTransferTokens(transferTarget, transferAmount || undefined)
      } else {
        await onTransferBNB(transferTarget, transferAmount)
      }
      setShowTransfer(false)
      setTransferTarget('')
      setTransferAmount('')
    } catch (err: any) {
      setError(err.message || 'Ошибка перевода')
    }
  }

  return (
    <div style={{
      background: '#2a2a2a',
      padding: '1.5rem',
      borderRadius: '8px',
      border: '1px solid #3a3a3a'
    }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Batch Actions</h2>

      {error && (
        <div style={{
          padding: '0.75rem',
          background: '#4a1a1a',
          border: '1px solid #6a2a2a',
          borderRadius: '4px',
          marginBottom: '1rem',
          color: '#ff6b6b'
        }}>
          {error}
        </div>
      )}

      {!task.tokenAddress && (
        <div style={{
          padding: '1rem',
          background: '#3a2a1a',
          border: '1px solid #4a3a2a',
          borderRadius: '4px',
          marginBottom: '1rem',
          color: '#ffa500'
        }}>
          Токен еще не создан. Сначала запустите токен.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {/* Batch Buy */}
        <div>
          <button
            onClick={() => setShowBatchBuy(true)}
            disabled={loading || !task.tokenAddress || clusterWallets.length === 0}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: !task.tokenAddress || clusterWallets.length === 0 ? '#3a3a3a' : '#4a9eff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: !task.tokenAddress || clusterWallets.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Batch Buy
          </button>
          {showBatchBuy && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: '#2a2a2a',
                padding: '2rem',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '500px',
                border: '1px solid #3a3a3a'
              }}>
                <h3 style={{ marginBottom: '1rem' }}>Batch Buy</h3>
                <p style={{ color: '#999', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Купить токены на {clusterWallets.length} кошельках
                </p>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Сумма BNB на кошелек
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#1a1a1a',
                      border: '1px solid #3a3a3a',
                      borderRadius: '4px',
                      color: '#e0e0e0',
                      fontSize: '1rem'
                    }}
                    placeholder="0.1"
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={handleBatchBuy}
                    disabled={loading || !buyAmount}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: buyAmount && !loading ? '#4a9eff' : '#3a3a3a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: buyAmount && !loading ? 'pointer' : 'not-allowed',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    {loading ? 'Выполнение...' : 'Выполнить'}
                  </button>
                  <button
                    onClick={() => {
                      setShowBatchBuy(false)
                      setBuyAmount('')
                      setError(null)
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#3a3a3a',
                      color: '#e0e0e0',
                      border: '1px solid #4a4a4a',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Batch Sell */}
        <div>
          <button
            onClick={() => setShowBatchSell(true)}
            disabled={loading || !task.tokenAddress || clusterWallets.length === 0}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: !task.tokenAddress || clusterWallets.length === 0 ? '#3a3a3a' : '#ff6b6b',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: !task.tokenAddress || clusterWallets.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Batch Sell %
          </button>
          {showBatchSell && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: '#2a2a2a',
                padding: '2rem',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '500px',
                border: '1px solid #3a3a3a'
              }}>
                <h3 style={{ marginBottom: '1rem' }}>Batch Sell</h3>
                <p style={{ color: '#999', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Продать процент токенов на {clusterWallets.length} кошельках
                </p>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Процент для продажи (1-100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={sellPercent}
                    onChange={(e) => setSellPercent(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#1a1a1a',
                      border: '1px solid #3a3a3a',
                      borderRadius: '4px',
                      color: '#e0e0e0',
                      fontSize: '1rem'
                    }}
                    placeholder="30"
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={handleBatchSell}
                    disabled={loading || !sellPercent}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: sellPercent && !loading ? '#ff6b6b' : '#3a3a3a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: sellPercent && !loading ? 'pointer' : 'not-allowed',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    {loading ? 'Выполнение...' : 'Выполнить'}
                  </button>
                  <button
                    onClick={() => {
                      setShowBatchSell(false)
                      setSellPercent('')
                      setError(null)
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#3a3a3a',
                      color: '#e0e0e0',
                      border: '1px solid #4a4a4a',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sell All Dev */}
        <div>
          <button
            onClick={handleSellAllDev}
            disabled={loading || !task.tokenAddress}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: !task.tokenAddress ? '#3a3a3a' : '#ff6b6b',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: !task.tokenAddress ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Sell All (Dev)
          </button>
        </div>

        {/* Transfer */}
        <div>
          <button
            onClick={() => setShowTransfer(true)}
            disabled={loading || !task.tokenAddress}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: !task.tokenAddress ? '#3a3a3a' : '#4a9eff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: !task.tokenAddress ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Transfer
          </button>
          {showTransfer && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: '#2a2a2a',
                padding: '2rem',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '500px',
                border: '1px solid #3a3a3a'
              }}>
                <h3 style={{ marginBottom: '1rem' }}>Transfer</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Тип перевода
                  </label>
                  <select
                    value={transferType}
                    onChange={(e) => setTransferType(e.target.value as 'tokens' | 'bnb')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#1a1a1a',
                      border: '1px solid #3a3a3a',
                      borderRadius: '4px',
                      color: '#e0e0e0',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="tokens">Токены</option>
                    <option value="bnb">BNB</option>
                  </select>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Адрес получателя
                  </label>
                  <input
                    type="text"
                    value={transferTarget}
                    onChange={(e) => setTransferTarget(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#1a1a1a',
                      border: '1px solid #3a3a3a',
                      borderRadius: '4px',
                      color: '#e0e0e0',
                      fontSize: '1rem',
                      fontFamily: 'monospace'
                    }}
                    placeholder="0x..."
                    autoFocus
                  />
                </div>
                {transferType === 'bnb' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Сумма BNB
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#1a1a1a',
                        border: '1px solid #3a3a3a',
                        borderRadius: '4px',
                        color: '#e0e0e0',
                        fontSize: '1rem'
                      }}
                      placeholder="0.1"
                    />
                  </div>
                )}
                {transferType === 'tokens' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Сумма токенов (опционально, если пусто - весь баланс)
                    </label>
                    <input
                      type="text"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#1a1a1a',
                        border: '1px solid #3a3a3a',
                        borderRadius: '4px',
                        color: '#e0e0e0',
                        fontSize: '1rem'
                      }}
                      placeholder="Оставить пустым для всего баланса"
                    />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={handleTransfer}
                    disabled={loading || !transferTarget}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: transferTarget && !loading ? '#4a9eff' : '#3a3a3a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: transferTarget && !loading ? 'pointer' : 'not-allowed',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    {loading ? 'Выполнение...' : 'Выполнить'}
                  </button>
                  <button
                    onClick={() => {
                      setShowTransfer(false)
                      setTransferTarget('')
                      setTransferAmount('')
                      setError(null)
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#3a3a3a',
                      color: '#e0e0e0',
                      border: '1px solid #4a4a4a',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


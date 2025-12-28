import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMemeTasksStore } from '../../state/memeTasks.store'
import { useWalletsStore } from '../../state/wallets.store'
import { useAppStore } from '../../state/store'
import { formatAddress } from '../../lib/format'
import MemeInfoPanel from '../../components/MemeInfoPanel'
import WalletClusterPanel from '../../components/WalletClusterPanel'
import TxLogPanel from '../../components/TxLogPanel'
import BatchActionsPanel from '../../components/BatchActionsPanel'
import {
  executeBatchBuy,
  executeBatchSell,
  executeSellAllDev,
  executeTransferTokens,
  executeTransferBNB
} from '../../lib/batchActions'

export default function MemeTask() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getTask, createTask, updateTask, loading } = useMemeTasksStore()
  const { wallets, loadWallets } = useWalletsStore()
  const { vaultUnlocked } = useAppStore()

  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [socialLink, setSocialLink] = useState('')
  const [logo, setLogo] = useState<string>('')
  const [devWalletAddress, setDevWalletAddress] = useState('')
  const [selectedClusterWallets, setSelectedClusterWallets] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [launchLoading, setLaunchLoading] = useState(false)

  const isEditMode = !!id
  const task = isEditMode ? getTask(id!) : null

  useEffect(() => {
    if (vaultUnlocked) {
      loadWallets()
    }
  }, [vaultUnlocked])

  useEffect(() => {
    if (task) {
      setName(task.name)
      setSymbol(task.symbol)
      setSocialLink(task.socialLink || '')
      setLogo(task.logo || '')
      setDevWalletAddress(task.devWalletAddress)
      setSelectedClusterWallets(task.clusterWalletAddresses)
    }
  }, [task, id])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setLogo(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!name || !symbol) {
      setError('Заполните обязательные поля: название и символ')
      return
    }
    if (!devWalletAddress) {
      setError('Выберите dev wallet')
      return
    }
    if (selectedClusterWallets.length === 0) {
      setError('Выберите хотя бы один кошелек для кластера')
      return
    }

    try {
      setError(null)
      const taskData = {
        name,
        symbol,
        socialLink: socialLink || undefined,
        logo: logo || undefined,
        devWalletAddress,
        clusterWalletAddresses: selectedClusterWallets
      }

      if (isEditMode) {
        await updateTask(id!, taskData)
      } else {
        const newId = await createTask(taskData)
        navigate(`/meme-task/${newId}`)
      }
    } catch (error: any) {
      setError(error.message || 'Ошибка сохранения задачи')
    }
  }

  const toggleClusterWallet = (address: string) => {
    setSelectedClusterWallets(prev =>
      prev.includes(address)
        ? prev.filter(a => a !== address)
        : [...prev, address]
    )
  }

  if (!vaultUnlocked) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Vault заблокирован. Разблокируйте vault в разделе Wallets.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>{isEditMode ? 'Редактировать задачу' : 'Создать задачу'}</h1>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#3a3a3a',
            color: '#e0e0e0',
            border: '1px solid #4a4a4a',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Назад
        </button>
      </div>

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Левая панель - Форма */}
        <div style={{
          background: '#2a2a2a',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #3a3a3a'
        }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Информация о меме</h2>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Название токена *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '4px',
                color: '#e0e0e0',
                fontSize: '1rem'
              }}
              placeholder="My Meme Token"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Символ *
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '4px',
                color: '#e0e0e0',
                fontSize: '1rem'
              }}
              placeholder="MMT"
              maxLength={10}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Социальная ссылка
            </label>
            <input
              type="url"
              value={socialLink}
              onChange={(e) => setSocialLink(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '4px',
                color: '#e0e0e0',
                fontSize: '1rem'
              }}
              placeholder="https://twitter.com/..."
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Логотип
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '4px',
                color: '#e0e0e0',
                fontSize: '1rem'
              }}
            />
            {logo && (
              <img
                src={logo}
                alt="Logo preview"
                style={{
                  width: '100px',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginTop: '0.5rem'
                }}
              />
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Dev Wallet *
            </label>
            <select
              value={devWalletAddress}
              onChange={(e) => setDevWalletAddress(e.target.value)}
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
              <option value="">Выберите кошелек</option>
              {wallets.map(w => (
                <option key={w.address} value={w.address}>
                  {w.name || formatAddress(w.address)} - {formatAddress(w.address)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !name || !symbol || !devWalletAddress}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading || !name || !symbol || !devWalletAddress ? '#3a3a3a' : '#4a9eff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !name || !symbol || !devWalletAddress ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              marginTop: '1rem'
            }}
          >
            {loading ? 'Сохранение...' : isEditMode ? 'Сохранить изменения' : 'Создать задачу'}
          </button>
        </div>

        {/* Правая панель - Кластер кошельков */}
        <div style={{
          background: '#2a2a2a',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #3a3a3a'
        }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Кластер кошельков</h2>

          {wallets.length === 0 ? (
            <p style={{ color: '#999' }}>Нет доступных кошельков. Добавьте кошельки в разделе Wallets.</p>
          ) : (
            <div style={{
              maxHeight: '500px',
              overflowY: 'auto'
            }}>
              {wallets.map(wallet => {
                const isSelected = selectedClusterWallets.includes(wallet.address)
                const isDev = wallet.address === devWalletAddress
                return (
                  <div
                    key={wallet.address}
                    onClick={() => !isDev && toggleClusterWallet(wallet.address)}
                    style={{
                      padding: '1rem',
                      marginBottom: '0.5rem',
                      background: isDev ? '#3a2a1a' : isSelected ? '#1a3a2a' : '#1a1a1a',
                      border: isSelected ? '1px solid #4a9eff' : '1px solid #3a3a3a',
                      borderRadius: '4px',
                      cursor: isDev ? 'not-allowed' : 'pointer',
                      opacity: isDev ? 0.6 : 1
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>
                          {wallet.name || 'Без имени'}
                          {isDev && <span style={{ marginLeft: '0.5rem', color: '#ffa500' }}>(Dev)</span>}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#999', fontFamily: 'monospace' }}>
                          {formatAddress(wallet.address)}
                        </div>
                      </div>
                      {isSelected && !isDev && (
                        <span style={{ color: '#4a9eff' }}>✓</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {selectedClusterWallets.length > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: '#1a3a2a',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              Выбрано: {selectedClusterWallets.length} кошельков
            </div>
          )}
        </div>
      </div>

      {/* Панель информации о меме (если задача создана) */}
      {isEditMode && task && (
        <>
          <div style={{
            background: '#2a2a2a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #3a3a3a',
            marginTop: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <MemeInfoPanel task={task} />
              </div>
              {!task.tokenAddress && (
                <button
                  onClick={async () => {
                    if (!task.logo) {
                      setError('Загрузите логотип перед запуском токена')
                      return
                    }
                    setLaunchLoading(true)
                    setError(null)
                    try {
                      const tokenAddress = await launchToken(
                        task.id,
                        task.devWalletAddress,
                        task.name,
                        task.symbol,
                        task.logo,
                        task.socialLink || ''
                      )
                      // Обновляем задачу с адресом токена
                      await updateTask(task.id, { tokenAddress })
                    } catch (err: any) {
                      setError(err.message || 'Ошибка запуска токена')
                    } finally {
                      setLaunchLoading(false)
                    }
                  }}
                  disabled={launchLoading || !task.logo}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: launchLoading || !task.logo ? '#3a3a3a' : '#4a9eff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: launchLoading || !task.logo ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    marginLeft: '1rem'
                  }}
                >
                  {launchLoading ? 'Запуск...' : 'Launch Token'}
                </button>
              )}
            </div>
          </div>

          {/* Панель batch actions */}
          {task.tokenAddress && (
            <div style={{ marginTop: '2rem' }}>
              <BatchActionsPanel
                task={task}
                onBatchBuy={async (amount, walletAddresses) => {
                  setBatchLoading(true)
                  try {
                    await executeBatchBuy(task.id, task.tokenAddress!, walletAddresses, amount)
                  } finally {
                    setBatchLoading(false)
                  }
                }}
                onBatchSell={async (percent, walletAddresses) => {
                  setBatchLoading(true)
                  try {
                    await executeBatchSell(task.id, task.tokenAddress!, walletAddresses, percent)
                  } finally {
                    setBatchLoading(false)
                  }
                }}
                onSellAllDev={async () => {
                  setBatchLoading(true)
                  try {
                    await executeSellAllDev(task.id, task.tokenAddress!, task.devWalletAddress)
                  } finally {
                    setBatchLoading(false)
                  }
                }}
                onTransferTokens={async (targetAddress, amount) => {
                  setBatchLoading(true)
                  try {
                    await executeTransferTokens(
                      task.id,
                      task.tokenAddress!,
                      task.devWalletAddress,
                      targetAddress,
                      amount
                    )
                  } finally {
                    setBatchLoading(false)
                  }
                }}
                onTransferBNB={async (targetAddress, amount) => {
                  setBatchLoading(true)
                  try {
                    await executeTransferBNB(
                      task.id,
                      task.devWalletAddress,
                      targetAddress,
                      amount
                    )
                  } finally {
                    setBatchLoading(false)
                  }
                }}
                loading={batchLoading}
              />
            </div>
          )}

          {/* Панель логов транзакций */}
          <div style={{ marginTop: '2rem' }}>
            <TxLogPanel taskId={task.id} />
          </div>
        </>
      )}
    </div>
  )
}

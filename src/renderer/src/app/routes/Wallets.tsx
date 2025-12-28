import { useEffect, useState } from 'react'
import { useAppStore } from '../../state/store'
import { useWalletsStore } from '../../state/wallets.store'
import { isValidPrivateKey } from '../../lib/validators'
import { formatAddress } from '../../lib/format'

export default function Wallets() {
  const { 
    vaultExists, 
    vaultUnlocked, 
    loading: appLoading,
    checkVaultStatus,
    createVault,
    unlockVault,
    lockVault
  } = useAppStore()
  
  const { 
    wallets, 
    loading: walletsLoading, 
    error,
    loadWallets,
    addWallet,
    deleteWallet
  } = useWalletsStore()
  
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCreateVault, setShowCreateVault] = useState(false)
  const [showAddWallet, setShowAddWallet] = useState(false)
  const [privateKey, setPrivateKey] = useState('')
  const [walletName, setWalletName] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    checkVaultStatus()
  }, [checkVaultStatus])

  useEffect(() => {
    if (vaultUnlocked) {
      loadWallets()
    }
  }, [vaultUnlocked, loadWallets])

  const handleCreateVault = async () => {
    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('Пароль должен быть не менее 8 символов')
      return
    }
    try {
      setErrorMessage(null)
      await createVault(newPassword)
      setShowCreateVault(false)
      setNewPassword('')
    } catch (error: any) {
      setErrorMessage(error.message || 'Ошибка создания vault')
    }
  }

  const handleUnlock = async () => {
    if (!password) {
      setErrorMessage('Введите пароль')
      return
    }
    try {
      setErrorMessage(null)
      await unlockVault(password)
      setPassword('')
    } catch (error: any) {
      setErrorMessage(error.message || 'Неверный пароль')
    }
  }

  const handleAddWallet = async () => {
    if (!privateKey) {
      setErrorMessage('Введите приватный ключ')
      return
    }
    if (!isValidPrivateKey(privateKey)) {
      setErrorMessage('Неверный формат приватного ключа')
      return
    }
    try {
      setErrorMessage(null)
      await addWallet(privateKey, walletName || undefined)
      setPrivateKey('')
      setWalletName('')
      setShowAddWallet(false)
    } catch (error: any) {
      setErrorMessage(error.message || 'Ошибка добавления кошелька')
    }
  }

  const handleDeleteWallet = async (address: string) => {
    if (!confirm(`Удалить кошелек ${formatAddress(address)}?`)) {
      return
    }
    try {
      await deleteWallet(address)
    } catch (error: any) {
      setErrorMessage(error.message || 'Ошибка удаления кошелька')
    }
  }

  if (appLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Загрузка...</p>
      </div>
    )
  }

  // Создание vault
  if (!vaultExists) {
    return (
      <div style={{ padding: '2rem', maxWidth: '500px' }}>
        <h1>Создание Vault</h1>
        <p style={{ marginBottom: '1.5rem', color: '#999' }}>
          Создайте защищенное хранилище для ваших кошельков. Пароль будет использован для шифрования приватных ключей.
        </p>
        
        {errorMessage && (
          <div style={{
            padding: '0.75rem',
            background: '#4a1a1a',
            border: '1px solid #6a2a2a',
            borderRadius: '4px',
            marginBottom: '1rem',
            color: '#ff6b6b'
          }}>
            {errorMessage}
          </div>
        )}
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Пароль (минимум 8 символов)
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid #3a3a3a',
              borderRadius: '4px',
              color: '#e0e0e0',
              fontSize: '1rem'
            }}
            placeholder="Введите пароль"
          />
        </div>
        
        <button
          onClick={handleCreateVault}
          disabled={!newPassword || newPassword.length < 8}
          style={{
            padding: '0.75rem 1.5rem',
            background: newPassword && newPassword.length >= 8 ? '#4a9eff' : '#3a3a3a',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: newPassword && newPassword.length >= 8 ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          Создать Vault
        </button>
      </div>
    )
  }

  // Разблокировка vault
  if (!vaultUnlocked) {
    return (
      <div style={{ padding: '2rem', maxWidth: '500px' }}>
        <h1>Разблокировка Vault</h1>
        <p style={{ marginBottom: '1.5rem', color: '#999' }}>
          Введите пароль для доступа к кошелькам
        </p>
        
        {errorMessage && (
          <div style={{
            padding: '0.75rem',
            background: '#4a1a1a',
            border: '1px solid #6a2a2a',
            borderRadius: '4px',
            marginBottom: '1rem',
            color: '#ff6b6b'
          }}>
            {errorMessage}
          </div>
        )}
        
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid #3a3a3a',
              borderRadius: '4px',
              color: '#e0e0e0',
              fontSize: '1rem'
            }}
            placeholder="Введите пароль"
            autoFocus
          />
        </div>
        
        <button
          onClick={handleUnlock}
          disabled={!password}
          style={{
            padding: '0.75rem 1.5rem',
            background: password ? '#4a9eff' : '#3a3a3a',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: password ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
            fontWeight: '500',
            width: '100%'
          }}
        >
          Разблокировать
        </button>
      </div>
    )
  }

  // Основной интерфейс управления кошельками
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Управление кошельками</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setShowAddWallet(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#4a9eff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            + Добавить кошелек
          </button>
          <button
            onClick={lockVault}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#3a3a3a',
              color: '#e0e0e0',
              border: '1px solid #4a4a4a',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Заблокировать
          </button>
        </div>
      </div>

      {errorMessage && (
        <div style={{
          padding: '0.75rem',
          background: '#4a1a1a',
          border: '1px solid #6a2a2a',
          borderRadius: '4px',
          marginBottom: '1rem',
          color: '#ff6b6b'
        }}>
          {errorMessage}
        </div>
      )}

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

      {showAddWallet && (
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
            <h2 style={{ marginBottom: '1.5rem' }}>Добавить кошелек</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Приватный ключ
              </label>
              <input
                type="password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
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
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Имя (опционально)
              </label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '4px',
                  color: '#e0e0e0',
                  fontSize: '1rem'
                }}
                placeholder="Wallet 1"
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleAddWallet}
                disabled={!privateKey || !isValidPrivateKey(privateKey)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: privateKey && isValidPrivateKey(privateKey) ? '#4a9eff' : '#3a3a3a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: privateKey && isValidPrivateKey(privateKey) ? 'pointer' : 'not-allowed',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Добавить
              </button>
              <button
                onClick={() => {
                  setShowAddWallet(false)
                  setPrivateKey('')
                  setWalletName('')
                  setErrorMessage(null)
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

      {walletsLoading ? (
        <p>Загрузка кошельков...</p>
      ) : wallets.length === 0 ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          color: '#999'
        }}>
          <p>Нет кошельков. Добавьте первый кошелек.</p>
        </div>
      ) : (
        <div style={{
          background: '#2a2a2a',
          borderRadius: '8px',
          border: '1px solid #3a3a3a',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1a1a1a', borderBottom: '1px solid #3a3a3a' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '500' }}>Имя</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '500' }}>Адрес</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '500' }}>Добавлен</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '500' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((wallet) => (
                <tr key={wallet.address} style={{ borderBottom: '1px solid #3a3a3a' }}>
                  <td style={{ padding: '1rem' }}>{wallet.name || 'Без имени'}</td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    {formatAddress(wallet.address)}
                  </td>
                  <td style={{ padding: '1rem', color: '#999', fontSize: '0.9rem' }}>
                    {new Date(wallet.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDeleteWallet(wallet.address)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#4a1a1a',
                        color: '#ff6b6b',
                        border: '1px solid #6a2a2a',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

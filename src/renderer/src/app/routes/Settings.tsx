import { useState, useEffect } from 'react'
import { useAppStore } from '../../state/store'

export default function Settings() {
  const { vaultUnlocked, lockVault } = useAppStore()
  const [userDataPath, setUserDataPath] = useState<string>('')

  useEffect(() => {
    window.electronAPI.getUserDataPath().then(setUserDataPath)
  }, [])

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h1 style={{ marginBottom: '2rem' }}>Настройки</h1>

      <div style={{
        background: '#2a2a2a',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #3a3a3a',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Безопасность</h2>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ color: '#999', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Статус Vault
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            {vaultUnlocked ? (
              <span style={{ color: '#4a9eff' }}>● Разблокирован</span>
            ) : (
              <span style={{ color: '#999' }}>● Заблокирован</span>
            )}
          </div>
          {vaultUnlocked && (
            <button
              onClick={lockVault}
              style={{
                padding: '0.5rem 1rem',
                background: '#3a3a3a',
                color: '#e0e0e0',
                border: '1px solid #4a4a4a',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Заблокировать Vault
            </button>
          )}
        </div>
      </div>

      <div style={{
        background: '#2a2a2a',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #3a3a3a',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Хранилище</h2>
        <div>
          <div style={{ color: '#999', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Путь к данным приложения
          </div>
          <div style={{
            padding: '0.75rem',
            background: '#1a1a1a',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            wordBreak: 'break-all',
            color: '#999'
          }}>
            {userDataPath || 'Загрузка...'}
          </div>
        </div>
      </div>

      <div style={{
        background: '#2a2a2a',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #3a3a3a'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>О приложении</h2>
        <div style={{ color: '#999', fontSize: '0.9rem' }}>
          <p style={{ marginBottom: '0.5rem' }}>MemeOps Terminal v0.1.0</p>
          <p style={{ marginBottom: '0.5rem' }}>
            Утилита для управления мем-токенами на BNB Chain
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Важно:</strong> Приватные ключи хранятся только в зашифрованном виде.
            Пароль vault не сохраняется и не передается.
          </p>
        </div>
      </div>
    </div>
  )
}

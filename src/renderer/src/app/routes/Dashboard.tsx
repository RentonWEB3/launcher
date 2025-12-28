import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useMemeTasksStore } from '../../state/memeTasks.store'
import { formatAddress } from '../../lib/format'
import TxLogPanel from '../../components/TxLogPanel'

export default function Dashboard() {
  const { tasks, loading, loadTasks } = useMemeTasksStore()

  useEffect(() => {
    loadTasks()
  }, [])

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Dashboard</h1>
        <Link
          to="/meme-task"
          style={{
            padding: '0.75rem 1.5rem',
            background: '#4a9eff',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          + Создать задачу
        </Link>
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : tasks.length === 0 ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          background: '#2a2a2a',
          borderRadius: '8px',
          border: '1px solid #3a3a3a'
        }}>
          <p style={{ color: '#999', marginBottom: '1rem' }}>Нет задач</p>
          <Link
            to="/meme-task"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: '#4a9eff',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Создать первую задачу
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {tasks.map((task) => (
            <Link
              key={task.id}
              to={`/meme-task/${task.id}`}
              style={{
                display: 'block',
                padding: '1.5rem',
                background: '#2a2a2a',
                borderRadius: '8px',
                border: '1px solid #3a3a3a',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#4a9eff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#3a3a3a'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                {task.logo && (
                  <img
                    src={task.logo}
                    alt={task.name}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      marginRight: '1rem',
                      objectFit: 'cover'
                    }}
                  />
                )}
                <div>
                  <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>{task.name}</h3>
                  <p style={{ margin: 0, color: '#999', fontSize: '0.9rem' }}>{task.symbol}</p>
                </div>
              </div>
              
              {task.tokenAddress && (
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#999' }}>
                  <strong>Токен:</strong> {formatAddress(task.tokenAddress)}
                </div>
              )}
              
              <div style={{ fontSize: '0.85rem', color: '#999' }}>
                <div>Кошельков в кластере: {task.clusterWalletAddresses.length}</div>
                <div style={{ marginTop: '0.25rem' }}>
                  Создано: {new Date(task.createdAt).toLocaleDateString('ru-RU')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Панель логов транзакций */}
      <div style={{ marginTop: '3rem' }}>
        <TxLogPanel />
      </div>
    </div>
  )
}

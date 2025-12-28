import { useEffect, useState } from 'react'
import { useTxLogsStore } from '../state/txLogs.store'
import { useMemeTasksStore } from '../state/memeTasks.store'
import { useWalletsStore } from '../state/wallets.store'
import { formatAddress } from '../lib/format'

interface TxLogPanelProps {
  taskId?: string
  walletAddress?: string
}

export default function TxLogPanel({ taskId, walletAddress }: TxLogPanelProps) {
  const { logs, loading, filters, loadLogs, setFilters } = useTxLogsStore()
  const { tasks } = useMemeTasksStore()
  const { wallets } = useWalletsStore()

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'success' | 'fail'>('all')
  const [selectedTaskId, setSelectedTaskId] = useState<string>(taskId || 'all')
  const [selectedWalletAddress, setSelectedWalletAddress] = useState<string>(walletAddress || 'all')

  useEffect(() => {
    const filters: any = {}
    if (selectedTaskId !== 'all') filters.taskId = selectedTaskId
    if (selectedWalletAddress !== 'all') filters.walletAddress = selectedWalletAddress
    if (statusFilter !== 'all') filters.status = statusFilter

    setFilters(filters)
  }, [selectedTaskId, selectedWalletAddress, statusFilter, setFilters])

  useEffect(() => {
    loadLogs(filters)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#4a9eff'
      case 'fail':
        return '#ff6b6b'
      case 'pending':
        return '#ffa500'
      default:
        return '#999'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Успешно'
      case 'fail':
        return 'Ошибка'
      case 'pending':
        return 'Ожидание'
      default:
        return status
    }
  }

  const getTaskName = (taskId?: string) => {
    if (!taskId) return '—'
    const task = tasks.find(t => t.id === taskId)
    return task ? task.name : taskId.slice(0, 8)
  }

  const getWalletName = (address: string) => {
    const wallet = wallets.find(w => w.address.toLowerCase() === address.toLowerCase())
    return wallet?.name || formatAddress(address)
  }

  return (
    <div style={{
      background: '#2a2a2a',
      borderRadius: '8px',
      border: '1px solid #3a3a3a',
      padding: '1.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Логи транзакций</h2>
        <button
          onClick={() => loadLogs(filters)}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            background: '#3a3a3a',
            color: '#e0e0e0',
            border: '1px solid #4a4a4a',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem'
          }}
        >
          {loading ? 'Загрузка...' : 'Обновить'}
        </button>
      </div>

      {/* Фильтры */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1rem',
        background: '#1a1a1a',
        borderRadius: '4px'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#999' }}>
            Задача
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: '#2a2a2a',
              border: '1px solid #3a3a3a',
              borderRadius: '4px',
              color: '#e0e0e0',
              fontSize: '0.9rem'
            }}
          >
            <option value="all">Все задачи</option>
            {tasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#999' }}>
            Кошелек
          </label>
          <select
            value={selectedWalletAddress}
            onChange={(e) => setSelectedWalletAddress(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: '#2a2a2a',
              border: '1px solid #3a3a3a',
              borderRadius: '4px',
              color: '#e0e0e0',
              fontSize: '0.9rem'
            }}
          >
            <option value="all">Все кошельки</option>
            {wallets.map(wallet => (
              <option key={wallet.address} value={wallet.address}>
                {wallet.name || formatAddress(wallet.address)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#999' }}>
            Статус
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: '#2a2a2a',
              border: '1px solid #3a3a3a',
              borderRadius: '4px',
              color: '#e0e0e0',
              fontSize: '0.9rem'
            }}
          >
            <option value="all">Все</option>
            <option value="pending">Ожидание</option>
            <option value="success">Успешно</option>
            <option value="fail">Ошибка</option>
          </select>
        </div>
      </div>

      {/* Таблица логов */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
          Загрузка логов...
        </div>
      ) : logs.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
          Нет логов транзакций
        </div>
      ) : (
        <div style={{
          background: '#1a1a1a',
          borderRadius: '4px',
          border: '1px solid #3a3a3a',
          overflow: 'hidden',
          maxHeight: '500px',
          overflowY: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#2a2a2a', zIndex: 1 }}>
              <tr style={{ borderBottom: '1px solid #3a3a3a' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '500', fontSize: '0.85rem' }}>Время</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '500', fontSize: '0.85rem' }}>Действие</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '500', fontSize: '0.85rem' }}>Задача</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '500', fontSize: '0.85rem' }}>Кошелек</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '500', fontSize: '0.85rem' }}>Tx Hash</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '500', fontSize: '0.85rem' }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #3a3a3a' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#999' }}>
                    {new Date(log.timestamp).toLocaleString('ru-RU')}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>
                    {log.action}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#999' }}>
                    {getTaskName(log.taskId)}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    {getWalletName(log.walletAddress)}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    <a
                      href={`https://bscscan.com/tx/${log.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#4a9eff', textDecoration: 'none' }}
                    >
                      {formatAddress(log.txHash)}
                    </a>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: getStatusColor(log.status) + '20',
                      color: getStatusColor(log.status),
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: '500'
                    }}>
                      {getStatusText(log.status)}
                    </span>
                    {log.error && (
                      <div style={{
                        marginTop: '0.25rem',
                        fontSize: '0.75rem',
                        color: '#ff6b6b',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }} title={log.error}>
                        {log.error}
                      </div>
                    )}
                    {log.confirmations !== undefined && (
                      <div style={{
                        marginTop: '0.25rem',
                        fontSize: '0.75rem',
                        color: '#999'
                      }}>
                        Подтверждений: {log.confirmations}
                      </div>
                    )}
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

import type { MemeTask } from '../../../core/domain/types'
import { formatAddress } from '../lib/format'

interface WalletClusterPanelProps {
  task: MemeTask
  wallets: Array<{ address: string; name?: string }>
}

export default function WalletClusterPanel({ task, wallets }: WalletClusterPanelProps) {
  const clusterWallets = wallets.filter(w => 
    task.clusterWalletAddresses.includes(w.address)
  )

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Кластер кошельков</h2>
      {clusterWallets.length === 0 ? (
        <p style={{ color: '#999' }}>Нет кошельков в кластере</p>
      ) : (
        <div style={{
          background: '#1a1a1a',
          borderRadius: '4px',
          border: '1px solid #3a3a3a',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#2a2a2a', borderBottom: '1px solid #3a3a3a' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '500', fontSize: '0.9rem' }}>Имя</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '500', fontSize: '0.9rem' }}>Адрес</th>
              </tr>
            </thead>
            <tbody>
              {clusterWallets.map((wallet) => (
                <tr key={wallet.address} style={{ borderBottom: '1px solid #3a3a3a' }}>
                  <td style={{ padding: '0.75rem' }}>{wallet.name || 'Без имени'}</td>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {formatAddress(wallet.address)}
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


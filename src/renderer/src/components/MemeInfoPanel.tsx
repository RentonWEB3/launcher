import type { MemeTask } from '../../../core/domain/types'
import { formatAddress } from '../lib/format'

interface MemeInfoPanelProps {
  task: MemeTask
}

export default function MemeInfoPanel({ task }: MemeInfoPanelProps) {
  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Информация о меме</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        <div>
          <div style={{ color: '#999', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Название</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{task.name}</div>
        </div>
        <div>
          <div style={{ color: '#999', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Символ</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{task.symbol}</div>
        </div>
        {task.tokenAddress && (
          <div>
            <div style={{ color: '#999', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Адрес токена</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {formatAddress(task.tokenAddress)}
            </div>
          </div>
        )}
        {task.socialLink && (
          <div>
            <div style={{ color: '#999', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Социальная ссылка</div>
            <a
              href={task.socialLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#4a9eff', textDecoration: 'none' }}
            >
              Открыть
            </a>
          </div>
        )}
        <div>
          <div style={{ color: '#999', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Dev Wallet</div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
            {formatAddress(task.devWalletAddress)}
          </div>
        </div>
        <div>
          <div style={{ color: '#999', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Кошельков в кластере</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{task.clusterWalletAddresses.length}</div>
        </div>
      </div>
      {task.logo && (
        <div style={{ marginTop: '1rem' }}>
          <img
            src={task.logo}
            alt={task.name}
            style={{
              width: '100px',
              height: '100px',
              objectFit: 'cover',
              borderRadius: '8px'
            }}
          />
        </div>
      )}
    </div>
  )
}


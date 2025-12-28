import { Link, useLocation } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/wallets', label: 'Wallets' },
    { path: '/meme-task', label: 'Meme Task' },
    { path: '/settings', label: 'Settings' }
  ]

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <nav style={{
        width: '200px',
        background: '#2a2a2a',
        padding: '1rem',
        borderRight: '1px solid #3a3a3a'
      }}>
        <h2 style={{ marginBottom: '2rem', fontSize: '1.2rem' }}>MemeOps</h2>
        <ul style={{ listStyle: 'none' }}>
          {navItems.map(item => (
            <li key={item.path} style={{ marginBottom: '0.5rem' }}>
              <Link
                to={item.path}
                style={{
                  display: 'block',
                  padding: '0.75rem',
                  color: location.pathname === item.path ? '#4a9eff' : '#e0e0e0',
                  textDecoration: 'none',
                  background: location.pathname === item.path ? '#3a3a3a' : 'transparent',
                  borderRadius: '4px'
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}


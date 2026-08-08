import { Link } from 'react-router-dom'

// Tombol chat yang menonjol dengan badge notifikasi
export default function ChatButton({ to, state, hasUnread = false, size = 40 }) {
  return (
    <Link to={to} state={state} style={{
      position: 'relative',
      width: size, height: size, borderRadius: 13, flexShrink: 0,
      background: hasUnread
        ? 'var(--k-accent)'
        : 'rgba(var(--k-accent-rgb),0.10)',
      border: `1.5px solid ${hasUnread ? 'transparent' : 'rgba(var(--k-accent-rgb),0.3)'}`,
      boxShadow: hasUnread ? '0 4px 16px rgba(var(--k-accent-rgb),0.45)' : '0 2px 8px rgba(0,0,0,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.48, textDecoration: 'none',
      animation: hasUnread ? 'chatPulse 2s infinite' : 'none',
    }}>
      <style>{`
        @keyframes chatPulse {
          0%,100% { box-shadow: 0 4px 16px rgba(var(--k-accent-rgb),0.45); }
          50%      { box-shadow: 0 4px 24px rgba(var(--k-accent-rgb),0.75); }
        }
      `}</style>
      💬
      {hasUnread && (
        <span style={{
          position: 'absolute', top: -4, right: -4,
          width: 14, height: 14, borderRadius: '50%',
          background: 'var(--k-danger)', border: '2px solid var(--k-card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, fontWeight: 900, color: '#fff',
        }}>●</span>
      )}
    </Link>
  )
}

import { SVC } from '../utils/svcTheme'

const MODULE_META = {
  zasago:   { emoji: '🛵', label: 'ZasaGo',   svc: SVC.zasago },
  zasafood: { emoji: '🍔', label: 'ZasaFood', svc: SVC.zasafood },
  zasamart: { emoji: '🛒', label: 'ZasaMart', svc: SVC.zasashop },
}

function OrderDetail({ order, module }) {
  if (module === 'zasago') {
    return (
      <div style={{ margin: '0 16px 16px', background: 'var(--k-input)', border: '1px solid var(--k-border)', borderRadius: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: order.item_description ? 10 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4, flexShrink: 0 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#00C896' }} />
            <div style={{ width: 2, height: 20, background: 'var(--k-border2)', margin: '3px 0' }} />
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#F56565' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'var(--k-text)', fontSize: 13, fontWeight: 600, marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {order.pickup_address}
            </p>
            <p style={{ color: 'var(--k-muted)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {order.dropoff_address}
            </p>
          </div>
        </div>
        {order.item_description && (
          <p style={{ color: 'var(--k-muted)', fontSize: 12, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--k-border)' }}>
            📦 {order.item_description}
          </p>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--k-border)', flexWrap: 'wrap' }}>
          <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: 'var(--k-card)', color: 'var(--k-sub)' }}>
            {order.payment_method === 'cod' ? '💵 COD' : '💳 Wallet'}
          </span>
          {order.require_photo && (
            <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: 'rgba(246,173,85,0.1)', color: '#F6AD55', border: '1px solid rgba(246,173,85,0.25)' }}>
              📸 Wajib Foto
            </span>
          )}
        </div>
      </div>
    )
  }

  // ZasaFood & ZasaMart
  const storeName = order.restaurant_name ?? order.seller_name ?? '—'
  const label     = module === 'zasafood' ? '🍽️ Dari Restoran' : '🏪 Dari Toko'
  return (
    <div style={{ margin: '0 16px 16px', background: 'var(--k-input)', border: '1px solid var(--k-border)', borderRadius: 16, padding: '14px 16px' }}>
      <p style={{ color: 'var(--k-muted)', fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
      <p style={{ color: 'var(--k-text)', fontSize: 15, fontWeight: 800, marginBottom: 10 }}>{storeName}</p>
      {order.order_number && (
        <p style={{ color: 'var(--k-muted)', fontSize: 12, marginBottom: 10 }}>No. Order: #{order.order_number}</p>
      )}
      <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--k-border)', flexWrap: 'wrap' }}>
        <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: 'var(--k-card)', color: 'var(--k-sub)' }}>
          {order.payment_method === 'cod' ? '💵 COD' : '💳 Wallet'}
        </span>
      </div>
    </div>
  )
}

export default function NewOrderBanner({ order, total, accepting, onAccept, onDismiss }) {
  const module = order._module ?? 'zasago'
  const meta   = MODULE_META[module] ?? MODULE_META.zasago
  const svc    = meta.svc

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'flex-end',
      background: 'rgba(0,0,0,0.5)',
      animation: 'overlayIn 0.25s ease',
    }}>
      <style>{`
        @keyframes overlayIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes sheetUp    { from { transform:translateY(100%) } to { transform:translateY(0) } }
        @keyframes orderPulse { 0%,100%{box-shadow:0 0 0 0 rgba(${svc.rgb},0.5)} 50%{box-shadow:0 0 0 16px rgba(${svc.rgb},0)} }
        @keyframes spin       { to { transform:rotate(360deg) } }
      `}</style>

      <div style={{
        width: '100%', background: 'var(--k-card)',
        borderRadius: '28px 28px 0 0',
        boxShadow: `0 -10px 40px rgba(${svc.rgb},0.3), var(--k-shadow-lg)`,
        animation: 'sheetUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        padding: '8px 0 32px',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--k-border2)', margin: '8px auto 20px' }} />

        {total > 1 && (
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span style={{ padding: '4px 14px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: 'rgba(246,173,85,0.12)', color: '#F6AD55', border: '1px solid rgba(246,173,85,0.3)' }}>
              +{total - 1} order lagi menunggu
            </span>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: 20, padding: '0 20px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 24, margin: '0 auto 14px',
            background: svc.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, animation: 'orderPulse 2s infinite',
            boxShadow: `0 6px 14px rgba(${svc.rgb},0.24), inset 0 1.5px 0 rgba(255,255,255,0.7)`,
          }}>
            {meta.emoji}
          </div>
          <p style={{ fontSize: 11, fontWeight: 700, color: svc.fg, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
            {meta.label}
          </p>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--k-muted)', marginBottom: 6 }}>
            Order Baru Masuk!
          </p>
          <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--k-text)' }}>
            Rp {Number(order.shipping_fee ?? 0).toLocaleString('id-ID')}
          </p>
        </div>

        <OrderDetail order={order} module={module} />

        <div style={{ display: 'flex', gap: 12, padding: '0 16px' }}>
          <button onClick={onDismiss} style={{
            flex: 1, padding: '16px', borderRadius: 999, fontSize: 15, fontWeight: 700,
            background: 'var(--k-input)', color: 'var(--k-sub)', border: '1px solid var(--k-border)', cursor: 'pointer',
          }}>
            Lewati
          </button>
          <button onClick={onAccept} disabled={accepting} style={{
            flex: 2, padding: '16px', borderRadius: 999, fontSize: 15, fontWeight: 800,
            background: accepting ? 'var(--k-input)' : 'var(--k-primary)',
            color: accepting ? 'var(--k-muted)' : '#fff',
            border: 'none', cursor: accepting ? 'not-allowed' : 'pointer',
            boxShadow: accepting ? 'none' : '0 4px 10px -2px rgba(30,40,55,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {accepting
              ? <><span style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Menerima...</>
              : '✅ Terima Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CurvedHeader({ children, className = '' }) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #4C3BCF 0%, #6C5CE7 100%)',
        borderBottomLeftRadius: '50px 25px',
        borderBottomRightRadius: '50px 25px',
        position: 'relative',
        overflow: 'hidden',
      }}
      className={`px-5 pt-6 pb-8 -mx-4 -mt-5 md:-mx-6 md:-mt-6 mb-6 ${className}`}
    >
      {/* Dekorasi lingkaran transparan */}
      <div style={{
        position: 'absolute', width: 220, height: 220,
        background: 'rgba(255,255,255,0.07)', borderRadius: '50%',
        top: -80, right: -50, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 140, height: 140,
        background: 'rgba(189,180,255,0.12)', borderRadius: '50%',
        top: 30, right: 100, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 100, height: 100,
        background: 'rgba(255,255,255,0.05)', borderRadius: '50%',
        bottom: -20, left: 30, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 60, height: 60,
        background: 'rgba(189,180,255,0.18)', borderRadius: '50%',
        top: 15, left: 60, pointerEvents: 'none',
      }} />

      {/* Konten */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

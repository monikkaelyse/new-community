function BoardPage() {
  return (
    <div className="page">
      <h1>Message Board</h1>
      <p className="page-subtitle">Posts are encrypted with your community&apos;s shared key</p>
      <span className="encrypted-badge">Community Encrypted</span>

      <div className="card" style={{ marginTop: '1.5rem', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>
          Message board will be implemented in Phase 6 with community-key encryption.
        </p>
      </div>
    </div>
  )
}

export default BoardPage

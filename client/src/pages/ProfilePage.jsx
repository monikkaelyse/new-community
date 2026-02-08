function ProfilePage() {
  return (
    <div className="page">
      <h1>Your Profile</h1>
      <p className="page-subtitle">Manage your identity and encryption keys</p>

      <div className="card">
        <h3>Profile Info</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Profile management will be implemented in Phase 4.
        </p>
      </div>

      <div className="card">
        <h3>Your Public Key</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
          Other users use this key to encrypt messages only you can read.
        </p>
        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
          Public key will appear here after login...
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

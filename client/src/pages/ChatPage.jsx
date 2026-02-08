function ChatPage() {
  return (
    <div className="page">
      <h1>Encrypted Chat</h1>
      <p className="page-subtitle">End-to-end encrypted — the server cannot read your messages</p>
      <span className="encrypted-badge">E2E Encrypted</span>

      <div className="card" style={{ marginTop: '1.5rem', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>
          Chat will be implemented in Phase 5 with full E2E encryption via WebSockets.
        </p>
      </div>
    </div>
  )
}

export default ChatPage

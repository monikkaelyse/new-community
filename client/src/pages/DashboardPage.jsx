import './DashboardPage.css'

function DashboardPage() {
  return (
    <div className="page dashboard-page">
      <h1>Dashboard</h1>
      <p className="page-subtitle">Your encrypted community hub</p>

      <div className="dashboard-grid">
        <div className="card dashboard-card">
          <div className="dashboard-card-header">
            <span className="dashboard-icon">&#x1f4ac;</span>
            <h3>Encrypted Chat</h3>
          </div>
          <p>Real-time messaging with end-to-end encryption. Only you and the recipient can read messages.</p>
          <span className="encrypted-badge">E2E Encrypted</span>
        </div>

        <div className="card dashboard-card">
          <div className="dashboard-card-header">
            <span className="dashboard-icon">&#x1f4cb;</span>
            <h3>Message Board</h3>
          </div>
          <p>Community discussions encrypted with a shared key. Posts are unreadable to outsiders.</p>
          <span className="encrypted-badge">Community Encrypted</span>
        </div>

        <div className="card dashboard-card">
          <div className="dashboard-card-header">
            <span className="dashboard-icon">&#x1f465;</span>
            <h3>Members</h3>
          </div>
          <p>View community members and their public keys for secure communication.</p>
          <span className="encrypted-badge">Verified Keys</span>
        </div>

        <div className="card dashboard-card">
          <div className="dashboard-card-header">
            <span className="dashboard-icon">&#x1f6e1;</span>
            <h3>Privacy Status</h3>
          </div>
          <p>Your private key is encrypted locally. The server never sees your plaintext data.</p>
          <span className="encrypted-badge">Zero Knowledge</span>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage

import { useGame } from '../contexts/GameContext'

export default function BroadcastBanner() {
  const { notifications, dismissedNotificationIds, dismissNotification } = useGame()

  const activeNotifs = notifications.filter((n) => !dismissedNotificationIds.includes(n.id))

  if (activeNotifs.length === 0) return null

  // Show the latest broadcast
  const latest = activeNotifs[0]

  return (
    <div className="battleworld-broadcast-banner">
      <div className="broadcast-container">
        <div className="broadcast-prefix">
          <span className="broadcast-icon">📢</span>
          <span className="broadcast-tag">OFFICIAL BROADCAST //</span>
        </div>
        <div className="broadcast-content">
          <span className="broadcast-title">{latest.title}:</span>
          <span className="broadcast-text">{latest.content}</span>
        </div>
        <button
          type="button"
          className="broadcast-close"
          onClick={() => dismissNotification(latest.id)}
          title="Dismiss Announcement"
        >
          ✕
        </button>
      </div>

      <style>{`
        .battleworld-broadcast-banner {
          background: linear-gradient(90deg, rgba(199, 58, 50, 0.95), rgba(138, 98, 56, 0.95), rgba(199, 58, 50, 0.95));
          color: #fff;
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.82rem;
          border-bottom: 2px solid var(--signal, #f0b93d);
          box-shadow: 0 4px 15px rgba(199, 58, 50, 0.35);
          position: relative;
          z-index: 200;
          animation: bannerSlideDown 0.3s ease-out;
        }

        @keyframes bannerSlideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .broadcast-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0.5rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .broadcast-prefix {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--signal, #f0b93d);
          flex-shrink: 0;
        }

        .broadcast-icon {
          animation: broadcastPulse 1.5s infinite;
        }

        @keyframes broadcastPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        .broadcast-content {
          flex: 1;
          display: flex;
          gap: 0.5rem;
          align-items: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .broadcast-title {
          font-weight: bold;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .broadcast-text {
          color: #f1f5f9;
        }

        .broadcast-close {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
          cursor: pointer;
          font-size: 0.75rem;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .broadcast-close:hover {
          background: rgba(0, 0, 0, 0.6);
          border-color: #fff;
          color: var(--danger, #c73a32);
        }

        @media (max-width: 768px) {
          .broadcast-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.3rem;
          }
          .broadcast-content {
            white-space: normal;
          }
        }
      `}</style>
    </div>
  )
}

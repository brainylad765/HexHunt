import { useNavigate, useLocation } from 'react-router-dom'
import { useGame } from '../contexts/GameContext'
import { setFreezeScoreboard } from '../services/ctfd'
import CommandButton from './CommandButton'

export default function OverseerHUD() {
  const { isAdmin, isScoreboardFrozen, refreshFromCtfd, state } = useGame()
  const navigate = useNavigate()
  const location = useLocation()

  if (!isAdmin) return null

  const isOnAdminPage = location.pathname === '/admin'

  const handleToggleFreeze = async () => {
    const nextState = !isScoreboardFrozen
    const confirmed = window.confirm(
      nextState
        ? 'FREEZE SCOREBOARD: Do you want to freeze the scoreboard for all operatives?'
        : 'UNFREEZE SCOREBOARD: Do you want to resume live score updates for all operatives?'
    )
    if (!confirmed) return

    await setFreezeScoreboard(nextState)
    await refreshFromCtfd()
  }

  return (
    <div className="overseer-hud">
      <div className="overseer-hud__inner">
        <div className="overseer-hud__left">
          <span className="overseer-hud__crown">👑</span>
          <span className="overseer-hud__badge">ADMIN OVERSEER</span>
          <span className="overseer-hud__divider">|</span>
          <span className="overseer-hud__user">
            LOGGED IN: <strong>{state.ctfdUser?.name?.toUpperCase() || 'ADMIN'}</strong>
          </span>
          <span className="overseer-hud__divider">|</span>
          <span className="overseer-hud__mode">
            VIEW: <strong style={{ color: isOnAdminPage ? 'var(--danger, #c73a32)' : 'var(--emerald, #2be066)' }}>
              {isOnAdminPage ? 'ADMIN CONTROL PANEL' : 'OPERATIVE PLAYER GRID'}
            </strong>
          </span>
          {isScoreboardFrozen && (
            <span className="overseer-hud__frozen-pill">
              ❄️ SCOREBOARD FROZEN
            </span>
          )}
        </div>

        <div className="overseer-hud__right">
          {isOnAdminPage ? (
            <button
              type="button"
              className="hud-btn hud-btn--green"
              onClick={() => navigate('/hub')}
              title="Switch to Operative View to see challenges and player experience"
            >
              🎮 SWITCH TO OPERATIVE VIEW
            </button>
          ) : (
            <button
              type="button"
              className="hud-btn hud-btn--red"
              onClick={() => navigate('/admin')}
              title="Open full Administrative Control Panel"
            >
              ⚡ LAUNCH ADMIN PANEL
            </button>
          )}

          <button
            type="button"
            className={`hud-btn ${isScoreboardFrozen ? 'hud-btn--gold' : 'hud-btn--outline'}`}
            onClick={handleToggleFreeze}
            title={isScoreboardFrozen ? 'Unfreeze Scoreboard' : 'Freeze Scoreboard'}
          >
            {isScoreboardFrozen ? '☀️ UNFREEZE SCORE' : '❄️ FREEZE SCORE'}
          </button>

          <a
            href="http://localhost:8000/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="hud-link"
            title="Open CTFd Flask Admin backend on port 8000"
          >
            CTFd BACKEND ↗
          </a>
        </div>
      </div>

      <style>{`
        .overseer-hud {
          background: #0f0707;
          border-bottom: 2px solid var(--danger, #c73a32);
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.75rem;
          color: #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 150;
          box-shadow: 0 4px 20px rgba(199, 58, 50, 0.3);
        }

        .overseer-hud__inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0.4rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .overseer-hud__left {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
        }

        .overseer-hud__crown {
          font-size: 0.9rem;
          filter: drop-shadow(0 0 4px #ffd700);
        }

        .overseer-hud__badge {
          background: rgba(199, 58, 50, 0.3);
          color: #ff6b6b;
          border: 1px solid rgba(199, 58, 50, 0.6);
          padding: 0.15rem 0.5rem;
          border-radius: 3px;
          font-weight: 800;
          letter-spacing: 0.05em;
        }

        .overseer-hud__divider {
          color: #4a5568;
        }

        .overseer-hud__frozen-pill {
          background: rgba(56, 189, 248, 0.2);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.5);
          padding: 0.15rem 0.5rem;
          border-radius: 3px;
          font-weight: bold;
          font-size: 0.7rem;
        }

        .overseer-hud__right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .hud-btn {
          font-family: var(--mono-font, 'Space Mono', monospace);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.25rem 0.65rem;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid transparent;
        }

        .hud-btn--red {
          background: var(--danger, #c73a32);
          color: #fff;
          border-color: #ff6b6b;
          box-shadow: 0 0 10px rgba(199, 58, 50, 0.4);
        }
        .hud-btn--red:hover {
          background: #e0453c;
          box-shadow: 0 0 15px rgba(199, 58, 50, 0.6);
        }

        .hud-btn--green {
          background: rgba(43, 224, 102, 0.2);
          color: var(--emerald-bright, #55ff88);
          border-color: var(--emerald, #2be066);
        }
        .hud-btn--green:hover {
          background: rgba(43, 224, 102, 0.35);
        }

        .hud-btn--gold {
          background: rgba(240, 185, 61, 0.2);
          color: var(--signal, #f0b93d);
          border-color: var(--signal, #f0b93d);
        }
        .hud-btn--gold:hover {
          background: rgba(240, 185, 61, 0.35);
        }

        .hud-btn--outline {
          background: transparent;
          color: #cbd5e1;
          border-color: #4a5568;
        }
        .hud-btn--outline:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: #94a3b8;
        }

        .hud-link {
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          transition: all 0.2s ease;
        }
        .hud-link:hover {
          color: #fff;
          border-color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  )
}

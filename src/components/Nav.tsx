import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useGame } from '../contexts/GameContext'
import StoneCounter from './StoneCounter'
import CommandButton from './CommandButton'
import AuthModal from './AuthModal'

export default function Nav() {
  const { state, isAdmin, refreshFromCtfd } = useGame()
  const navigate = useNavigate()
  const location = useLocation()
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  const isLoggedIn = !!state.ctfdUser
  const operativeName = state.ctfdUser?.name || state.participant?.name || 'OPERATIVE'
  const teamName = state.ctfdTeam?.name || state.participant?.teamName || 'TEAM ALPHA'
  const score = state.ctfdTeam?.score ?? state.participant?.score ?? 0

  const isOnAdminPage = location.pathname === '/admin'

  return (
    <>
      <nav className={`doom-nav ${isAdmin ? 'doom-nav--admin' : ''}`}>
        <div className="doom-nav__container">
          <div className="doom-nav__logo" onClick={() => navigate('/hub')}>
            {isOnAdminPage ? (
              <span style={{ color: '#ff6b6b' }}>◆ HEXHUNT // ADMIN CONSOLE</span>
            ) : (
              <span>◆ HEXHUNT // DOOMSDAY</span>
            )}
          </div>
          
          <div 
            className={`doom-nav__operative ${!isLoggedIn ? 'doom-nav__operative--guest' : ''} ${isAdmin ? 'doom-nav__operative--overseer' : ''}`}
            onClick={() => setIsAuthOpen(true)}
            style={{ cursor: 'pointer' }}
            title={isLoggedIn ? 'Click to view profile or switch operative' : 'Click to authenticate with CTFd'}
          >
            {isLoggedIn ? (
              isAdmin ? (
                <>
                  <span style={{ color: '#ffd700', fontWeight: 'bold' }}>👑 OVERSEER:</span>
                  <span className="doom-nav__name" style={{ color: '#fff' }}>{operativeName.toUpperCase()}</span>
                  <span className="doom-nav__team" style={{ color: '#ff6b6b' }}>[SUPERUSER]</span>
                  <span className="doom-nav__status-dot" style={{ background: 'var(--danger, #c73a32)', boxShadow: '0 0 8px #ff6b6b' }} />
                  <span className="doom-nav__status-text" style={{ color: '#ff6b6b' }}>ROOT ACCESS</span>
                </>
              ) : (
                <>
                  <span className="doom-nav__label">OPERATIVE:</span>
                  <span className="doom-nav__name">{operativeName.toUpperCase()}</span>
                  <span className="doom-nav__team">[{teamName.toUpperCase()}]</span>
                  <span className="doom-nav__score">{score} PTS</span>
                  <span className="doom-nav__status-dot" />
                  <span className="doom-nav__status-text">SYNCED</span>
                </>
              )
            ) : (
              <>
                <span style={{ color: 'var(--signal, #f0b93d)', fontWeight: 'bold' }}>🔑 OPERATIVE LOGIN</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>[CLICK TO AUTHENTICATE]</span>
              </>
            )}
          </div>
          
          <div className="doom-nav__stones">
            <StoneCounter collected={state.stones} compact />
          </div>
          
          <div className="doom-nav__actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isAdmin && (
              isOnAdminPage ? (
                <CommandButton
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/hub')}
                  style={{
                    borderColor: 'var(--emerald, #2be066)',
                    background: 'rgba(43, 224, 102, 0.2)',
                    color: 'var(--emerald-bright, #55ff88)',
                    boxShadow: '0 0 10px rgba(43, 224, 102, 0.3)',
                  }}
                  title="Switch to Operative View to see challenges as players see them"
                >
                  🎮 OPERATIVE VIEW
                </CommandButton>
              ) : (
                <CommandButton
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  style={{
                    borderColor: 'var(--danger, #c73a32)',
                    background: 'rgba(199, 58, 50, 0.3)',
                    color: '#fff',
                    boxShadow: '0 0 12px rgba(199, 58, 50, 0.5)',
                  }}
                  title="Open Administrative Oversight Console"
                >
                  ⚡ ADMIN PANEL
                </CommandButton>
              )
            )}

            <CommandButton
              variant="ghost"
              size="sm"
              onClick={() => navigate('/scoreboard')}
              title="Open Battleworld Tactical Scoreboard"
            >
              📊 SCOREBOARD
            </CommandButton>
            <CommandButton
              variant={isLoggedIn ? "ghost" : "primary"}
              size="sm"
              onClick={() => setIsAuthOpen(true)}
              title={isLoggedIn ? "Operative Profile & Session" : "Log in to CTFd"}
            >
              {isLoggedIn ? (isAdmin ? "👑 OVERSEER" : "👤 PROFILE") : "🔑 LOGIN"}
            </CommandButton>
            <CommandButton 
              variant="ghost" 
              size="sm"
              onClick={() => {
                refreshFromCtfd()
              }}
              title="Force sync with CTFd backend authority"
            >
              ⟳ SYNC
            </CommandButton>
          </div>
        </div>
        <div className="doom-nav__energy-line" />
      </nav>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <style>{`
        .doom-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--s1, #0A0D0A);
          border-bottom: 1px solid rgba(138, 98, 56, 0.3);
          font-family: var(--mono-font, 'Space Mono', monospace);
          text-transform: uppercase;
        }

        .doom-nav--admin {
          border-bottom-color: rgba(199, 58, 50, 0.5);
        }

        .doom-nav__container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.5rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .doom-nav__logo {
          font-family: var(--heading-font, 'Barlow Condensed', sans-serif);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--emerald, #2BE066);
          text-shadow: 0 0 10px var(--emerald-glow, rgba(43, 224, 102, 0.4));
          cursor: pointer;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .doom-nav__operative {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.85rem;
          color: var(--text-secondary, #AAB8AE);
          background: rgba(16, 21, 16, 0.8);
          padding: 0.35rem 1.2rem;
          border: 1px solid rgba(43, 224, 102, 0.25);
          border-radius: 4px;
        }

        .doom-nav__operative--overseer {
          border-color: rgba(199, 58, 50, 0.5) !important;
          background: rgba(30, 10, 10, 0.8) !important;
          box-shadow: 0 0 12px rgba(199, 58, 50, 0.25);
        }

        .doom-nav__label {
          color: var(--text-muted, #66736A);
        }

        .doom-nav__name {
          color: #fff;
          font-weight: bold;
        }

        .doom-nav__team {
          color: var(--signal, #f0b93d);
          font-size: 0.75rem;
          font-weight: bold;
        }

        .doom-nav__score {
          color: var(--emerald, #2BE066);
          font-weight: bold;
          background: rgba(43, 224, 102, 0.15);
          padding: 2px 8px;
          border-radius: 3px;
        }

        .doom-nav__status-dot {
          width: 6px;
          height: 6px;
          background: var(--emerald, #2BE066);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--emerald, #2BE066);
          animation: pulse 2s infinite;
        }

        .doom-nav__status-text {
          color: var(--emerald, #2BE066);
          font-size: 0.7rem;
          letter-spacing: 0.1em;
        }

        .doom-nav__stones {
          display: flex;
          align-items: center;
        }

        .doom-nav__link-btn {
          color: #fff;
          text-decoration: none;
          font-size: 0.75rem;
          padding: 6px 12px;
          border: 1px solid var(--border, #333);
          border-radius: 4px;
          background: var(--s2, #181e19);
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
        }

        .doom-nav__link-btn:hover {
          border-color: var(--emerald, #2BE066);
          color: var(--emerald, #2BE066);
          box-shadow: 0 0 10px rgba(43, 224, 102, 0.2);
        }

        .doom-nav__energy-line {
          height: 2px;
          width: 100%;
          background: linear-gradient(90deg, 
            transparent 0%, 
            var(--emerald, #2BE066) 50%, 
            transparent 100%
          );
          background-size: 200% 100%;
          animation: energySlide 3s linear infinite;
          opacity: 0.5;
        }

        @keyframes energySlide {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }

        @media (max-width: 900px) {
          .doom-nav__container {
            padding: 0.5rem;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .doom-nav__operative {
            order: 3;
            width: 100%;
            justify-content: center;
          }
          
          .doom-nav__logo {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </>
  )
}
